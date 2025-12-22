import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReturnsService } from '../../services/returns.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-po-returns-approval',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 min-h-screen p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">PO Returns Approval</h1>
          <p class="text-gray-500 mb-6">Review and approve/reject purchase order returns from distributors</p>

          <div class="mb-6">
            <div class="flex gap-4 flex-wrap">
              <button
                (click)="statusFilter.set('pending')"
                [class.bg-yellow-500]="statusFilter() === 'pending'"
                [class.bg-gray-200]="statusFilter() !== 'pending'"
                class="px-4 py-2 rounded-lg text-sm font-medium text-gray-900 transition"
              >
                Pending ({{ pendingCount() }})
              </button>
              <button
                (click)="statusFilter.set('all')"
                [class.bg-indigo-600]="statusFilter() === 'all'"
                [class.bg-gray-200]="statusFilter() !== 'all'"
                [class.text-white]="statusFilter() === 'all'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                All Returns
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Return No</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Distributor</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                  <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Qty</th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (ret of filteredReturns(); track ret.id) {
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td class="px-6 py-4 font-bold text-indigo-600">{{ ret.returnNo }}</td>
                  <td class="px-6 py-4 text-gray-900 font-medium">{{ ret.distributor?.name || 'N/A' }}</td>
                  <td class="px-6 py-4 text-gray-900">{{ ret.item?.name || 'Item ' + ret.itemId }}</td>
                  <td class="px-6 py-4 text-center text-gray-900">{{ ret.quantity }}</td>
                  <td class="px-6 py-4 text-right font-bold text-indigo-600">₹{{ (+ret.totalAmount).toFixed(2) }}</td>
                  <td class="px-6 py-4">
                    <span
                      [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getStatusClass(ret.status)"
                    >
                      {{ ret.status | uppercase }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    @if (ret.status === 'pending') {
                    <button
                      (click)="openApprovalModal(ret)"
                      class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition active:scale-95"
                    >
                      Approve
                    </button>
                    <button
                      (click)="openRejectModal(ret)"
                      class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition active:scale-95 ml-2"
                    >
                      Reject
                    </button>
                    } @else {
                    <button
                      (click)="viewDetails(ret)"
                      class="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition"
                    >
                      View
                    </button>
                    }
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>

          @if (filteredReturns().length === 0) {
          <div class="text-center py-12 text-gray-500">
            <p class="text-lg">No returns found</p>
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
export class AdminPoReturnsApprovalComponent implements OnInit {
  returnsService = inject(ReturnsService);
  auth = inject(AuthService);

  returns = signal<any[]>([]);
  statusFilter = signal<'pending' | 'all'>('pending');
  showApprovalModal = signal(false);
  showRejectModal = signal(false);
  selectedReturn = signal<any>(null);
  adminComments = '';
  rejectionReason = '';
  isProcessing = signal(false);

  pendingCount = computed(() => this.returns().filter(r => r.status === 'pending').length);

  filteredReturns = computed(() => {
    if (this.statusFilter() === 'pending') {
      return this.returns().filter(r => r.status === 'pending');
    }
    return this.returns();
  });

  ngOnInit() {
    if (this.auth.isAdmin() || this.auth.isManager()) {
      this.loadReturns();
    }
  }

  loadReturns() {
    this.returnsService.getPurchaseReturns().subscribe({
      next: (response) => {
        this.returns.set(response.data || []);
      },
      error: (err) => console.error('Failed to load returns:', err),
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
        this.loadReturns();
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
        this.loadReturns();
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to reject:', err);
        this.isProcessing.set(false);
      },
    });
  }

  viewDetails(ret: any) {
    alert(`Return: ${ret.returnNo}\nStatus: ${ret.status}\nReason: ${ret.rejectionReason || 'N/A'}\nComments: ${ret.adminComments || 'N/A'}`);
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
}
