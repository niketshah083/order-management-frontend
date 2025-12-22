import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DistributorPaymentEntryService } from '../../services/distributor-payment-entry.service';
import { AuthService } from '../../services/auth.service';

interface PaymentEntry {
  id: number;
  distributorId: number;
  distributor?: { id: number; businessName: string; email: string };
  paymentDate: string;
  paymentMode: string;
  amount: number;
  chequeNo?: string;
  description?: string;
  status: string;
  adminRemarks?: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-payment-entries-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-3xl font-bold text-gray-900">{{ pageTitle }}</h1>
        <a
          [routerLink]="isDistributor ? '/my-payments/create' : '/admin/payment-entries/create'"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          {{ buttonText }}
        </a>
      </div>

      @if (loading) {
      <div class="text-center py-8">
        <p class="text-gray-600">Loading payments...</p>
      </div>
      } @else if (entries.length === 0) {
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p class="text-blue-800">No payment entries found</p>
      </div>
      } @else {
      <div class="overflow-x-auto bg-white rounded-lg shadow">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">{{ isDistributor ? 'Payment' : 'Distributor' }}</th>
              <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
              <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Payment Mode</th>
              <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (entry of entries; track entry.id) {
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div>
                  <p class="font-medium text-gray-900">{{ isDistributor ? (currentUserName || 'You') : (entry.distributor?.businessName || 'N/A') }}</p>
                  <p class="text-sm text-gray-600">{{ isDistributor ? currentUserEmail : (entry.distributor?.email || 'N/A') }}</p>
                </div>
              </td>
              <td class="px-6 py-4 font-semibold text-gray-900">₹{{ entry.amount | number: '1.2-2' }}</td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{{ entry.paymentMode }}</span>
              </td>
              <td class="px-6 py-4 text-gray-700">{{ entry.paymentDate | date: 'dd-MMM-yyyy' }}</td>
              <td class="px-6 py-4">
                <span
                  [ngClass]="{
                    'bg-yellow-100 text-yellow-800': entry.status === 'PENDING',
                    'bg-green-100 text-green-800': entry.status === 'APPROVED',
                    'bg-red-100 text-red-800': entry.status === 'REJECTED'
                  }"
                  class="px-3 py-1 rounded-full text-sm font-medium"
                >
                  {{ entry.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <button
                  (click)="openDetails(entry.id)"
                  class="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  View
                </button>
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>
      }
    </div>
  `,
  styles: []
})
export class AdminPaymentEntriesListComponent implements OnInit {
  private service = inject(DistributorPaymentEntryService);
  private router = inject(Router);
  private auth = inject(AuthService);

  entries: PaymentEntry[] = [];
  loading = false;
  isDistributor = false;
  pageTitle = 'Distributor Payments';
  buttonText = 'Record Payment';
  currentUserName = '';
  currentUserEmail = '';

  ngOnInit() {
    this.isDistributor = this.auth.isDistributor();
    const currentUser = this.auth.currentUser();
    if (currentUser) {
      this.currentUserName = currentUser.name || '';
      this.currentUserEmail = currentUser.email || '';
    }
    
    if (this.isDistributor) {
      this.pageTitle = 'My Payments';
      this.buttonText = 'Submit Payment';
    }
    
    this.loadPaymentEntries();
  }

  loadPaymentEntries() {
    this.loading = true;
    const loadFn = this.isDistributor 
      ? this.service.getMyPaymentEntries(1, 100)
      : this.service.getAllPaymentEntries(1, 100);

    loadFn.subscribe({
      next: (res: any) => {
        this.entries = res.data || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading payment entries:', err);
        this.loading = false;
      }
    });
  }

  openDetails(id: number) {
    this.router.navigate(['/admin/payment-entries', id]);
  }
}
