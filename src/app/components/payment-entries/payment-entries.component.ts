import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { DistributorPaymentEntryService } from '../../services/distributor-payment-entry.service';
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from '../shared/ui/modal.component';

@Component({
  selector: 'app-payment-entries',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent],
  template: `
    <div class="bg-indigo-50 p-3 md:p-6 max-w-7xl mx-auto min-h-screen">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {{ auth.isAdmin() ? 'Payment Entry Management' : 'My Payment Submissions' }}
          </h1>
          <p class="text-gray-500 text-sm mt-0.5">
            {{ auth.isAdmin() ? 'Review and manage distributor payments' : 'Submit payment entries for approval' }}
          </p>
        </div>
        @if (!auth.isAdmin()) {
        <button (click)="openSubmitModal()"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg transition-all active:scale-95">
          + Submit Payment
        </button>
        }
      </div>

      <!-- Payment Entries Table -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Mode</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                @if (auth.isAdmin()) {
                <th class="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Distributor</th>
                }
                <th class="px-6 py-4 text-xs font-semibold text-gray-600 uppercase text-center">Status</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-600 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              @for (entry of paymentEntries(); track entry.id) {
              <tr class="hover:bg-indigo-50/30 transition-colors">
                <td class="px-6 py-4 text-sm text-gray-900">{{ entry.paymentDate | date:'shortDate' }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ entry.paymentMode }}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">₹{{ entry.amount | number:'1.2-2' }}</td>
                @if (auth.isAdmin()) {
                <td class="px-6 py-4 text-sm text-gray-600">{{ entry.distributor?.firstName }}</td>
                }
                <td class="px-6 py-4 text-center">
                  <span [class]="getStatusClass(entry.status)"
                    class="px-3 py-1 rounded-full text-xs font-bold border inline-block">
                    {{ entry.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <button (click)="viewDetails(entry)"
                    class="text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded transition-colors text-sm font-medium">
                    View
                  </button>
                  @if (auth.isAdmin() && entry.status === 'PENDING') {
                  <button (click)="approveEntry(entry)"
                    class="text-green-600 hover:bg-green-100 px-3 py-2 rounded transition-colors text-sm font-medium">
                    Approve
                  </button>
                  }
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (paymentEntries().length === 0) {
      <div class="text-center p-12 bg-white rounded-lg border border-dashed border-gray-300 mt-4">
        <p class="text-gray-500 font-medium">No payment entries found</p>
      </div>
      }

      <!-- Submit Payment Modal -->
      <app-modal [isOpen]="isSubmitOpen()" title="Submit Payment Entry" (close)="isSubmitOpen.set(false)">
        <form [formGroup]="paymentForm" (ngSubmit)="submitPayment()" class="space-y-4">
          <div>
            <label class="text-sm font-semibold text-gray-700">Payment Date</label>
            <input type="date" formControlName="paymentDate"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700">Payment Mode</label>
            <select formControlName="paymentMode"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">Select Mode</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="NEFT">NEFT</option>
            </select>
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700">Amount (₹)</label>
            <input type="number" formControlName="amount" step="0.01"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>

          @if (paymentForm.get('paymentMode')?.value === 'CHEQUE') {
          <div>
            <label class="text-sm font-semibold text-gray-700">Cheque Number</label>
            <input type="text" formControlName="chequeNo"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          }

          <div>
            <label class="text-sm font-semibold text-gray-700">Description</label>
            <textarea formControlName="description" rows="3"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700">Attachment</label>
            <input type="file" #fileInput (change)="onFileSelected($event)"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
            @if (selectedFile()) {
            <p class="text-sm text-green-600 mt-1">✓ {{ selectedFile()?.name }}</p>
            }
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <button type="button" (click)="isSubmitOpen.set(false)"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" [disabled]="!paymentForm.valid || isSubmitting()"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-gray-400">
              {{ isSubmitting() ? 'Submitting...' : 'Submit' }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Details Modal -->
      <app-modal [isOpen]="selectedEntry() !== null" [title]="'Payment Entry #' + selectedEntry()?.id"
        (close)="selectedEntry.set(null)">
        @if (selectedEntry(); as entry) {
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-gray-600">Payment Date</label>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ entry.paymentDate | date:'fullDate' }}</p>
            </div>
            <div>
              <label class="text-xs font-bold text-gray-600">Mode</label>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ entry.paymentMode }}</p>
            </div>
            <div>
              <label class="text-xs font-bold text-gray-600">Amount</label>
              <p class="text-sm font-medium text-gray-900 mt-1">₹{{ entry.amount | number:'1.2-2' }}</p>
            </div>
            <div>
              <label class="text-xs font-bold text-gray-600">Status</label>
              <span [class]="getStatusClass(entry.status)"
                class="px-2 py-1 rounded text-xs font-bold border inline-block mt-1">
                {{ entry.status }}
              </span>
            </div>
          </div>

          @if (entry.chequeNo) {
          <div>
            <label class="text-xs font-bold text-gray-600">Cheque Number</label>
            <p class="text-sm text-gray-900 mt-1">{{ entry.chequeNo }}</p>
          </div>
          }

          @if (entry.description) {
          <div>
            <label class="text-xs font-bold text-gray-600">Description</label>
            <p class="text-sm text-gray-900 mt-1">{{ entry.description }}</p>
          </div>
          }

          @if (entry.adminRemarks) {
          <div class="bg-amber-50 p-3 rounded border border-amber-200">
            <label class="text-xs font-bold text-amber-900">Admin Remarks</label>
            <p class="text-sm text-amber-900 mt-1">{{ entry.adminRemarks }}</p>
          </div>
          }

          @if (auth.isAdmin() && entry.status === 'PENDING') {
          <div class="border-t pt-4 space-y-2">
            <input type="text" placeholder="Add remarks..." [(ngModel)]="approvalRemarks"
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
            <div class="flex gap-2">
              <button (click)="approveWithRemarks(entry, 'APPROVED')"
                class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium">
                Approve
              </button>
              <button (click)="approveWithRemarks(entry, 'REJECTED')"
                class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium">
                Reject
              </button>
            </div>
          </div>
          }

          <div class="flex justify-end gap-2 pt-4 border-t">
            <button type="button" (click)="selectedEntry.set(null)"
              class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
              Close
            </button>
          </div>
        </div>
        }
      </app-modal>
    </div>
  `,
})
export class PaymentEntriesComponent implements OnInit {
  paymentService = inject(DistributorPaymentEntryService);
  auth = inject(AuthService);
  fb = inject(FormBuilder);

