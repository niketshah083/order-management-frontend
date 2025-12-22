import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-distributor-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 p-6 max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Distributor Ledger</h1>
        <p class="text-gray-500 mt-1">View and manage distributor transaction history</p>
      </div>

      <!-- Date Range Filter -->
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
            <select
              [(ngModel)]="dateRange"
              (change)="onDateRangeChange()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
            >
              @for (option of dateRangeOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>

          @if (dateRange === 'custom') {
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                [(ngModel)]="startDate"
                (change)="loadLedger()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                [(ngModel)]="endDate"
                (change)="loadLedger()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          } @else {
            <div>
              <p class="text-sm text-gray-600"><strong>From:</strong> {{ startDate }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600"><strong>To:</strong> {{ endDate }}</p>
            </div>
          }
        </div>
      </div>

      <!-- Ledger Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div class="text-sm font-medium text-gray-600">Total Owed (Debits)</div>
          <div class="text-2xl font-bold text-red-600 mt-2">₹{{ summary?.totalPurchases | number: '1.2-2' }}</div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div class="text-sm font-medium text-gray-600">Total Paid (Credits)</div>
          <div class="text-2xl font-bold text-green-600 mt-2">₹{{ summary?.totalPayments | number: '1.2-2' }}</div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div class="text-sm font-medium text-gray-600">Balance Due</div>
          <div class="text-2xl font-bold" [ngClass]="{ 'text-red-600': summary?.runningBalance > 0, 'text-green-600': summary?.runningBalance <= 0 }">
            ₹{{ summary?.runningBalance | number: '1.2-2' }}
          </div>
        </div>
      </div>

      <!-- Ledger Table -->
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
        @if (ledgerEntries.length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Reference</th>
                  <th class="px-6 py-3 text-right text-sm font-semibold text-red-700">Debit (Owed)</th>
                  <th class="px-6 py-3 text-right text-sm font-semibold text-green-700">Credit (Paid)</th>
                  <th class="px-6 py-3 text-right text-sm font-semibold text-blue-700">Running Balance</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (entry of ledgerEntries; track entry.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-900">{{ formatDate(entry.createdAt) }}</td>
                    <td class="px-6 py-4 text-sm">
                      <span [ngClass]="getTypeClass(entry.transactionType)" class="px-3 py-1 rounded-full text-xs font-medium">
                        {{ entry.transactionType }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">{{ entry.description || '-' }}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">{{ entry.referenceNo || '-' }}</td>
                    <td class="px-6 py-4 text-sm font-semibold text-right" [ngClass]="{ 'text-red-600': entry.isDebit, 'text-gray-400': !entry.isDebit }">
                      {{ entry.isDebit ? '₹' + (entry.amount | number: '1.2-2') : '-' }}
                    </td>
                    <td class="px-6 py-4 text-sm font-semibold text-right" [ngClass]="{ 'text-green-600': !entry.isDebit, 'text-gray-400': entry.isDebit }">
                      {{ !entry.isDebit ? '₹' + (entry.amount | number: '1.2-2') : '-' }}
                    </td>
                    <td class="px-6 py-4 text-sm font-semibold text-right text-blue-600">₹{{ entry.runningBalance | number: '1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="text-center py-8">
            <p class="text-gray-600">No ledger entries found</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class DistributorLedgerComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  ledgerEntries: any[] = [];
  summary: any = {
    totalPurchases: 0,
    totalPayments: 0,
    runningBalance: 0
  };

  dateRange = 'current-year';
  startDate = '';
  endDate = '';

  dateRangeOptions = [
    { value: 'last-year', label: 'Last Year' },
    { value: 'current-year', label: 'Current Year' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'last-quarter', label: 'Last Quarter' },
    { value: 'custom', label: 'Custom Range' }
  ];

  ngOnInit() {
    this.setDefaultDateRange();
    this.loadLedger();
  }

  setDefaultDateRange() {
    const today = new Date();
    const currentYear = today.getFullYear();

    switch (this.dateRange) {
      case 'last-year':
        this.startDate = `${currentYear - 1}-01-01`;
        this.endDate = `${currentYear - 1}-12-31`;
        break;
      case 'current-year':
        this.startDate = `${currentYear}-01-01`;
        this.endDate = today.toISOString().split('T')[0];
        break;
      case 'last-30-days':
        const last30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        this.startDate = last30.toISOString().split('T')[0];
        this.endDate = today.toISOString().split('T')[0];
        break;
      case 'last-quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const quarterStart = new Date(currentYear, quarter * 3, 1);
        this.startDate = quarterStart.toISOString().split('T')[0];
        this.endDate = today.toISOString().split('T')[0];
        break;
    }
  }

  onDateRangeChange() {
    if (this.dateRange !== 'custom') {
      this.setDefaultDateRange();
    }
    this.loadLedger();
  }

  loadLedger() {
    const user = this.auth.getCurrentUser() as any;
    const distributorId = user?.id;
    if (!distributorId) return;

    const params = new URLSearchParams();
    if (this.startDate) params.append('startDate', this.startDate);
    if (this.endDate) params.append('endDate', this.endDate);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    this.http
      .get<any>(`${environment.APIUrl}/ledger/distributor/${distributorId}${queryString}`, {
        headers: this.auth.getAuthHeaders()
      })
      .subscribe({
        next: (res) => {
          // Use the data directly from backend - running balance is already calculated correctly
          this.ledgerEntries = res.data || [];
        },
        error: (err) => console.error('Error loading ledger:', err)
      });

    this.http
      .get<any>(`${environment.APIUrl}/ledger/distributor/${distributorId}/summary${queryString}`, {
        headers: this.auth.getAuthHeaders()
      })
      .subscribe({
        next: (res) => {
          this.summary = res.data || {
            totalPurchases: 0,
            totalPayments: 0,
            runningBalance: 0
          };

          // Ensure running balance = totalPurchases - totalPayments (amount owed)
          if (!this.summary.runningBalance) {
            this.summary.runningBalance = this.summary.totalPurchases - this.summary.totalPayments;
          }
        },
        error: (err) => console.error('Error loading ledger summary:', err)
      });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTypeClass(type: string): string {
    const classes: any = {
      PURCHASE: 'bg-red-100 text-red-800',
      GRN: 'bg-red-100 text-red-800',
      PAYMENT: 'bg-green-100 text-green-800',
      CREDIT_ADJUSTMENT: 'bg-blue-100 text-blue-800',
      REFUND: 'bg-purple-100 text-purple-800',
      PURCHASE_RETURN: 'bg-purple-100 text-purple-800'
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
  }
}
