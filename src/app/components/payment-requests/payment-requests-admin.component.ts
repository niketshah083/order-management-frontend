import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PaymentRequestService } from '../../services/payment-request.service';

@Component({
  selector: 'app-payment-requests-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 min-h-screen p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
            📊
          </div>
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900">All Payment Requests</h1>
            <p class="text-gray-600 mt-1">Manage all distributor payments you've raised and mark them as complete</p>
          </div>
        </div>
      </div>

      <!-- Distributor Selector -->
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Select Distributor</label>
        <select 
          [(ngModel)]="selectedDistributorId" 
          (change)="loadPaymentRequests()"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option value="">-- Choose a distributor --</option>
          <option *ngFor="let dist of distributors" [value]="dist.id">
            {{ dist.user.firstName }} ({{ dist.user.email }})
          </option>
        </select>
      </div>

      <!-- Past Due Alert -->
      <div *ngIf="selectedDistributorId && pastDueInfo" class="mb-6">
        <div class="bg-red-50 border border-red-200 rounded-xl p-6">
          <div class="flex items-center gap-3">
            <div class="text-red-600 text-2xl">⚠️</div>
            <div>
              <p class="text-red-900 font-semibold">Past Due Payments</p>
              <p class="text-red-700 mt-1">
                {{ pastDueInfo.count }} payment(s) overdue totaling 
                <span class="font-bold">₹{{ pastDueInfo.totalPastDue | number: '1.2-2' }}</span>
              </p>
              <div *ngIf="pastDueInfo.details.length > 0" class="mt-3 bg-white rounded p-3">
                <p class="text-sm font-medium text-gray-700 mb-2">Overdue Details:</p>
                <ul class="space-y-1 text-sm text-gray-600">
                  <li *ngFor="let pd of pastDueInfo.details">
                    • ₹{{ pd.amount | number: '1.2-2' }} - {{ pd.reason }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Requests List -->
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6" *ngIf="selectedDistributorId">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Pending Payments</h2>
        
        @if (paymentRequests.length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Reason</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (pr of paymentRequests; track pr.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm font-medium text-gray-900">#{{ pr.id }}</td>
                    <td class="px-6 py-4 text-sm font-semibold text-gray-900">₹{{ pr.amount | number: '1.2-2' }}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">{{ pr.reason }}</td>
                    <td class="px-6 py-4 text-sm">
                      <span [ngClass]="getStatusClass(pr.status)" class="px-3 py-1 rounded-full text-xs font-medium">
                        {{ pr.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm">
                      <button
                        (click)="openPaymentDialog(pr)"
                        class="text-blue-600 hover:text-blue-700 font-medium">
                        Mark Paid
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="text-center py-8">
            <p class="text-gray-600">No pending payments</p>
          </div>
        }
      </div>

      <!-- Payment Dialog -->
      <div *ngIf="showPaymentDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Mark Payment as Done</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment ID</label>
              <input 
                type="text" 
                [value]="'#' + selectedPayment?.id" 
                disabled
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input 
                type="text" 
                [value]="'₹' + (selectedPayment?.amount | number: '1.2-2')" 
                disabled
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
              <input 
                type="number" 
                [(ngModel)]="paymentForm.amountPaid"
                placeholder="Enter amount paid"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Reference ID / Transaction ID</label>
              <input 
                type="text" 
                [(ngModel)]="paymentForm.referenceNo"
                placeholder="e.g., TXN123456, Cheque #789"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <input 
                type="date" 
                [(ngModel)]="paymentForm.paymentDate"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>

            <div class="flex items-center gap-2">
              <input 
                type="checkbox" 
                [(ngModel)]="paymentForm.isOfflinePayment"
                id="offlineCheck"
                class="w-4 h-4 border border-gray-300 rounded">
              <label for="offlineCheck" class="text-sm text-gray-700">
                Mark as Offline Payment
              </label>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p class="font-medium">Payment Type: {{ paymentForm.isOfflinePayment ? 'OFFLINE' : 'ONLINE' }}</p>
              <p class="text-xs mt-1 text-blue-700">Offline payments are recorded manually without online gateway</p>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                (click)="savePayment()"
                class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all">
                Save Payment ✓
              </button>
              <button
                (click)="closePaymentDialog()"
                class="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PaymentRequestsAdminComponent implements OnInit {
  private auth = inject(AuthService);
  private paymentRequestService = inject(PaymentRequestService);

  selectedDistributorId: any = '';
  distributors: any[] = [];
  paymentRequests: any[] = [];
  pastDueInfo: any = null;
  showPaymentDialog = false;
  selectedPayment: any = null;

  paymentForm = {
    amountPaid: 0,
    referenceNo: '',
    paymentDate: new Date().toISOString().split('T')[0],
    isOfflinePayment: true,
  };

  ngOnInit() {
    this.loadDistributors();
  }

  loadDistributors() {
    // For now, using sample data - in production, fetch from API
    this.distributors = [
      {
        id: 1,
        user: { firstName: 'Distributor User1', email: 'distributor1@omniordera.com' }
      },
      {
        id: 2,
        user: { firstName: 'Distributor User2', email: 'distributor2@omniordera.com' }
      },
      {
        id: 3,
        user: { firstName: 'Hiren K', email: 'hiren@acco.com' }
      },
    ];
  }

  loadPaymentRequests() {
    if (!this.selectedDistributorId) {
      this.paymentRequests = [];
      this.pastDueInfo = null;
      return;
    }

    // Load pending payment requests
    this.paymentRequestService.getByDistributor(this.selectedDistributorId, 'pending').subscribe({
      next: (res) => {
        this.paymentRequests = res.data || [];
      },
      error: () => {
        this.paymentRequests = [];
      }
    });

    // Load past due info
    this.paymentRequestService.getPastDueByDistributor(this.selectedDistributorId).subscribe({
      next: (res) => {
        this.pastDueInfo = res.data || null;
      },
      error: () => {
        this.pastDueInfo = null;
      }
    });
  }

  openPaymentDialog(payment: any) {
    this.selectedPayment = payment;
    this.paymentForm = {
      amountPaid: payment.amount,
      referenceNo: '',
      paymentDate: new Date().toISOString().split('T')[0],
      isOfflinePayment: true,
    };
    this.showPaymentDialog = true;
  }

  closePaymentDialog() {
    this.showPaymentDialog = false;
    this.selectedPayment = null;
  }

  savePayment() {
    if (!this.selectedPayment || !this.paymentForm.referenceNo) {
      alert('Please enter reference ID');
      return;
    }

    this.paymentRequestService.recordManualPayment(
      this.selectedPayment.id,
      this.paymentForm.amountPaid,
      this.paymentForm.referenceNo,
      this.paymentForm.paymentDate,
      this.paymentForm.isOfflinePayment
    ).subscribe({
      next: () => {
        alert('Payment marked as done successfully!');
        this.closePaymentDialog();
        this.loadPaymentRequests();
      },
      error: (err) => {
        alert('Error: ' + (err.error?.message || 'Failed to save payment'));
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}