  paymentEntries = signal<any[]>([]);
  selectedEntry = signal<any | null>(null);
  isSubmitOpen = signal(false);
  isSubmitting = signal(false);
  selectedFile = signal<File | null>(null);
  approvalRemarks = '';

  paymentForm = this.fb.group({
    paymentDate: ['', Validators.required],
    paymentMode: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    chequeNo: [''],
    description: [''],
  });

  ngOnInit() {
    this.loadPaymentEntries();
  }

  loadPaymentEntries() {
    if (this.auth.isAdmin()) {
      this.paymentService.getAllPaymentEntries().subscribe({
        next: (res) => this.paymentEntries.set(res.data),
        error: (err) => console.error('Error loading entries:', err),
      });
    } else {
      this.paymentService.getMyPaymentEntries().subscribe({
        next: (res) => this.paymentEntries.set(res.data),
        error: (err) => console.error('Error loading entries:', err),
      });
    }
  }

  openSubmitModal() {
    this.paymentForm.reset();
    this.selectedFile.set(null);
    this.isSubmitOpen.set(true);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files?.[0]) {
      this.selectedFile.set(target.files[0]);
    }
  }

  submitPayment() {
    if (!this.paymentForm.valid) return;

    this.isSubmitting.set(true);
    const formData = new FormData();
    formData.append('paymentDate', this.paymentForm.get('paymentDate')?.value || '');
    formData.append('paymentMode', this.paymentForm.get('paymentMode')?.value || '');
    formData.append('amount', String(this.paymentForm.get('amount')?.value || '0'));
    formData.append('chequeNo', this.paymentForm.get('chequeNo')?.value || '');
    formData.append('description', this.paymentForm.get('description')?.value || '');

    if (this.selectedFile()) {
      formData.append('attachment', this.selectedFile()!);
    }

    this.paymentService.createPaymentEntry(formData).subscribe({
      next: () => {
        alert('Payment entry submitted successfully!');
        this.isSubmitOpen.set(false);
        this.loadPaymentEntries();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        alert('Error submitting payment');
        this.isSubmitting.set(false);
      },
    });
  }

  viewDetails(entry: any) {
    this.selectedEntry.set(entry);
  }

  approveEntry(entry: any) {
    this.selectedEntry.set(entry);
  }

  approveWithRemarks(entry: any, status: string) {
    this.paymentService.approvePaymentEntry(entry.id, {
      status,
      adminRemarks: this.approvalRemarks,
    }).subscribe({
      next: () => {
        alert(`Payment ${status.toLowerCase()}!`);
        this.selectedEntry.set(null);
        this.approvalRemarks = '';
        this.loadPaymentEntries();
      },
      error: () => alert('Error updating entry'),
    });
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'APPROVED':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  }
}
