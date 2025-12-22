import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DistributorPaymentEntryService } from '../../services/distributor-payment-entry.service';

interface PaymentEntry {
  id: number;
  distributorId: number;
  distributor?: any;
  paymentDate: string;
  paymentMode: string;
  amount: number;
  chequeNo?: string;
  description?: string;
  status: string;
  adminRemarks?: string;
  approvedBy?: number;
  approverUser?: any;
  approvedAt?: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-payment-entries-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      @if (loading) {
      <div class="text-center py-8">
        <p class="text-gray-600">Loading payment details...</p>
      </div>
      } @else if (entry) {
      <div class="mb-6">
        <button
          (click)="goBack()"
          class="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Details Card -->
        <div class="md:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Payment Details</h2>

          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-sm text-gray-600 mb-1">Distributor</p>
              <p class="text-lg font-semibold text-gray-900">{{ entry.distributor?.businessName }}</p>
              <p class="text-sm text-gray-600">{{ entry.distributor?.email }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-600 mb-1">Amount</p>
              <p class="text-lg font-semibold text-green-600">₹{{ entry.amount | number: '1.2-2' }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-600 mb-1">Payment Mode</p>
              <p class="text-lg font-semibold text-gray-900">{{ entry.paymentMode }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-600 mb-1">Payment Date</p>
              <p class="text-lg font-semibold text-gray-900">{{ entry.paymentDate | date: 'dd-MMM-yyyy' }}</p>
            </div>

            @if (entry.chequeNo) {
            <div>
              <p class="text-sm text-gray-600 mb-1">Cheque Number</p>
              <p class="text-lg font-semibold text-gray-900">{{ entry.chequeNo }}</p>
            </div>
            }

            <div>
              <p class="text-sm text-gray-600 mb-1">Status</p>
              <span
                [ngClass]="{
                  'bg-yellow-100 text-yellow-800': entry.status === 'PENDING',
                  'bg-green-100 text-green-800': entry.status === 'APPROVED',
                  'bg-red-100 text-red-800': entry.status === 'REJECTED'
                }"
                class="px-3 py-1 rounded-full text-sm font-medium inline-block"
              >
                {{ entry.status }}
              </span>
            </div>
          </div>

          @if (entry.description) {
          <div class="mt-6 pt-6 border-t">
            <p class="text-sm text-gray-600 mb-2">Description</p>
            <p class="text-gray-900">{{ entry.description }}</p>
          </div>
          }

          @if (entry.approvedAt) {
          <div class="mt-6 pt-6 border-t">
            <p class="text-sm text-gray-600 mb-2">Approved By</p>
            <p class="text-gray-900">{{ entry.approverUser?.name }} on {{ entry.approvedAt | date: 'dd-MMM-yyyy hh:mm a' }}</p>
            @if (entry.adminRemarks) {
            <p class="text-sm text-gray-600 mt-2">Remarks: {{ entry.adminRemarks }}</p>
            }
          </div>
          }
        </div>

        <!-- Action Card -->
        @if (entry.status === 'PENDING' && !showActionForm) {
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Actions</h3>
          <button
            (click)="showActionForm = true"
            class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Approve / Reject
          </button>
        </div>
        }

        <!-- Action Form -->
        @if (showActionForm && entry.status === 'PENDING') {
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Update Status</h3>
          <form [formGroup]="actionForm" (ngSubmit)="updateStatus()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Action *</label>
              <select
                formControlName="status"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select action...</option>
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
              <textarea
                formControlName="adminRemarks"
                placeholder="Add remarks if needed..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-20"
              ></textarea>
            </div>

            <div class="flex gap-2 pt-4">
              <button
                type="button"
                (click)="showActionForm = false"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="actionForm.invalid || submitting"
                class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                @if (submitting) { Processing... } @else { Update }
              </button>
            </div>

            @if (actionError) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-red-800 text-sm">{{ actionError }}</p>
            </div>
            }
          </form>
        </div>
        }
      </div>
      } @else {
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <p class="text-red-800">Payment entry not found</p>
      </div>
      }
    </div>
  `,
  styles: []
})
export class AdminPaymentEntriesDetailComponent implements OnInit {
  private service = inject(DistributorPaymentEntryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  entry: PaymentEntry | null = null;
  loading = false;
  submitting = false;
  showActionForm = false;
  actionError = '';
  actionForm: FormGroup;

  constructor() {
    this.actionForm = this.fb.group({
      status: ['', Validators.required],
      adminRemarks: ['']
    });
  }

  ngOnInit() {
    this.loadEntry();
  }

  loadEntry() {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');
    this.service.getPaymentEntryById(Number(id)).subscribe({
      next: (res: any) => {
        this.entry = res.data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading entry:', err);
        this.loading = false;
      }
    });
  }

  updateStatus() {
    if (this.actionForm.invalid || !this.entry) return;

    this.submitting = true;
    this.actionError = '';

    const payload = {
      status: this.actionForm.value.status,
      adminRemarks: this.actionForm.value.adminRemarks
    };

    this.service.approvePaymentEntry(this.entry.id, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.showActionForm = false;
        this.loadEntry();
      },
      error: (err: any) => {
        this.submitting = false;
        this.actionError = err?.error?.message || 'Error updating payment. Please try again.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/payment-entries']);
  }
}
