import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from '../shared/ui/modal.component';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="bg-indigo-50 min-h-screen p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">📦 Purchase Orders</h1>
            <p class="text-gray-600 text-sm mt-1">
              {{ auth.isAdmin() ? 'Manage all purchase orders' : 'View your purchase orders' }}
            </p>
          </div>
          @if (!auth.isAdmin()) {
          <button
            (click)="router.navigate(['/purchase-orders/create'])"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg transition-all active:scale-95"
          >
            + Create New PO
          </button>
          }
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label class="text-xs font-semibold text-gray-600 mb-1.5 block">Search</label>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="loadPurchaseOrders()"
                placeholder="PO number..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 mb-1.5 block">Approval Status</label>
              <select
                [(ngModel)]="approvalStatusFilter"
                (change)="loadPurchaseOrders()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
              >
                <option value="">All</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 mb-1.5 block">Delivery Status</label>
              <select
                [(ngModel)]="statusFilter"
                (change)="loadPurchaseOrders()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="DELIVERED">Delivered</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                (click)="clearFilters()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Success/Error Messages -->
        @if (successMessage()) {
        <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-sm text-green-800">✅ {{ successMessage() }}</p>
        </div>
        }
        @if (errorMessage()) {
        <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-800">❌ {{ errorMessage() }}</p>
        </div>
        }

        <!-- PO List -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          @if (isLoading()) {
          <div class="p-12 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p class="text-gray-600 mt-2">Loading purchase orders...</p>
          </div>
          } @else if (purchaseOrders().length === 0) {
          <div class="p-12 text-center">
            <p class="text-gray-500 font-medium">No purchase orders found</p>
          </div>
          } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">PO Number</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">Distributor</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">Items</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">Approval</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">Date</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <!-- Debug: Total POs = {{ purchaseOrders().length }} -->
                @for (po of purchaseOrders(); track po.id) {
                <tr class="hover:bg-indigo-50/50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">{{ po?.poNo || 'N/A' }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    {{ getDistributorName(po) }}
                  </td>
                  <td class="px-4 py-3 text-sm font-medium text-right text-gray-900">
                    ₹{{ formatCurrency(po?.totalAmount) }}
                  </td>
                  <td class="px-4 py-3 text-center text-sm text-gray-600">
                    {{ po?.items?.length || 0 }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span
                      [class]="getApprovalStatusClass(po?.approvalStatus || 'PENDING')"
                      class="px-2 py-1 rounded text-xs font-semibold"
                    >
                      {{ getApprovalStatusLabel(po?.approvalStatus || 'PENDING') }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span
                      [class]="getStatusClass(po?.status || 'PENDING')"
                      class="px-2 py-1 rounded text-xs font-semibold"
                    >
                      {{ po?.status || 'PENDING' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center text-xs text-gray-600">
                    {{ formatDate(po?.createdAt) }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <!-- View Button -->
                      <button
                        (click)="viewPO(po)"
                        title="View Details"
                        class="text-blue-600 hover:bg-blue-100 p-2 rounded transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      <!-- Admin Actions -->
                      @if (auth.isAdmin() && po.approvalStatus === 'PENDING') {
                      <button
                        (click)="openApproveModal(po)"
                        title="Approve PO"
                        class="text-green-600 hover:bg-green-100 p-2 rounded transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        (click)="openRejectModal(po)"
                        title="Reject PO"
                        class="text-red-600 hover:bg-red-100 p-2 rounded transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      }

                      @if (auth.isAdmin() && po.approvalStatus === 'APPROVED' && po.status !== 'DELIVERED') {
                      <button
                        (click)="markAsDelivered(po)"
                        title="Mark as Delivered"
                        class="text-indigo-600 hover:bg-indigo-100 p-2 rounded transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </button>
                      }
                    </div>
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
          }
        </div>
      </div>
    </div>

    <!-- Approve Modal -->
    <app-modal [isOpen]="showApproveModal()" [title]="'Approve Purchase Order'" (close)="closeApproveModal()">
      @if (selectedPO()) {
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-900">
            <strong>PO Number:</strong> {{ selectedPO()!.poNo }}
          </p>
          <p class="text-sm text-blue-900 mt-1">
            <strong>Distributor:</strong> {{ getDistributorName(selectedPO()!) }}
          </p>
          <p class="text-sm text-blue-900 mt-1">
            <strong>Amount:</strong> ₹{{ formatCurrency(selectedPO()!.totalAmount) }}
          </p>
        </div>
        <p class="text-sm text-gray-700">
          Are you sure you want to approve this purchase order? Once approved, it can be marked as delivered.
        </p>
        <div class="flex gap-3 pt-4">
          <button
            (click)="closeApproveModal()"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Cancel
          </button>
          <button
            (click)="confirmApprove()"
            [disabled]="isSubmitting()"
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition active:scale-95"
          >
            {{ isSubmitting() ? 'Approving...' : '✓ Approve' }}
          </button>
        </div>
      </div>
      }
    </app-modal>

    <!-- Reject Modal -->
    <app-modal [isOpen]="showRejectModal()" [title]="'Reject Purchase Order'" (close)="closeRejectModal()">
      @if (selectedPO()) {
      <div class="space-y-4">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-900">
            <strong>PO Number:</strong> {{ selectedPO()!.poNo }}
          </p>
          <p class="text-sm text-red-900 mt-1">
            <strong>Distributor:</strong> {{ getDistributorName(selectedPO()!) }}
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
          <textarea
            [(ngModel)]="rejectionReason"
            placeholder="Please provide a reason for rejection..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
            rows="4"
          ></textarea>
        </div>
        <div class="flex gap-3 pt-4">
          <button
            (click)="closeRejectModal()"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Cancel
          </button>
          <button
            (click)="confirmReject()"
            [disabled]="isSubmitting() || !rejectionReason.trim()"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition active:scale-95"
          >
            {{ isSubmitting() ? 'Rejecting...' : '✗ Reject' }}
          </button>
        </div>
      </div>
      }
    </app-modal>

    <!-- View PO Details Modal -->
    <app-modal [isOpen]="showViewModal()" [title]="'Purchase Order Details'" (close)="closeViewModal()">
      @if (selectedPO()) {
      <div class="space-y-6">
        <!-- PO Header Info -->
        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-semibold text-indigo-900 mb-1">PO Number</p>
              <p class="text-sm text-indigo-800 font-medium">{{ selectedPO()!.poNo }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-indigo-900 mb-1">Total Amount</p>
              <p class="text-sm text-indigo-800 font-medium">₹{{ formatCurrency(selectedPO()!.totalAmount) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-indigo-900 mb-1">Distributor</p>
              <p class="text-sm text-indigo-800 font-medium">{{ getDistributorName(selectedPO()!) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-indigo-900 mb-1">Created Date</p>
              <p class="text-sm text-indigo-800 font-medium">{{ formatDate(selectedPO()!.createdAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Status Info -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs font-semibold text-gray-600 mb-2">Approval Status</p>
            <span
              [class]="getApprovalStatusClass(selectedPO()!.approvalStatus)"
              class="px-3 py-1.5 rounded text-sm font-semibold inline-block"
            >
              {{ getApprovalStatusLabel(selectedPO()!.approvalStatus) }}
            </span>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-600 mb-2">Delivery Status</p>
            <span
              [class]="getStatusClass(selectedPO()!.status)"
              class="px-3 py-1.5 rounded text-sm font-semibold inline-block"
            >
              {{ selectedPO()!.status }}
            </span>
          </div>
        </div>

        <!-- Items List -->
        <div>
          <p class="text-sm font-bold text-gray-900 mb-3">📦 Items ({{ selectedPO()!.items?.length || 0 }})</p>
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600">Item</th>
                  <th class="px-3 py-2 text-center text-xs font-semibold text-gray-600">Qty</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-600">Rate</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (item of selectedPO()!.items; track item.id) {
                <tr>
                  <td class="px-3 py-2 text-sm text-gray-900">{{ item.item?.name || 'Item #' + item.itemId }}</td>
                  <td class="px-3 py-2 text-sm text-center text-gray-600">{{ item.quantity }}</td>
                  <td class="px-3 py-2 text-sm text-right text-gray-600">₹{{ formatCurrency(item.unitPrice) }}</td>
                  <td class="px-3 py-2 text-sm text-right font-medium text-gray-900">₹{{ formatCurrency(item.quantity * item.unitPrice) }}</td>
                </tr>
                }
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="3" class="px-3 py-2 text-sm font-bold text-gray-900 text-right">Total:</td>
                  <td class="px-3 py-2 text-sm font-bold text-indigo-600 text-right">₹{{ formatCurrency(selectedPO()!.totalAmount) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Rejection Reason (if rejected) -->
        @if (selectedPO()!.approvalStatus === 'REJECTED' && selectedPO()!.rejectionReason) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-xs font-semibold text-red-900 mb-1">Rejection Reason</p>
          <p class="text-sm text-red-800">{{ selectedPO()!.rejectionReason }}</p>
        </div>
        }

        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <button
            (click)="closeViewModal()"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Close
          </button>
          @if (auth.isAdmin() && selectedPO()!.approvalStatus === 'PENDING') {
          <button
            (click)="openApproveFromView()"
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            ✓ Approve
          </button>
          <button
            (click)="openRejectFromView()"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            ✗ Reject
          </button>
          }
          @if (auth.isAdmin() && selectedPO()!.approvalStatus === 'APPROVED' && selectedPO()!.status !== 'DELIVERED') {
          <button
            (click)="markAsDeliveredFromView()"
            class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
          >
            📦 Mark as Delivered
          </button>
          }
        </div>
      </div>
      }
    </app-modal>
  `,
})
export class PurchaseOrderListComponent implements OnInit {
  poService = inject(PurchaseOrderService);
  auth = inject(AuthService);
  router = inject(Router);

  purchaseOrders = signal<PurchaseOrder[]>([]);
  isLoading = signal(false);
  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  searchQuery = '';
  statusFilter = '';
  approvalStatusFilter = '';

  showApproveModal = signal(false);
  showRejectModal = signal(false);
  showViewModal = signal(false);
  selectedPO = signal<PurchaseOrder | null>(null);
  rejectionReason = '';

  ngOnInit() {
    this.loadPurchaseOrders();
  }

  loadPurchaseOrders() {
    this.isLoading.set(true);
    this.poService
      .getPurchaseOrders(this.searchQuery, this.statusFilter, 1, 100)
      .subscribe({
        next: (response) => {
          console.log('=== PO API Response ===');
          console.log('Full Response:', response);
          console.log('Response Data:', response.data);
          
          let orders = response.data || [];
          
          if (orders.length > 0) {
            console.log('First PO Sample:', orders[0]);
            console.log('First PO Distributor:', orders[0].distributor);
            console.log('First PO Items:', orders[0].items);
            console.log('First PO Total Amount:', orders[0].totalAmount);
            console.log('First PO Approval Status:', orders[0].approvalStatus);
          }
          
          // Filter by approval status if selected
          if (this.approvalStatusFilter) {
            orders = orders.filter(
              (po: PurchaseOrder) => po.approvalStatus === this.approvalStatusFilter
            );
          }
          
          console.log('Total Orders After Filter:', orders.length);
          this.purchaseOrders.set(orders);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading purchase orders:', err);
          this.errorMessage.set('Failed to load purchase orders');
          this.isLoading.set(false);
          setTimeout(() => this.errorMessage.set(''), 3000);
        },
      });
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.approvalStatusFilter = '';
    this.loadPurchaseOrders();
  }

  getApprovalStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getApprovalStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return '⏳ Pending';
      case 'APPROVED':
        return '✓ Approved';
      case 'REJECTED':
        return '✗ Rejected';
      default:
        return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'DELIVERED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getDistributorName(po: PurchaseOrder): string {
    if (!po || !po.distributor) {
      return 'N/A';
    }
    
    // Priority 1: Try nested distributor.distributor.businessName (UserEntity -> DistributorEntity)
    if (po.distributor.distributor?.businessName) {
      return po.distributor.distributor.businessName;
    }
    
    // Priority 2: Try firstName + lastName from UserEntity
    const firstName = po.distributor.firstName || '';
    const lastName = po.distributor.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (fullName) {
      return fullName;
    }
    
    return 'N/A';
  }

  // Helper method to safely format currency values (handles string/number conversion)
  formatCurrency(value: any): string {
    if (value === null || value === undefined) return '0.00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
  }

  viewPO(po: PurchaseOrder) {
    this.selectedPO.set(po);
    this.showViewModal.set(true);
  }

  closeViewModal() {
    this.showViewModal.set(false);
    this.selectedPO.set(null);
  }

  openApproveFromView() {
    const po = this.selectedPO();
    if (po) {
      this.closeViewModal();
      this.openApproveModal(po);
    }
  }

  openRejectFromView() {
    const po = this.selectedPO();
    if (po) {
      this.closeViewModal();
      this.openRejectModal(po);
    }
  }

  markAsDeliveredFromView() {
    const po = this.selectedPO();
    if (po) {
      this.closeViewModal();
      this.markAsDelivered(po);
    }
  }

  openApproveModal(po: any) {
    this.selectedPO.set(po);
    this.showApproveModal.set(true);
  }

  closeApproveModal() {
    this.showApproveModal.set(false);
    this.selectedPO.set(null);
  }

  confirmApprove() {
    const po = this.selectedPO();
    if (!po) return;

    this.isSubmitting.set(true);
    this.poService.approvePurchaseOrder(po.id).subscribe({
      next: () => {
        this.successMessage.set(`Purchase order ${po.poNo} approved successfully!`);
        this.closeApproveModal();
        this.loadPurchaseOrders();
        this.isSubmitting.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        console.error('Error approving PO:', err);
        this.errorMessage.set(err.error?.message || 'Failed to approve purchase order');
        this.isSubmitting.set(false);
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  openRejectModal(po: any) {
    this.selectedPO.set(po);
    this.rejectionReason = '';
    this.showRejectModal.set(true);
  }

  closeRejectModal() {
    this.showRejectModal.set(false);
    this.selectedPO.set(null);
    this.rejectionReason = '';
  }

  confirmReject() {
    const po = this.selectedPO();
    if (!po || !this.rejectionReason.trim()) return;

    this.isSubmitting.set(true);
    this.poService.rejectPurchaseOrder(po.id, this.rejectionReason).subscribe({
      next: () => {
        this.successMessage.set(`Purchase order ${po.poNo} rejected`);
        this.closeRejectModal();
        this.loadPurchaseOrders();
        this.isSubmitting.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        console.error('Error rejecting PO:', err);
        this.errorMessage.set(err.error?.message || 'Failed to reject purchase order');
        this.isSubmitting.set(false);
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  markAsDelivered(po: any) {
    if (!confirm(`Mark PO ${po.poNo} as delivered?`)) return;

    this.isSubmitting.set(true);
    this.poService.markAsDelivered(po.id).subscribe({
      next: () => {
        this.successMessage.set(`Purchase order ${po.poNo} marked as delivered!`);
        this.loadPurchaseOrders();
        this.isSubmitting.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        console.error('Error marking as delivered:', err);
        this.errorMessage.set(err.error?.message || 'Failed to mark as delivered');
        this.isSubmitting.set(false);
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }
}

// Interface matching backend response
interface PurchaseOrder {
  id: number;
  poNo: string;
  distributorId: number;
  totalAmount: number;
  status: string;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectedBy?: number;
  rejectedAt?: string;
  rejectionReason?: string;
  items: any[];
  distributor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    distributor?: {
      id: number;
      businessName: string;
      gstin: string;
    };
  };
}
