import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PaymentRequestService } from '../../services/payment-request.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private poService = inject(PurchaseOrderService);
  private paymentRequestService = inject(PaymentRequestService);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  distributors: any[] = [];
  pendingPurchaseOrders: any[] = [];
  recentOrders: any[] = [];
  paymentReminders: any[] = [];
  selectedDistributorFilter: number | null = null;
  approvingPOId: number | null = null;
  rejectingPOId: number | null = null;

  topProductsToday: any[] = [];
  topProductsWeek: any[] = [];
  topProductsMonth: any[] = [];
  topProductsYear: any[] = [];
  topDistributors: any[] = [];
  leastDistributors: any[] = [];
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  selectedDistributorForProducts: number | null = null;
  reportFromDate: string = this.getTodayDateString();
  reportToDate: string = this.getTodayDateString();
  activeTab: string = 'today';

  // Crop & Disease Report
  cropWiseSales: any[] = [];
  diseaseWiseSales: any[] = [];
  cropDiseaseFromDate: string = `${new Date().getFullYear()}-01-01`;
  cropDiseaseToDate: string = new Date().toISOString().split('T')[0];
  selectedDistributorForCropDisease: number | null = null;
  cropDiseaseActiveTab: string = 'crop';

  stats = {
    totalDistributors: 0,
    pendingPOCount: 0,
    pendingPOAmount: 0,
    todaySalesAmount: 0,
    pendingPaymentReminders: 0,
    pendingPaymentAmount: 0,
    oldestPendingPaymentDays: 0
  };
  loading = false;

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.loadDistributors();
    this.loadPendingPurchaseOrders();
    this.loadPaymentReminders();
    this.loadRecentOrders();
    this.loadTopProductsReports();
    this.loadDistributorReports();
    this.loadCropDiseaseReports();
  }

  getYearStartDateString(): string {
    const today = new Date();
    return `${today.getFullYear()}-01-01`;
  }

  loadTopProductsReports() {
    const today = this.getTodayDateString();
    const distParam = this.selectedDistributorForProducts ? `&distributorId=${this.selectedDistributorForProducts}` : '';

    this.http.get<any>(`${environment.APIUrl}/reports/top-products-week?fromDate=${today}&toDate=${today}${distParam}`).subscribe({
      next: (res) => (this.topProductsToday = (res.data?.data || []).slice(0, 10)),
      error: (err) => console.error('Error loading top products today:', err)
    });

    this.http.get<any>(`${environment.APIUrl}/reports/top-products-week${distParam}`).subscribe({
      next: (res) => (this.topProductsWeek = (res.data?.data || []).slice(0, 10)),
      error: (err) => console.error('Error loading top products week:', err)
    });

    const month = this.selectedMonth,
      year = this.selectedYear;
    this.http.get<any>(`${environment.APIUrl}/reports/top-products-month?month=${month}&year=${year}${distParam}`).subscribe({
      next: (res) => (this.topProductsMonth = (res.data?.data || []).slice(0, 10)),
      error: (err) => console.error('Error loading top products month:', err)
    });

    this.http.get<any>(`${environment.APIUrl}/reports/top-products-year?year=${year}${distParam}`).subscribe({
      next: (res) => (this.topProductsYear = (res.data?.data || []).slice(0, 10)),
      error: (err) => console.error('Error loading top products year:', err)
    });
  }

  onDistributorFilterChange() {
    this.loadTopProductsReports();
  }

  loadDistributorReports() {
    const from = this.reportFromDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const to = this.reportToDate || new Date().toISOString();

    this.http.get<any>(`${environment.APIUrl}/reports/top-distributors-sales?fromDate=${from}&toDate=${to}`).subscribe({
      next: (res) => (this.topDistributors = (res.data?.data || []).slice(0, 10)),
      error: (err) => console.error('Error loading top distributors:', err)
    });

    this.http.get<any>(`${environment.APIUrl}/reports/least-performing-distributors?fromDate=${from}&toDate=${to}`).subscribe({
      next: (res) => (this.leastDistributors = (res.data?.data || []).slice(0, 10)),
      error: (err) => console.error('Error loading least distributors:', err)
    });
  }

  onMonthYearChange() {
    this.loadTopProductsReports();
  }

  onDateRangeChange() {
    this.loadDistributorReports();
  }

  loadCropDiseaseReports() {
    const from = this.cropDiseaseFromDate || this.getYearStartDateString();
    const to = this.cropDiseaseToDate || this.getTodayDateString();
    const distParam = this.selectedDistributorForCropDisease ? `&distributorId=${this.selectedDistributorForCropDisease}` : '';

    this.http.get<any>(`${environment.APIUrl}/reports/crop-wise-sales?fromDate=${from}&toDate=${to}${distParam}`).subscribe({
      next: (res) => (this.cropWiseSales = res.data?.data || []),
      error: (err) => console.error('Error loading crop-wise sales:', err)
    });

    this.http.get<any>(`${environment.APIUrl}/reports/disease-wise-sales?fromDate=${from}&toDate=${to}${distParam}`).subscribe({
      next: (res) => (this.diseaseWiseSales = res.data?.data || []),
      error: (err) => console.error('Error loading disease-wise sales:', err)
    });
  }

  onCropDiseaseDateChange() {
    this.loadCropDiseaseReports();
  }

  onCropDiseaseDistributorChange() {
    this.loadCropDiseaseReports();
  }

  loadDistributors() {
    this.userService.getDistributors().subscribe({
      next: (data) => {
        this.distributors = data.data || [];
        this.stats.totalDistributors = this.distributors.length;
      },
      error: (err) => console.error('Error loading distributors:', err)
    });
  }

  loadPendingPurchaseOrders() {
    this.poService.getPurchaseOrders('', 'PENDING', 1, 100).subscribe({
      next: (res: any) => {
        this.pendingPurchaseOrders = res.data || [];
        this.stats.pendingPOCount = this.pendingPurchaseOrders.length;
        this.stats.pendingPOAmount = this.pendingPurchaseOrders.reduce((sum, po) => sum + parseFloat(po.totalAmount || 0), 0);
      },
      error: (err) => console.error('Error loading pending POs:', err)
    });
  }

  loadPaymentReminders() {
    this.paymentRequestService.getPaymentRequests('pending').subscribe({
      next: (data) => {
        this.paymentReminders = (data.data || [])
          .filter((pr: any) => pr.status === 'pending')
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this.stats.pendingPaymentReminders = this.paymentReminders.length;
        this.stats.pendingPaymentAmount = this.paymentReminders.reduce((sum, pr) => sum + parseFloat(pr.amount || 0), 0);

        // Calculate oldest pending payment days
        if (this.paymentReminders.length > 0) {
          const oldestDate = new Date(this.paymentReminders[this.paymentReminders.length - 1].createdAt);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - oldestDate.getTime());
          this.stats.oldestPendingPaymentDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      },
      error: (err) => console.error('Error loading payment reminders:', err)
    });
  }

  loadRecentOrders() {
    this.poService.getPurchaseOrders('', '', 1, 10).subscribe({
      next: (res: any) => {
        this.recentOrders = (res.data || []).filter((po: any) => this.isToday(po.createdAt));

        // If no orders today, show all recent orders
        if (this.recentOrders.length === 0) {
          this.recentOrders = res.data || [];
        }

        this.stats.todaySalesAmount = this.recentOrders.reduce((sum, po) => sum + parseFloat(po.totalAmount || 0), 0);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading recent orders:', err);
        this.loading = false;
      }
    });
  }

  isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  getDistributorName(distributorOrId: any): string {
    // If it's an object with name/businessName, use that
    if (distributorOrId && typeof distributorOrId === 'object') {
      if (distributorOrId.businessName) return distributorOrId.businessName;
      if (distributorOrId.ownerName) return distributorOrId.ownerName;
      if (distributorOrId.name) return distributorOrId.name;
      if (distributorOrId.firstName) {
        const firstName = distributorOrId.firstName || '';
        const lastName = distributorOrId.lastName || '';
        return `${firstName} ${lastName}`.trim() || 'Unknown';
      }
    }

    // If it's an ID, look it up
    if (typeof distributorOrId === 'number') {
      const distributor = this.distributors.find((d) => d.id === distributorOrId);
      if (distributor) {
        if (distributor.businessName) return distributor.businessName;
        if (distributor.ownerName) return distributor.ownerName;
        const firstName = distributor.firstName || '';
        const lastName = distributor.lastName || '';
        return `${firstName} ${lastName}`.trim() || 'Unknown';
      }
    }

    return 'Unknown';
  }

  filterRecentOrdersByDistributor() {
    if (!this.selectedDistributorFilter) {
      this.loadRecentOrders();
    } else {
      this.poService.getPurchaseOrders('', '', 1, 100, undefined, undefined, this.selectedDistributorFilter).subscribe({
        next: (res: any) => {
          this.recentOrders = res.data || [];
          this.stats.todaySalesAmount = this.recentOrders.reduce((sum, po) => sum + parseFloat(po.totalAmount || 0), 0);
        },
        error: (err) => console.error('Error filtering orders:', err)
      });
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  approvePurchaseOrder(po: any) {
    if (confirm(`Approve Purchase Order ${po.poNo}?`)) {
      this.approvingPOId = po.id;
      this.poService.updatePurchaseOrderStatus(po.id, 'APPROVED').subscribe({
        next: () => {
          alert('Purchase Order approved successfully!');
          this.loadPendingPurchaseOrders();
          this.loadRecentOrders();
          this.approvingPOId = null;
        },
        error: (err) => {
          alert('Failed to approve purchase order');
          this.approvingPOId = null;
        }
      });
    }
  }

  rejectPurchaseOrder(po: any) {
    if (confirm(`Reject Purchase Order ${po.poNo}?`)) {
      this.rejectingPOId = po.id;
      this.poService.updatePurchaseOrderStatus(po.id, 'REJECTED').subscribe({
        next: () => {
          alert('Purchase Order rejected successfully!');
          this.loadPendingPurchaseOrders();
          this.loadRecentOrders();
          this.rejectingPOId = null;
        },
        error: (err) => {
          alert('Failed to reject purchase order');
          this.rejectingPOId = null;
        }
      });
    }
  }
}
