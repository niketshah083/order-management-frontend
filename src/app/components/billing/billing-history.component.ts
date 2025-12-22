import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { BillingService, Billing } from '../../services/billing.service';
import { AuthService } from '../../services/auth.service';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-billing-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 min-h-screen p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <!-- HEADER -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h1 class="text-3xl font-bold text-gray-900">📋 Billing History</h1>
            <button
              (click)="router.navigate(['/billing'])"
              class="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-5 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95"
            >
              ➕ Create Billing
            </button>
          </div>

          <!-- SEARCH FILTERS -->
          <div class="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <!-- Date Range -->
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">📅 From Date *</label>
                <input type="date" [(ngModel)]="filterFromDate" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">📅 To Date *</label>
                <input type="date" [(ngModel)]="filterToDate" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <!-- Payment Type -->
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">💳 Payment Type</label>
                <select [(ngModel)]="filterPaymentType" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">All Types</option>
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <!-- Status -->
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">📊 Status</label>
                <select [(ngModel)]="filterStatus" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <!-- Search -->
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">🔍 Search</label>
                <input
                  type="text"
                  [(ngModel)]="billSearchQuery"
                  placeholder="Bill No, Customer, Item..."
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div class="flex gap-2 mt-3">
              <button (click)="applyFilters()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-all">🔍 Search</button>
              <button (click)="resetFilters()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold rounded-lg transition-all">🔄 Reset</button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bill No</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Items</th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                  <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (bill of filteredBillings(); track bill.id) {
                  <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td class="px-6 py-4 font-bold text-gray-900">{{ bill.billNo || '-' }}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(bill.billDate) }}</td>
                    <td class="px-6 py-4 text-gray-900">
                      <div class="font-medium">{{ bill.customer?.firstname }} {{ bill.customer?.lastname }}</div>
                      <div class="text-xs text-gray-500">{{ bill.customer?.mobileNo }}</div>
                    </td>
                    <td class="px-6 py-4 text-center font-medium text-gray-900">{{ bill.billingItems?.length || bill.items?.length || 0 }}</td>
                    <td class="px-6 py-4 text-right font-bold text-lg text-indigo-600">₹{{ formatAmount(bill.finalAmount) }}</td>
                    <td class="px-6 py-4">
                      <span [class]="getStatusClass(bill)">
                        {{ getStatusLabel(bill) }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span [class]="getPaymentStatusClass(bill)">
                        {{ getPaymentStatusLabel(bill) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex gap-2 justify-center flex-wrap">
                        @if (bill.approvalStatus === 'draft' || bill.status === 'draft') {
                          <button
                            (click)="editBilling(bill.id!)"
                            class="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all active:scale-95"
                            title="Edit draft invoice"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            (click)="completeBilling(bill.id!)"
                            class="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all active:scale-95"
                            title="Convert to complete and generate invoice"
                          >
                            ✅ Complete
                          </button>
                        }
                        <button
                          (click)="downloadBillPDF(bill.id!)"
                          class="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
                          title="Download Invoice PDF"
                        >
                          📥 Download
                        </button>
                        @if (bill.paymentType === 'online' && bill.paymentStatus !== 'completed') {
                          <button
                            (click)="payOnline(bill)"
                            [disabled]="isProcessingPayment()"
                            class="px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                            title="Pay Online via Razorpay"
                          >
                            💳 Pay ₹{{ formatAmount(getPayableAmount(bill)) }}
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (filteredBillings().length === 0) {
            <div class="text-center py-8 text-gray-500">
              <p>No billing records found</p>
            </div>
          }

          @if (totalPages() > 1) {
            <div class="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <div class="text-sm text-gray-600">Page {{ currentPage() }} of {{ totalPages() }} • Total: {{ totalCount() }} records</div>
              <div class="flex gap-2">
                <button
                  (click)="previousBillingPage()"
                  [disabled]="currentPage() === 1"
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
                >
                  ← Previous
                </button>
                <button
                  (click)="nextBillingPage()"
                  [disabled]="currentPage() >= totalPages()"
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class BillingHistoryComponent implements OnInit {
  billingService = inject(BillingService);
  auth = inject(AuthService);
  router = inject(Router);
  paymentService = inject(PaymentService);

  billings = signal<Billing[]>([]);
  billSearchQuery = '';
  currentPage = signal(1);
  pageSize = 10;
  isProcessingPayment = signal(false);

  // Filter properties
  filterFromDate = this.getTodayDate();
  filterToDate = this.getTodayDate();
  filterPaymentType = '';
  filterStatus = '';

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  filteredBillings = computed(() => {
    let filtered = this.billings();
    const query = this.billSearchQuery.toLowerCase();

    // Apply text search
    if (query) {
      filtered = filtered.filter(
        (b) =>
          (b.billNo && b.billNo.toLowerCase().includes(query)) ||
          (b.customer && (b.customer.firstname?.toLowerCase().includes(query) || b.customer.lastname?.toLowerCase().includes(query) || b.customer.mobileNo?.includes(query)))
      );
    }

    // Apply date filter
    if (this.filterFromDate) {
      filtered = filtered.filter((b) => b.billDate >= this.filterFromDate);
    }
    if (this.filterToDate) {
      filtered = filtered.filter((b) => b.billDate <= this.filterToDate);
    }

    // Apply payment type filter
    if (this.filterPaymentType) {
      filtered = filtered.filter((b) => b.paymentType === this.filterPaymentType);
    }

    // Apply status filter
    if (this.filterStatus) {
      filtered = filtered.filter((b) => (b.approvalStatus || b.status) === this.filterStatus);
    }

    const start = (this.currentPage() - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => {
    let filtered = this.billings();
    const query = this.billSearchQuery.toLowerCase();

    if (query) {
      filtered = filtered.filter(
        (b) =>
          (b.billNo && b.billNo.toLowerCase().includes(query)) ||
          (b.customer && (b.customer.firstname?.toLowerCase().includes(query) || b.customer.lastname?.toLowerCase().includes(query)))
      );
    }

    if (this.filterFromDate) {
      filtered = filtered.filter((b) => b.billDate >= this.filterFromDate);
    }
    if (this.filterToDate) {
      filtered = filtered.filter((b) => b.billDate <= this.filterToDate);
    }
    if (this.filterPaymentType) {
      filtered = filtered.filter((b) => b.paymentType === this.filterPaymentType);
    }
    if (this.filterStatus) {
      filtered = filtered.filter((b) => (b.approvalStatus || b.status) === this.filterStatus);
    }

    return Math.ceil(filtered.length / this.pageSize);
  });

  applyFilters() {
    this.currentPage.set(1);
    // Trigger recomputation by updating billings signal
    this.billings.update((b) => [...b]);
  }

  resetFilters() {
    this.filterFromDate = this.getTodayDate();
    this.filterToDate = this.getTodayDate();
    this.filterPaymentType = '';
    this.filterStatus = '';
    this.billSearchQuery = '';
    this.currentPage.set(1);
    this.billings.update((b) => [...b]);
  }

  totalCount = computed(() => this.billings().length);

  ngOnInit() {
    this.loadBillings();
  }

  loadBillings() {
    this.billingService.getBillings().subscribe({
      next: (response) => {
        if (!response.data) {
          this.billings.set([]);
          return;
        }

        // Filter billings based on user role
        let filteredBillings = response.data;
        const userRole = this.auth.getCurrentUserRole();

        // Only customers see their own billings
        if (userRole === 'customer') {
          // Filter by customer - would need customer ID from current user
          // For now, just show all since customers don't have orders
        }
        // Distributors/Managers/Admins see all billings

        this.billings.set(filteredBillings);
      },
      error: (err) => {
        console.error('Failed to load billings:', err);
      }
    });
  }

  downloadBillPDF(billId: number | string) {
    this.billingService.downloadPDF(billId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Bill_${billId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert('Failed to download PDF');
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatAmount(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  getStatusLabel(bill: Billing): string {
    const status = bill.approvalStatus || bill.status || 'draft';
    return status.toUpperCase();
  }

  getStatusClass(bill: Billing): string {
    const status = bill.approvalStatus || bill.status || 'draft';
    const baseClass = 'px-3 py-1 text-xs font-semibold rounded-full ';
    switch (status) {
      case 'approved':
      case 'completed':
        return baseClass + 'bg-green-100 text-green-800';
      case 'draft':
      default:
        return baseClass + 'bg-yellow-100 text-yellow-800';
    }
  }

  getPaymentStatusLabel(bill: Billing): string {
    if (bill.paymentType === 'cash') return 'CASH';
    if (bill.paymentType === 'credit') return 'CREDIT';
    const status = bill.paymentStatus || 'pending';
    return status.toUpperCase();
  }

  getPaymentStatusClass(bill: Billing): string {
    const baseClass = 'px-3 py-1 text-xs font-semibold rounded-full ';
    if (bill.paymentType === 'cash') return baseClass + 'bg-gray-100 text-gray-800';
    if (bill.paymentType === 'credit') return baseClass + 'bg-orange-100 text-orange-800';
    const status = bill.paymentStatus || 'pending';
    switch (status) {
      case 'completed':
        return baseClass + 'bg-green-100 text-green-800';
      case 'partial':
        return baseClass + 'bg-blue-100 text-blue-800';
      case 'pending':
      default:
        return baseClass + 'bg-red-100 text-red-800';
    }
  }

  getPayableAmount(bill: Billing): number {
    const finalAmt = parseFloat(bill.finalAmount?.toString() || '0');
    const amountPaid = parseFloat(bill.amountPaid?.toString() || '0');
    const amountDue = bill.amountDue ? parseFloat(bill.amountDue.toString()) : finalAmt - amountPaid;
    return amountDue > 0 ? amountDue : finalAmt;
  }

  previousBillingPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextBillingPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  hasDraftBills(): boolean {
    return this.filteredBillings().some((bill) => bill.approvalStatus === 'draft' || bill.status === 'draft');
  }

  editBilling(billId: number | string) {
    this.router.navigate(['/billing/edit', billId]);
  }

  completeBilling(billId: number | string) {
    if (confirm('Convert this draft invoice to complete? It will generate an invoice number and become read-only.')) {
      this.billingService.completeBilling(billId).subscribe({
        next: () => {
          alert('Invoice completed successfully!');
          this.loadBillings();
        },
        error: (err) => {
          console.error('Error completing invoice:', err);
          alert('Failed to complete invoice');
        }
      });
    }
  }

  createInvoice(bill: any) {
    // Mark bill as completed and create invoice
    this.billingService.updateBillingStatus(bill.id, 'completed').subscribe({
      next: () => {
        alert('Invoice created successfully!');
        this.loadBillings();
      },
      error: (err) => {
        console.error('Error creating invoice:', err);
        alert('Failed to create invoice');
      }
    });
  }

  createAllInvoices() {
    const draftBills = this.filteredBillings().filter((bill) => bill.status === 'draft');
    if (draftBills.length === 0) {
      alert('No draft bills to convert');
      return;
    }

    if (confirm(`Create invoices for ${draftBills.length} draft bill(s)?`)) {
      let completed = 0;
      let failed = 0;

      draftBills.forEach((bill) => {
        this.billingService.updateBillingStatus(bill.id!, 'completed').subscribe({
          next: () => {
            completed++;
            if (completed + failed === draftBills.length) {
              alert(`Invoices created: ${completed}, Failed: ${failed}`);
              this.loadBillings();
            }
          },
          error: () => {
            failed++;
            if (completed + failed === draftBills.length) {
              alert(`Invoices created: ${completed}, Failed: ${failed}`);
              this.loadBillings();
            }
          }
        });
      });
    }
  }

  async payOnline(bill: Billing) {
    if (!bill.id) return;

    this.isProcessingPayment.set(true);

    // Calculate amount to pay
    // If amountDue is set and > 0, use it; otherwise use finalAmount
    const finalAmt = parseFloat(bill.finalAmount?.toString() || '0');
    const amountPaid = parseFloat(bill.amountPaid?.toString() || '0');
    const amountDue = bill.amountDue ? parseFloat(bill.amountDue.toString()) : finalAmt - amountPaid;
    const amount = amountDue > 0 ? amountDue : finalAmt;

    console.log('Payment calculation:', { finalAmt, amountPaid, amountDue, amount, bill });

    if (amount <= 0) {
      alert('No amount due for this invoice. Final Amount: ₹' + finalAmt.toFixed(2));
      this.isProcessingPayment.set(false);
      return;
    }

    try {
      const result = await this.paymentService.openCheckout(bill.id, amount, {
        email: bill.customer?.emailId,
        contact: bill.customer?.mobileNo,
        name: 'Order Management System',
        description: `Payment for Invoice #${bill.billNo}`
      });

      if (result.success) {
        alert('✅ Payment successful! Transaction ID: ' + result.paymentId);
        this.loadBillings(); // Refresh to show updated payment status
      } else {
        if (result.error !== 'Payment cancelled by user') {
          alert('❌ Payment failed: ' + result.error);
        }
      }
    } catch (error: any) {
      alert('❌ Payment error: ' + (error?.message || 'Unknown error'));
    } finally {
      this.isProcessingPayment.set(false);
    }
  }
}
