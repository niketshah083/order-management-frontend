import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReturnsService } from '../../services/returns.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-distributor-po-returns',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-indigo-50 min-h-screen p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">My PO Returns</h1>
          <p class="text-gray-500 mb-6">Track your purchase order returns and approval status</p>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="text-yellow-600 text-sm font-medium">Pending</div>
              <div class="text-2xl font-bold text-yellow-800">{{ pendingCount() }}</div>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="text-green-600 text-sm font-medium">Approved</div>
              <div class="text-2xl font-bold text-green-800">{{ approvedCount() }}</div>
            </div>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="text-red-600 text-sm font-medium">Rejected</div>
              <div class="text-2xl font-bold text-red-800">{{ rejectedCount() }}</div>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="text-blue-600 text-sm font-medium">Total</div>
              <div class="text-2xl font-bold text-blue-800">{{ returns().length }}</div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Return No</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                  <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Qty</th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                </tr>
              </thead>
              <tbody>
                @for (ret of returns(); track ret.id) {
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td class="px-6 py-4 font-bold text-indigo-600">{{ ret.returnNo }}</td>
                  <td class="px-6 py-4 text-gray-600">{{ formatDate(ret.returnDate) }}</td>
                  <td class="px-6 py-4 text-gray-900 font-medium">{{ ret.item?.name || 'Item ' + ret.itemId }}</td>
                  <td class="px-6 py-4 text-center text-gray-900">{{ ret.quantity }}</td>
                  <td class="px-6 py-4 text-right font-bold text-indigo-600">₹{{ (+ret.totalAmount).toFixed(2) }}</td>
                  <td class="px-6 py-4 text-gray-600 text-xs">{{ ret.reason || '-' }}</td>
                  <td class="px-6 py-4">
                    <span
                      [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getStatusClass(ret.status)"
                    >
                      {{ ret.status | uppercase }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <button
                      (click)="toggleDetails(ret.id)"
                      class="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition"
                    >
                      {{ expandedId() === ret.id ? 'Hide' : 'View' }}
                    </button>
                  </td>
                </tr>
                @if (expandedId() === ret.id) {
                <tr class="border-b border-gray-100 bg-indigo-50">
                  <td colspan="8" class="px-6 py-4">
                    <div class="grid grid-cols-2 gap-6">
                      <div>
                        <h4 class="font-semibold text-gray-900 mb-2">Return Information</h4>
                        <div class="space-y-2 text-sm">
                          <div><span class="text-gray-600">Return No:</span> <strong>{{ ret.returnNo }}</strong></div>
                          <div><span class="text-gray-600">Date:</span> <strong>{{ formatDate(ret.returnDate) }}</strong></div>
                          <div><span class="text-gray-600">Reason:</span> <strong>{{ ret.reason || 'N/A' }}</strong></div>
                          <div><span class="text-gray-600">Amount:</span> <strong class="text-indigo-600">₹{{ (+ret.totalAmount).toFixed(2) }}</strong></div>
                        </div>
                      </div>
                      <div>
                        <h4 class="font-semibold text-gray-900 mb-2">Admin Review</h4>
                        <div class="space-y-2 text-sm">
                          <div>
                            <span class="text-gray-600">Status:</span>
                            <strong [class]="getStatusClass(ret.status) + ' px-2 py-1 rounded text-xs ml-2'">
                              {{ ret.status | uppercase }}
                            </strong>
                          </div>
                          @if (ret.status === 'rejected') {
                          <div class="bg-red-50 border border-red-200 rounded p-3 mt-3">
                            <div class="text-red-800 font-semibold text-xs">Rejection Reason</div>
                            <div class="text-red-700 text-sm mt-1">{{ ret.rejectionReason || 'No reason provided' }}</div>
                            @if (ret.adminComments) {
                            <div class="text-red-700 text-xs mt-2 italic">{{ ret.adminComments }}</div>
                            }
                          </div>
                          }
                          @if (ret.adminComments && ret.status !== 'rejected') {
                          <div class="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                            <div class="text-blue-800 font-semibold text-xs">Admin Comments</div>
                            <div class="text-blue-700 text-sm mt-1">{{ ret.adminComments }}</div>
                          </div>
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                }
                }
              </tbody>
            </table>
          </div>

          @if (returns().length === 0) {
          <div class="text-center py-12 text-gray-500">
            <p class="text-lg">No returns yet</p>
            <p class="text-sm mt-2">Your purchase order returns will appear here</p>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DistributorPoReturnsComponent implements OnInit {
  returnsService = inject(ReturnsService);

  returns = signal<any[]>([]);
  expandedId = signal<number | null>(null);

  pendingCount = computed(() => this.returns().filter(r => r.status === 'pending').length);
  approvedCount = computed(() => this.returns().filter(r => r.status === 'approved').length);
  rejectedCount = computed(() => this.returns().filter(r => r.status === 'rejected').length);

  ngOnInit() {
    this.loadReturns();
  }

  loadReturns() {
    this.returnsService.getPurchaseReturns().subscribe({
      next: (response) => {
        this.returns.set(response.data || []);
      },
      error: (err) => console.error('Failed to load returns:', err),
    });
  }

  toggleDetails(id: number) {
    this.expandedId.set(this.expandedId() === id ? null : id);
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
}
