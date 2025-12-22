import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { environment } from '../../../environments/environment';

interface Distributor {
  id: number;
  businessName: string;
  email: string;
}


@Component({
  selector: 'app-admin-payment-entries-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Record Distributor Payment</h1>
        <p class="text-gray-600 mt-2">Enter payment details</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submitForm()" class="bg-white rounded-lg shadow p-6 space-y-5">

        <!-- Distributor Selection (Admin Only) -->
        @if (isAdmin) {
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Distributor *</label>
          <select
            formControlName="distributorId"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            [class.border-red-500]="form.get('distributorId')?.invalid && form.get('distributorId')?.touched"
          >
            <option value="">Choose a distributor...</option>
            @for (dist of distributors; track dist.id) {
            <option [value]="dist.id">{{ dist.businessName }} ({{ dist.email }})</option>
            }
          </select>
          @if (form.get('distributorId')?.invalid && form.get('distributorId')?.touched) {
          <p class="text-red-500 text-sm mt-1">Distributor is required</p>
          }
        </div>
        }

        <!-- Amount -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
          <input
            type="number"
            step="0.01"
            formControlName="amount"
            placeholder="0.00"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            [class.border-red-500]="form.get('amount')?.invalid && form.get('amount')?.touched"
          />
          @if (form.get('amount')?.invalid && form.get('amount')?.touched) {
          <p class="text-red-500 text-sm mt-1">Valid amount is required</p>
          }
        </div>

        <!-- Payment Mode -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Payment Mode *</label>
          <select
            formControlName="paymentMode"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            [class.border-red-500]="form.get('paymentMode')?.invalid && form.get('paymentMode')?.touched"
          >
            <option value="">Select payment mode...</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="UPI">UPI</option>
            <option value="NEFT">NEFT</option>
            <option value="OTHER">Other</option>
          </select>
          @if (form.get('paymentMode')?.invalid && form.get('paymentMode')?.touched) {
          <p class="text-red-500 text-sm mt-1">Payment mode is required</p>
          }
        </div>

        <!-- Payment Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
          <input
            type="date"
            formControlName="paymentDate"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            [class.border-red-500]="form.get('paymentDate')?.invalid && form.get('paymentDate')?.touched"
          />
          @if (form.get('paymentDate')?.invalid && form.get('paymentDate')?.touched) {
          <p class="text-red-500 text-sm mt-1">Payment date is required</p>
          }
        </div>

        <!-- Cheque Number (Conditional) -->
        @if (form.get('paymentMode')?.value === 'CHEQUE') {
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Cheque Number</label>
          <input
            type="text"
            formControlName="chequeNo"
            placeholder="Enter cheque number"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        }

        <!-- Reference Number -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
          <input
            type="text"
            formControlName="referenceNo"
            placeholder="e.g., REF-2025-001"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <!-- Image Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Receipt/Proof Image (Optional)</label>
          <input
            type="file"
            accept="image/*"
            (change)="onFileSelected($event)"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p class="text-gray-500 text-xs mt-1">Upload proof of payment (JPG, PNG, etc.)</p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description/Remarks</label>
          <textarea
            formControlName="description"
            placeholder="Add any additional notes..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-24"
          ></textarea>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3 pt-6">
          <button
            type="button"
            (click)="goBack()"
            class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="form.invalid || submitting"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            @if (submitting) { Recording... } @else { Record Payment }
          </button>
        </div>

        @if (submitError) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">{{ submitError }}</p>
        </div>
        }
      </form>
    </div>
  `,
  styles: []
})
export class AdminPaymentEntriesFormComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private readonly API_URL = environment.APIUrl;

  form: FormGroup;
  submitting = false;
  submitError = '';
  isAdmin = false;
  isDistributor = false;
  distributors: Distributor[] = [];
  selectedFile: File | null = null;

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      distributorId: [''],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      paymentMode: ['', Validators.required],
      paymentDate: [today, Validators.required],
      chequeNo: [''],
      referenceNo: [''],
      description: [''],
      image: ['']
    });
  }

  ngOnInit() {
    this.isAdmin = this.auth.isAdmin();
    this.isDistributor = this.auth.isDistributor();
    if (this.isAdmin) {
      this.form.get('distributorId')?.setValidators([Validators.required]);
      this.loadDistributors();
    } else {
      // For distributors, remove distributorId validators and set empty
      this.form.get('distributorId')?.clearValidators();
    }
    this.form.get('distributorId')?.updateValueAndValidity();
  }

  private getRedirectRoute(): string {
    return this.isDistributor ? '/my-payments' : '/admin/payment-entries';
  }

  loadDistributors() {
    this.userService.getDistributors().subscribe({
      next: (res: any) => {
        const distArray = res.data || res || [];
        this.distributors = distArray.map((d: any) => ({
          id: d.id,
          businessName: d.businessName || d.firstName + ' ' + d.lastName || 'Unknown',
          email: d.email
        }));
      },
      error: (err: any) => {
        console.error('Error loading distributors:', err);
      }
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  submitForm() {
    if (this.form.invalid) return;

    this.submitting = true;
    this.submitError = '';

    // If there's a file, use FormData; otherwise send JSON to preserve number types
    if (this.selectedFile) {
      const formData = new FormData();
      if (this.isAdmin && this.form.value.distributorId) {
        formData.append('distributorId', this.form.value.distributorId);
      }
      formData.append('amount', this.form.value.amount);
      formData.append('paymentMode', this.form.value.paymentMode);
      formData.append('paymentDate', this.form.value.paymentDate);
      if (this.form.value.chequeNo) formData.append('chequeNo', this.form.value.chequeNo);
      if (this.form.value.referenceNo) formData.append('referenceNo', this.form.value.referenceNo);
      if (this.form.value.description) formData.append('description', this.form.value.description);
      formData.append('attachment', this.selectedFile);

      this.http.post(`${this.API_URL}/distributor-payment-entries`, formData, {
        headers: this.auth.getAuthHeaders(),
      }).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate([this.getRedirectRoute()]);
        },
        error: (err: any) => {
          this.submitting = false;
          this.submitError = err?.error?.message || 'Error recording payment. Please try again.';
        }
      });
    } else {
      // Send JSON when no file to preserve number types
      const payload: any = {
        amount: parseFloat(this.form.value.amount),
        paymentMode: this.form.value.paymentMode,
        paymentDate: this.form.value.paymentDate,
      };

      if (this.isAdmin && this.form.value.distributorId) {
        payload.distributorId = parseInt(this.form.value.distributorId, 10);
      }
      if (this.form.value.chequeNo) payload.chequeNo = this.form.value.chequeNo;
      if (this.form.value.referenceNo) payload.referenceNo = this.form.value.referenceNo;
      if (this.form.value.description) payload.description = this.form.value.description;

      this.http.post(`${this.API_URL}/distributor-payment-entries`, payload, {
        headers: this.auth.getAuthHeaders(),
      }).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate([this.getRedirectRoute()]);
        },
        error: (err: any) => {
          this.submitting = false;
          this.submitError = err?.error?.message || 'Error recording payment. Please try again.';
        }
      });
    }
  }

  goBack() {
    this.router.navigate([this.getRedirectRoute()]);
  }
}
