import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { signal, computed } from '@angular/core';
import { ReturnsService } from '../../services/returns.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sales-return-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-indigo-50 min-h-screen bg-indigo-50 p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Sales Returns</h1>
              <p class="text-sm text-gray-500 mt-1">View and manage sales returns</p>
            </div>
            @if (auth.isDistributor()) {
              <button (click)="navigateToCreate()" class="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all active:scale-95">
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
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Return No</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bill Ref</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Qty</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Rate</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody>
                @for (ret of filteredReturns(); track ret.id) {
                  <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td class="px-4 py-4 font-bold text-indigo-600">{{ ret.returnNo }}</td>
                    <td class="px-4 py-4 text-sm text-gray-600">{{ formatDate(ret.returnDate) }}</td>
                    <td class="px-4 py-4 text-gray-900">
                      <span class="font-medium text-sm">{{ ret.billNo || '-' }}</span>
                    </td>
                    <td class="px-4 py-4 text-gray-900">
                      <div class="font-medium">{{ ret.item?.name || 'Item ' + ret.itemId }}</div>
                      <div class="flex flex-wrap gap-1 mt-1">
                        @if (ret.batchNumber) {
                          <span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">Batch: {{ ret.batchNumber }}</span>
                        }
                        @if (ret.serialNumber) {
                          <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Serial: {{ ret.serialNumber }}</span>
                        }
                      </div>
                    </td>
                    <td class="px-4 py-4 text-center text-gray-900">{{ ret.quantity }}</td>
                    <td class="px-4 py-4 text-right text-gray-900">₹{{ (+ret.rate).toFixed(2) }}</td>
                    <td class="px-4 py-4 text-right font-bold text-indigo-600">₹{{ (+ret.totalAmount).toFixed(2) }}</td>
                    <td class="px-4 py-4">
                      <span [class]="'px-2 py-1 text-xs font-semibold rounded-full ' + getStatusClass(ret.status)">
                        {{ ret.status | uppercase }}
                      </span>
                    </td>
                    <td class="px-4 py-4 text-sm text-gray-600 max-w-32 truncate" [title]="ret.reason">{{ ret.reason || '-' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (filteredReturns().length === 0) {
            <div class="text-center py-12 text-gray-500">
              <p class="text-lg">No sales returns found</p>
              @if (auth.isDistributor()) {
                <p class="text-sm mt-2">Create your first sales return by clicking "Create Return"</p>
              }
            </div>
          }

          <div class="mt-4 text-sm text-gray-600">Total Records: {{ totalCount() }}</div>

          @if (totalPages() > 1) {
            <div class="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <div class="text-sm text-gray-600">Page {{ currentPage() }} of {{ totalPages() }}</div>
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
    </div>
  `
})
export class SalesReturnListComponent implements OnInit {
  returnsService = inject(ReturnsService);
  auth = inject(AuthService);
  router = inject(Router);

  returns = signal<any[]>([]);
  searchQuery = signal('');
  currentPage = signal(1);
  pageSize = 10;

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
    this.loadSalesReturns();
  }

  loadSalesReturns() {
    this.returnsService.getSalesReturns().subscribe({
      next: (response) => {
        this.returns.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load sales returns:', err);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
    this.router.navigate(['/returns/sales/create']);
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }
}
