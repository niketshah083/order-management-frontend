import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentRequestService } from '../../services/payment-request.service';
import { BillingService } from '../../services/billing.service';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';

interface PaymentRequest {
  id: number;
  orderId: number;
  distributorId: number;
  amount: number;
  status: string;
  upiStatus: string;
  amountPaid?: number;
  isAutoTriggered: boolean;
  paymentType: 'cash' | 'online' | 'credit';
  createdAt: string;
  updatedAt: string;
  order?: any;
  distributor?: any;
}

@Component({
  selector: 'app-payment-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 min-h-screen p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white text-xl">
            💰
          </div>
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900">My Pending Requests</h1>
            <p class="text-gray-600 mt-1">Payment requests raised by admins for you to pay</p>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div class="text-gray-600 text-sm font-medium">Total Requests</div>
          <div class="text-3xl font-bold text-blue-600 mt-2">{{ allRequests().length || 0 }}</div>
        </div>
        <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div class="text-gray-600 text-sm font-medium">Pending</div>
          <div class="text-3xl font-bold text-orange-600 mt-2">{{ getPendingCount() }}</div>
        </div>
        <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div class="text-gray-600 text-sm font-medium">Paid</div>
          <div class="text-3xl font-bold text-green-600 mt-2">{{ getPaidCount() }}</div>
        </div>
        <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div class="text-gray-600 text-sm font-medium">Auto-Triggered</div>
          <div class="text-3xl font-bold text-purple-600 mt-2">{{ getAutoTriggeredCount() }}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200 overflow-x-auto">
          <div class="flex">
            <button
              *ngFor="let tab of tabs"
              (click)="activeTab.set(tab.id)"
              [class.border-b-2]="activeTab() === tab.id"
              [class.border-blue-600]="activeTab() === tab.id"
              [class.text-blue-600]="activeTab() === tab.id"
              [class.text-gray-600]="activeTab() !== tab.id"
              class="px-6 py-4 font-medium whitespace-nowrap transition-colors hover:text-blue-600"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Pending Requests Tab -->
          <div *ngIf="activeTab() === 'pending'" class="space-y-4">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Pending Payment Requests</h3>
            
            <div *ngIf="loading()" class="text-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>

            <div *ngIf="!loading() && pendingRequests().length === 0" class="text-center py-8 text-gray-500">
              No pending payment requests
            </div>

            <div *ngIf="!loading() && pendingRequests().length > 0" class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order</th>
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Distributor</th>
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">UPI Status</th>
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Auto-Triggered</th>
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let req of pendingRequests()" class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-900">Order #{{ req.orderId }}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">{{ req.distributor?.firstName || '-' }}</td>
                    <td class="px-6 py-4 text-sm font-semibold text-gray-900">₹{{ (req.amount || 0) | number:'1.2-2' }}</td>
                    <td class="px-6 py-4">
                      <span 
                        [ngClass]="getUpiStatusClass(req.upiStatus)"
                        class="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        {{ req.upiStatus || 'pending' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm">
                      <span *ngIf="req.isAutoTriggered" class="text-purple-600 font-medium">Auto</span>
                      <span *ngIf="!req.isAutoTriggered" class="text-gray-400">Manual</span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">
                      {{ (req.createdAt | slice:0:10) }}
                    </td>
                    <td class="px-6 py-4">
                      <button
                        (click)="createPaymentLink(req.id)"
                        [disabled]="creatingLink() === req.id"
                        class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium disabled:bg-gray-400"
                      >
                        {{ creatingLink() === req.id ? 'Creating...' : 'Create Link' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Create New Request Tab -->
          <div *ngIf="activeTab() === 'create'" class="space-y-6 max-w-2xl">
            <h3 class="text-xl font-bold text-gray-900">Create New Payment Request</h3>
            
            <div class="space-y-4">
              <!-- Payment Type Selection -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-3">Payment Type *</label>
                <div class="space-y-2">
                  <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50" [class.border-blue-500]="paymentTypeForCreate() === 'cash'">
                    <input type="radio" value="cash" [(ngModel)]="paymentTypeForCreate" [ngModelOptions]="{standalone: true}" (change)="onPaymentTypeChange()" class="mr-3" />
                    <div>
                      <div class="font-medium text-gray-900">Cash</div>
                      <div class="text-xs text-gray-600">Default payment method</div>
                    </div>
                  </label>
                  <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50" [class.border-blue-500]="paymentTypeForCreate() === 'online'">
                    <input type="radio" value="online" [(ngModel)]="paymentTypeForCreate" [ngModelOptions]="{standalone: true}" (change)="onPaymentTypeChange()" class="mr-3" />
                    <div>
                      <div class="font-medium text-gray-900">Online (Razorpay)</div>
                      <div class="text-xs text-gray-600">Instant payment link generation</div>
                    </div>
                  </label>
                  <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50" [class.border-blue-500]="paymentTypeForCreate() === 'credit'">
                    <input type="radio" value="credit" [(ngModel)]="paymentTypeForCreate" [ngModelOptions]="{standalone: true}" (change)="onPaymentTypeChange()" class="mr-3" />
                    <div>
                      <div class="font-medium text-gray-900">Credit</div>
                      <div class="text-xs text-gray-600">Credit invoice payment</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Customer Selection -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Select Customer *</label>
                <select
                  (change)="onCustomerSelected($event)"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- Select a Customer --</option>
                  <option *ngFor="let customer of customers()" [value]="customer.id">
                    {{ customer.firstname }} {{ customer.lastname }} ({{ customer.mobileNo }})
                  </option>
                </select>
              </div>

              <!-- Pending Invoices (for all payment types) -->
              <div *ngIf="selectedCustomerId() && pendingInvoices().length > 0">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Select Pending Invoice</label>
                <div class="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                  <div *ngFor="let invoice of pendingInvoices()" class="p-2 hover:bg-blue-50 rounded cursor-pointer border border-gray-200">
                    <div class="text-sm font-medium text-gray-900">Bill #{{ invoice.billNo }}</div>
                    <div class="text-xs text-gray-600">Amount: ₹{{ (invoice.finalAmount || 0) | number:'1.2-2' }} | Date: {{ (invoice.billDate | slice:0:10) }}</div>
                  </div>
                </div>
              </div>

              <!-- Credit Invoices (for credit payment type) -->
              <div *ngIf="paymentTypeForCreate() === 'credit' && creditInvoices().length > 0">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Credit Invoices</label>
                <div class="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                  <div *ngFor="let invoice of creditInvoices()" class="p-2 hover:bg-purple-50 rounded border border-gray-200">
                    <div class="text-sm font-medium text-gray-900">Bill #{{ invoice.billNo }}</div>
                    <div class="text-xs text-gray-600">Amount: ₹{{ (invoice.finalAmount || 0) | number:'1.2-2' }} | Due: {{ (invoice.billDate | slice:0:10) }}</div>
                  </div>
                </div>
              </div>

              <!-- Amount -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Amount (₹) *</label>
                <input
                  type="number"
                  [(ngModel)]="newRequest.amount"
                  placeholder="Enter amount"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                (click)="submitNewRequest()"
                [disabled]="submitting()"
                class="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:bg-gray-400"
              >
                {{ submitting() ? 'Creating...' : 'Create Request' }}
              </button>
            </div>
          </div>

          <!-- All Requests Tab -->
          <div *ngIf="activeTab() === 'all'" class="space-y-4">
            <h3 class="text-xl font-bold text-gray-900 mb-4">All Payment Requests</h3>
            
            <div *ngIf="loading()" class="text-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>

            <div *ngIf="!loading() && allRequests().length === 0" class="text-center py-8 text-gray-500">
              No payment requests found
            </div>

            <div *ngIf="!loading() && allRequests().length > 0" class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="px-6 py-3 text-left font-semibold text-gray-900">ID</th>
                    <th class="px-6 py-3 text-left font-semibold text-gray-900">Order</th>
                    <th class="px-6 py-3 text-left font-semibold text-gray-900">Amount</th>
                    <th class="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th class="px-6 py-3 text-left font-semibold text-gray-900">UPI Status</th>
                    <th class="px-6 py-3 text-left font-semibold text-gray-900">Created</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let req of allRequests()" class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="px-6 py-4 text-gray-900">#{{ req.id }}</td>
                    <td class="px-6 py-4 text-gray-900">{{ req.orderId }}</td>
                    <td class="px-6 py-4 font-semibold text-gray-900">₹{{ (req.amount || 0) | number:'1.2-2' }}</td>
                    <td class="px-6 py-4">
                      <span 
                        [ngClass]="getStatusClass(req.status)"
                        class="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        {{ req.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span 
                        [ngClass]="getUpiStatusClass(req.upiStatus)"
                        class="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        {{ req.upiStatus }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-gray-600">{{ (req.createdAt | slice:0:10) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Auto-Triggered Tab -->
          <div *ngIf="activeTab() === 'auto-triggered'" class="space-y-4">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Auto-Triggered Payment Requests</h3>
            <p class="text-gray-600 text-sm mb-4">Requests automatically created when credit limit is about to expire (3 days before limit)</p>
            
            <div *ngIf="loading()" class="text-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>

            <div *ngIf="!loading() && getAutoTriggeredRequests().length === 0" class="text-center py-8 text-gray-500">
              No auto-triggered requests
            </div>

            <div *ngIf="!loading() && getAutoTriggeredRequests().length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let req of getAutoTriggeredRequests()" class="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h4 class="text-lg font-bold text-gray-900">Order #{{ req.orderId }}</h4>
                    <p class="text-sm text-gray-600">Request #{{ req.id }}</p>
                  </div>
                  <span class="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Auto</span>
                </div>
                <div class="space-y-2 mb-4">
                  <p class="flex justify-between"><span class="text-gray-600">Amount:</span> <span class="font-semibold">₹{{ (req.amount || 0) | number:'1.2-2' }}</span></p>
                  <p class="flex justify-between"><span class="text-gray-600">Status:</span> <span [ngClass]="getStatusClass(req.status)" class="px-2 py-0.5 rounded text-xs font-semibold">{{ req.status }}</span></p>
                  <p class="flex justify-between"><span class="text-gray-600">UPI Status:</span> <span [ngClass]="getUpiStatusClass(req.upiStatus)" class="px-2 py-0.5 rounded text-xs font-semibold">{{ req.upiStatus }}</span></p>
                </div>
                <button
                  (click)="createPaymentLink(req.id)"
                  [disabled]="creatingLink() === req.id"
                  class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:bg-gray-400"
                >
                  {{ creatingLink() === req.id ? 'Creating Link...' : 'Create UPI Link' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  `,
  styles: [],
})
export class PaymentRequestsComponent implements OnInit {
  private paymentService = inject(PaymentRequestService);
  private billingService = inject(BillingService);
  private customerService = inject(CustomerService);
  private auth = inject(AuthService);

  activeTab = signal<string>('pending');
  loading = signal(false);
  submitting = signal(false);
  creatingLink = signal<number | null>(null);

  allRequests = signal<PaymentRequest[]>([]);
  customers = signal<any[]>([]);
  pendingInvoices = signal<any[]>([]);
  creditInvoices = signal<any[]>([]);
  
  newRequest: {
    orderId: number | null;
    distributorId: number | null;
    amount: number | null;
    paymentType: 'cash' | 'online' | 'credit';
    customerId: number | null;
    billingId: number | null;
  } = {
    orderId: null,
    distributorId: null,
    amount: null,
    paymentType: 'cash',
    customerId: null,
    billingId: null,
  };

  selectedCustomerId = signal<number | null>(null);
  paymentTypeForCreate = signal<'cash' | 'online' | 'credit'>('cash');

  tabs = [
    { id: 'pending', label: 'Pending Requests' },
    { id: 'create', label: 'Create New' },
    { id: 'auto-triggered', label: 'Auto-Triggered' },
    { id: 'all', label: 'All Requests' },
  ];

  ngOnInit() {
    this.loadPaymentRequests();
    this.loadCustomers();
    this.loadInvoices();
  }

  loadPaymentRequests() {
    this.loading.set(true);
    const currentUser = this.auth.getCurrentUser();
    
    // If distributor, load only their pending requests
    if (this.auth.isDistributor() && currentUser?.id) {
      this.paymentService.getByDistributor(currentUser.id, 'pending').subscribe({
        next: (response: any) => {
          this.allRequests.set(response.data || []);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading payment requests:', error);
          this.loading.set(false);
        },
      });
    } else {
      // Admins/Managers see all requests
      this.paymentService.getPaymentRequests().subscribe({
        next: (response: any) => {
          this.allRequests.set(response.data || []);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading payment requests:', error);
          this.loading.set(false);
        },
      });
    }
  }

  loadCustomers() {
    this.customerService.getCustomers().subscribe({
      next: (response: any) => {
        this.customers.set(response.data || []);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
      },
    });
  }

  loadInvoices() {
    this.billingService.getBillings().subscribe({
      next: (response: any) => {
        const allInvoices = response.data || [];
        this.pendingInvoices.set(allInvoices.filter((inv: any) => inv.status !== 'paid'));
        this.creditInvoices.set(allInvoices.filter((inv: any) => inv.paymentType === 'credit'));
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
      },
    });
  }

  onCustomerSelected(event: any) {
    const customerId = Number((event.target as HTMLSelectElement).value);
    if (customerId) {
      this.selectedCustomerId.set(customerId);
      this.newRequest.customerId = customerId;
    }
  }

  onPaymentTypeChange() {
    this.newRequest.paymentType = this.paymentTypeForCreate();
  }

  pendingRequests(): PaymentRequest[] {
    return this.allRequests().filter((r) => r.status === 'pending');
  }

  getAutoTriggeredRequests(): PaymentRequest[] {
    return this.allRequests().filter((r) => r.isAutoTriggered);
  }

  getPendingCount(): number {
    return this.pendingRequests().length;
  }

  getPaidCount(): number {
    return this.allRequests().filter((r) => r.status === 'paid').length;
  }

  getAutoTriggeredCount(): number {
    return this.getAutoTriggeredRequests().length;
  }

  createPaymentLink(id: number) {
    this.creatingLink.set(id);
    this.paymentService.createRazorpayLink(id).subscribe({
      next: (response: any) => {
        console.log('Payment link created:', response.data);
        alert(`Payment link created!\nShort URL: ${response.data.shortUrl}`);
        this.loadPaymentRequests();
        this.creatingLink.set(null);
      },
      error: (error) => {
        console.error('Error creating payment link:', error);
        alert('Failed to create payment link');
        this.creatingLink.set(null);
      },
    });
  }

  submitNewRequest() {
    if (!this.newRequest.amount || !this.newRequest.customerId) {
      alert('Please fill all required fields');
      return;
    }

    this.submitting.set(true);
    this.paymentService.create(this.newRequest).subscribe({
      next: (response: any) => {
        alert('Payment request created successfully');
        if (this.paymentTypeForCreate() === 'online') {
          setTimeout(() => {
            this.createPaymentLink(response.data.id);
          }, 500);
        }
        this.newRequest = { 
          orderId: null, 
          distributorId: null, 
          amount: null,
          paymentType: 'cash',
          customerId: null,
          billingId: null,
        };
        this.selectedCustomerId.set(null);
        this.activeTab.set('pending');
        this.loadPaymentRequests();
        this.submitting.set(false);
      },
      error: (error) => {
        console.error('Error creating request:', error);
        alert('Failed to create request');
        this.submitting.set(false);
      },
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getUpiStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}
