import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { signal as angularSignal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReturnsService } from '../../services/returns.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-purchase-return-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 min-h-screen bg-indigo-50 p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Purchase Returns</h1>
              <p class="text-sm text-gray-500 mt-1">View and manage purchase returns</p>
            </div>
            @if (auth.isDistributor()) {
            <button
              (click)="navigateToCreate()"
              class="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
            >
              + Create Return
            </button>
            }
          </div>

          <div class="mb-6">
            <input
              type="text"
              placeholder="Search by return no, distributor, or status..."
              (input)="searchQuery.set($event.target.value)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Return No</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Distributor</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                  <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Qty</th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Rate</th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (ret of filteredReturns(); track ret.id) {
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td class="px-6 py-4 font-bold text-indigo-600">{{ ret.returnNo }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(ret.returnDate) }}</td>
                  <td class="px-6 py-4 text-gray-900">
                    <span class="font-medium">{{ ret.distributor?.firstName }} {{ ret.distributor?.lastName }}</span>
                  </td>
                  <td class="px-6 py-4 text-gray-900">
                    <span class="font-medium">{{ ret.item?.name || 'Item ' + ret.itemId }}</span>
                  </td>
                  <td class="px-6 py-4 text-center text-gray-900">{{ ret.quantity }}</td>
                  <td class="px-6 py-4 text-right text-gray-900">₹{{ (+ret.rate).toFixed(2) }}</td>
                  <td class="px-6 py-4 text-right font-bold text-indigo-600">₹{{ (+ret.totalAmount).toFixed(2) }}</td>
                  <td class="px-6 py-4">
                    <span
                      [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getStatusClass(ret.status)"
                    >
                      {{ ret.status | uppercase }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ ret.reason || '-' }}</td>
                  <td class="px-6 py-4 text-sm">
                    @if (auth.isAdmin() && ret.status === 'pending') {
                    <button
                      (click)="openApprovalModal(ret)"
                      class="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition active:scale-95 mr-1"
                      title="Approve return and deduct inventory"
                    >
                      ✓ Approve
                    </button>
                    <button
                      (click)="openRejectModal(ret)"
                      class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition active:scale-95"
                      title="Reject with reason"
                    >
                      ✕ Reject
                    </button>
                    }
                    @if (ret.status === 'approved') {
                    <span class="text-green-700 text-xs font-semibold">✓ Approved</span>
                    }
                    @if (ret.status === 'rejected') {
                    <span class="text-red-700 text-xs font-semibold">✕ Rejected</span>
                    }
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>

          @if (filteredReturns().length === 0) {
          <div class="text-center py-12 text-gray-500">
            <p class="text-lg">No purchase returns found</p>
            @if (auth.isDistributor()) {
            <p class="text-sm mt-2">Create your first purchase return by clicking "Create Return"</p>
            }
          </div>
          }

          <div class="mt-4 text-sm text-gray-600">
            Total Records: {{ totalCount() }}
          </div>

          @if (totalPages() > 1) {
          <div class="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <div class="text-sm text-gray-600">
              Page {{ currentPage() }} of {{ totalPages() }}
            </div>
            <div class="flex gap-2">
              <button
                (click)="previousPage()"
                [disabled]="currentPage() === 1"
                class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
              >
                ← Previous
              </button>
              <button
                (click)="nextPage()"
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

      <!-- Approval Modal -->
      @if (showApprovalModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full">
          <h2 class="text-2xl font-bold mb-4">Approve Return</h2>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-green-800">
              <strong>{{ selectedReturn()?.returnNo }}</strong> - {{ selectedReturn()?.item?.name }}
            </p>
            <p class="text-sm text-green-700 mt-2">Qty: {{ selectedReturn()?.quantity }} | Amount: ₹{{ (+selectedReturn()?.totalAmount).toFixed(2) }}</p>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Admin Comments (Optional)</label>
            <textarea
              [(ngModel)]="adminComments"
              placeholder="Add any notes or comments..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
              rows="3"
            ></textarea>
          </div>
          <div class="flex gap-3">
            <button
              (click)="closeModal()"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              (click)="approveReturn()"
              [disabled]="isProcessing()"
              class="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg font-medium transition active:scale-95"
            >
              {{ isProcessing() ? 'Processing...' : 'Approve' }}
            </button>
          </div>
        </div>
      </div>
      }

      <!-- Reject Modal -->
      @if (showRejectModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full">
          <h2 class="text-2xl font-bold mb-4">Reject Return</h2>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-red-800">
              <strong>{{ selectedReturn()?.returnNo }}</strong> - {{ selectedReturn()?.item?.name }}
            </p>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
            <input
              [(ngModel)]="rejectionReason"
              type="text"
              placeholder="e.g., Invalid, Damaged, Out of Policy"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
            <textarea
              [(ngModel)]="adminComments"
              placeholder="Provide detailed explanation for rejection..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
              rows="3"
            ></textarea>
          </div>
          <div class="flex gap-3">
            <button
              (click)="closeModal()"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              (click)="rejectReturn()"
              [disabled]="!rejectionReason || isProcessing()"
              class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-medium transition active:scale-95"
            >
              {{ isProcessing() ? 'Processing...' : 'Reject' }}
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class PurchaseReturnListComponent implements OnInit {
  returnsService = inject(ReturnsService);
  auth = inject(AuthService);
  router = inject(Router);

  returns = signal<any[]>([]);
  searchQuery = signal('');
  currentPage = signal(1);
  pageSize = 10;
  
  showApprovalModal = signal(false);
  showRejectModal = signal(false);
  selectedReturn = signal<any>(null);
  adminComments = '';
  rejectionReason = '';
  isProcessing = signal(false);

  filteredReturns = computed(() => {
    const query = this.searchQuery().toLowerCase();
    let filtered = this.returns();
    
    if (query) {
      filtered = filtered.filter(
        (ret) =>
          (ret.returnNo && ret.returnNo.toLowerCase().includes(query)) ||
          (ret.distributor?.name && ret.distributor.name.toLowerCase().includes(query)) ||
          (ret.status && ret.status.toLowerCase().includes(query)) ||
          (ret.item?.name && ret.item.name.toLowerCase().includes(query))
      );
    }
    
    const start = (this.currentPage() - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => {
    const query = this.searchQuery().toLowerCase();
    let filtered = this.returns();
    
    if (query) {
      filtered = filtered.filter(
        (ret) =>
          (ret.returnNo && ret.returnNo.toLowerCase().includes(query)) ||
          (ret.distributor?.name && ret.distributor.name.toLowerCase().includes(query)) ||
          (ret.status && ret.status.toLowerCase().includes(query)) ||
          (ret.item?.name && ret.item.name.toLowerCase().includes(query))
      );
    }
    
    return Math.ceil(filtered.length / this.pageSize);
  });

  totalCount = computed(() => this.returns().length);

  ngOnInit() {
    this.loadPurchaseReturns();
  }

  loadPurchaseReturns() {
    this.returnsService.getPurchaseReturns().subscribe({
      next: (response) => {
        this.returns.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load purchase returns:', err);
      },
    });
  }

  openApprovalModal(ret: any) {
    this.selectedReturn.set(ret);
    this.adminComments = '';
    this.showApprovalModal.set(true);
  }

  openRejectModal(ret: any) {
    this.selectedReturn.set(ret);
    this.rejectionReason = '';
    this.adminComments = '';
    this.showRejectModal.set(true);
  }

  closeModal() {
    this.showApprovalModal.set(false);
    this.showRejectModal.set(false);
    this.selectedReturn.set(null);
    this.adminComments = '';
    this.rejectionReason = '';
  }

  approveReturn() {
    if (!this.selectedReturn()) return;
    this.isProcessing.set(true);

    this.returnsService.approvePurchaseReturn(this.selectedReturn().id, 'approved', this.adminComments).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.loadPurchaseReturns();
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to approve:', err);
        this.isProcessing.set(false);
      },
    });
  }

  rejectReturn() {
    if (!this.selectedReturn() || !this.rejectionReason) return;
    this.isProcessing.set(true);

    this.returnsService.approvePurchaseReturn(
      this.selectedReturn().id,
      'rejected',
      this.adminComments,
      this.rejectionReason
    ).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.loadPurchaseReturns();
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to reject:', err);
        this.isProcessing.set(false);
      },
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }

  navigateToCreate() {
    this.router.navigate(['/returns/purchase/create']);
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }
}
