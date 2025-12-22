import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BillingService, ApiBilling } from '../../services/purchase-order.service';
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from '../shared/ui/modal.component';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Bills & Invoices</h1>
          <p class="text-gray-500 mt-1">Manage bills with Draft → Approved → Completed workflow</p>
        </div>
      </div>

      <!-- Status Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
          <p class="text-amber-600 text-xs font-semibold uppercase">Draft Bills</p>
          <p class="text-3xl font-bold text-amber-900 mt-1">{{ stats().draftCount }}</p>
        </div>
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <p class="text-blue-600 text-xs font-semibold uppercase">Approved</p>
          <p class="text-3xl font-bold text-blue-900 mt-1">{{ stats().approvedCount }}</p>
        </div>
        <div class="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <p class="text-green-600 text-xs font-semibold uppercase">Completed</p>
          <p class="text-3xl font-bold text-green-900 mt-1">{{ stats().completedCount }}</p>
        </div>
      </div>

      <!-- Status Filter -->
      <div class="mb-6 flex flex-wrap gap-2">
        <button
          (click)="filterByStatus('')"
          [ngClass]="{'bg-indigo-600 text-white border-indigo-600': selectedStatus === '', 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50': selectedStatus !== ''}"
          class="px-4 py-2 border rounded-full font-medium text-sm transition-all"
        >
          📋 All Bills
        </button>
        <button
          (click)="filterByStatus('draft')"
          [ngClass]="{'bg-amber-600 text-white border-amber-600': selectedStatus === 'draft', 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50': selectedStatus !== 'draft'}"
          class="px-4 py-2 border rounded-full font-medium text-sm transition-all"
        >
          ✏️ Draft
        </button>
        <button
          (click)="filterByStatus('approved')"
          [ngClass]="{'bg-blue-600 text-white border-blue-600': selectedStatus === 'approved', 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50': selectedStatus !== 'approved'}"
          class="px-4 py-2 border rounded-full font-medium text-sm transition-all"
        >
          ✓ Approved
        </button>
        <button
          (click)="filterByStatus('completed')"
          [ngClass]="{'bg-green-600 text-white border-green-600': selectedStatus === 'completed', 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50': selectedStatus !== 'completed'}"
          class="px-4 py-2 border rounded-full font-medium text-sm transition-all"
        >
          ✔ Completed
        </button>
      </div>

      <!-- Search Bar -->
      <div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-6">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (input)="onSearch()"
          placeholder="Search by bill number, invoice number, or customer name..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <!-- Bills Table -->
      <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        @if (bills().length > 0) {
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">Bill No</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">Invoice</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
              <th class="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (bill of bills(); track bill.id) {
            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 text-sm text-gray-900 font-medium">{{ bill.billNo }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ bill.invoiceNo || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">Customer #{{ bill.customerId }}</td>
              <td class="px-6 py-4 text-sm font-semibold text-gray-900">₹{{ (bill.finalAmount | number: '1.2-2') }}</td>
              <td class="px-6 py-4 text-sm">
                @if (bill.approvalStatus === 'draft') {
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">✏️ Draft</span>
                } @else if (bill.approvalStatus === 'approved') {
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">✓ Approved</span>
                } @else {
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✔ Completed</span>
                }
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ bill.billDate | date: 'dd-MMM-yyyy' }}</td>
              <td class="px-6 py-4 space-x-2 text-center">
                @if (bill.approvalStatus === 'draft') {
                <button
                  (click)="editBill(bill.id)"
                  class="bg-orange-600 hover:bg-orange-700 text-white w-10 h-10 rounded text-lg transition-all inline-flex items-center justify-center"
                  title="Edit this bill"
                >
                  ✎
                </button>
                <button
                  (click)="approveBill(bill.id)"
                  class="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded text-lg transition-all inline-flex items-center justify-center"
                  title="Approve this bill"
                >
                  ✓
                </button>
                <button
                  (click)="deleteBill(bill.id)"
                  class="bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded text-lg transition-all inline-flex items-center justify-center"
                  title="Delete this bill"
                >
                  🗑
                </button>
                } @else if (bill.approvalStatus === 'approved') {
                <button
                  (click)="printInvoice(bill.id)"
                  class="bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded text-lg transition-all inline-flex items-center justify-center"
                  title="Print invoice (PDF)"
                >
                  🖨
                </button>
                }
                <button
                  (click)="viewDetails(bill.id)"
                  class="bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded text-lg transition-all inline-flex items-center justify-center"
                  title="View bill details"
                >
                  👁
                </button>
              </td>
            </tr>
            }
          </tbody>
        </table>
        } @else {
        <div class="p-12 text-center">
          <p class="text-gray-500 text-lg">No bills found</p>
        </div>
        }
      </div>
    </div>
  `,
})
export class BillingListComponent implements OnInit {
  private billingService = inject(BillingService);
  private auth = inject(AuthService);
  private router = inject(Router);

  bills = signal<ApiBilling[]>([]);
  searchQuery = '';
  selectedStatus = '';
  stats = signal({ draftCount: 0, approvedCount: 0, completedCount: 0 });

  ngOnInit() {
    this.loadBills();
  }

  loadBills() {
    this.billingService.getBillings(this.searchQuery, this.selectedStatus).subscribe({
      next: (res: any) => {
        const billsData = res.data || [];
        this.bills.set(billsData);
        this.updateStats(billsData);
      },
      error: (err: any) => {
        console.error('Error loading bills:', err);
        alert('Failed to load bills');
      },
    });
  }

  updateStats(billsData: ApiBilling[]) {
    const stats = {
      draftCount: billsData.filter((b) => b.approvalStatus === 'draft').length,
      approvedCount: billsData.filter((b) => b.approvalStatus === 'approved').length,
      completedCount: billsData.filter((b) => b.status === 'completed').length,
    };
    this.stats.set(stats);
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.loadBills();
  }

  onSearch() {
    this.loadBills();
  }

  editBill(billId: number) {
    this.router.navigate(['/billing/edit', billId]);
  }

  approveBill(billId: number) {
    if (!confirm('Are you sure you want to approve this bill? Once approved, it cannot be edited.')) return;

    this.billingService.approveBilling(billId).subscribe({
      next: () => {
        alert('Bill approved successfully! Invoice number generated.');
        this.loadBills();
      },
      error: (err: any) => {
        console.error('Error approving bill:', err);
        alert(err?.error?.message || 'Failed to approve bill');
      },
    });
  }

  deleteBill(billId: number) {
    if (!confirm('Are you sure you want to delete this bill? This action cannot be undone.')) return;

    this.billingService.deleteBilling(billId).subscribe({
      next: () => {
        alert('Bill deleted successfully!');
        this.loadBills();
      },
      error: (err: any) => {
        console.error('Error deleting bill:', err);
        alert(err?.error?.message || 'Failed to delete bill');
      },
    });
  }

  printInvoice(billId: number) {
    this.billingService.printInvoice(billId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${billId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Error printing invoice:', err);
        alert(err?.error?.message || 'Failed to print invoice');
      },
    });
  }

  viewDetails(billId: number) {
    this.router.navigate(['/billing', billId]);
  }
}
