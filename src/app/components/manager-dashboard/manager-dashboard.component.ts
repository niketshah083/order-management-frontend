import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { ManagerService } from '../../services/manager.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss'],
})
export class ManagerDashboardComponent implements OnInit {
  private orderService = inject(OrderService);
  private managerService = inject(ManagerService);

  pendingOrders: any[] = [];
  paymentRequests: any[] = [];
  rejectionReason = '';
  selectedOrder: any = null;
  selectedPayment: any = null;
  loading = false;

  ngOnInit() {
    this.loadPendingOrders();
    this.loadPaymentRequests();
  }

  loadPendingOrders() {
    this.loading = true;
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.pendingOrders = data.data?.filter((o: any) => o.approvalStatus === 'pending') || [];
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  loadPaymentRequests() {
    this.managerService.getPaymentRequests('pending').subscribe({
      next: (data) => {
        this.paymentRequests = data.data || [];
      },
    });
  }

  approveOrder(orderId: number) {
    this.managerService.approveOrder(orderId.toString()).subscribe({
      next: () => {
        alert('Order approved successfully');
        this.loadPendingOrders();
      },
      error: (err) => alert('Error approving order: ' + err.error?.message),
    });
  }

  rejectOrder(orderId: number) {
    if (!this.rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    this.managerService.rejectOrder(orderId.toString(), this.rejectionReason).subscribe({
      next: () => {
        alert('Order rejected successfully');
        this.rejectionReason = '';
        this.loadPendingOrders();
      },
      error: (err) => alert('Error rejecting order: ' + err.error?.message),
    });
  }

  markPaymentAsPaid(paymentId: number) {
    this.managerService.updatePaymentStatus(paymentId.toString(), 'paid').subscribe({
      next: () => {
        alert('Payment marked as paid');
        this.loadPaymentRequests();
      },
      error: (err) => alert('Error updating payment: ' + err.error?.message),
    });
  }

  requestPayment(paymentId: number) {
    this.managerService.updatePaymentStatus(paymentId.toString(), 'pending').subscribe({
      next: () => {
        alert('Payment request sent');
        this.loadPaymentRequests();
      },
      error: (err) => alert('Error requesting payment: ' + err.error?.message),
    });
  }
}
