import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-in-ward',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 min-h-screen p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">📦 In Ward</h1>
              <p class="text-sm text-gray-500 mt-1">Delivered POs awaiting GRN creation</p>
            </div>
          </div>

          <div class="mb-6">
            <input
              type="text"
              placeholder="Search by PO number, distributor..."
              (input)="searchQuery.set($event.target.value)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PO No</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">GRN Status</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (po of filteredPos(); track po.id) {
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td class="px-6 py-4 font-bold text-indigo-600">{{ po.poNo }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(po.createdAt) }}</td>
                  <td class="px-6 py-4 text-gray-900">{{ po.items?.length || 0 }} items</td>
                  <td class="px-6 py-4 text-right font-bold text-indigo-600">₹{{ (+po.totalAmount).toFixed(2) }}</td>
                  <td class="px-6 py-4">
                    <span
                      [class]="'px-3 py-1 text-xs font-semibold rounded-full ' + getGrnStatusClass(po.grnStatus)"
                    >
                      {{ po.grnStatus | uppercase }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm space-x-2">
                    @if (po.grnStatus === 'PENDING') {
                    <button
                      (click)="createGrn(po)"
                      class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition active:scale-95"
                    >
                      Create GRN
                    </button>
                    }
                    @if (po.grnStatus === 'IN_PROGRESS' && po.grnId) {
                    <button
                      (click)="viewGrn(po.grnId)"
                      class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition active:scale-95"
                    >
                      View GRN
                    </button>
                    }
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>

          @if (filteredPos().length === 0) {
          <div class="text-center py-12 text-gray-500">
            <p class="text-lg">No POs in ward</p>
            <p class="text-sm mt-2">All delivered POs have been processed</p>
          </div>
          }

          <div class="mt-4 text-sm text-gray-600">
            Total POs: {{ totalCount() }}
          </div>
        </div>
      </div>
    </div>
  `,
})
export class InWardComponent implements OnInit {
  poService = inject(PurchaseOrderService);
  auth = inject(AuthService);
  router = inject(Router);

  pos = signal<any[]>([]);
  searchQuery = signal('');

  filteredPos = signal<any[]>([]);
  totalCount = signal(0);

  ngOnInit() {
    this.loadDeliveredPos();
  }

  loadDeliveredPos() {
    this.poService.getPurchaseOrders(undefined, 'DELIVERED', 1, 100).subscribe({
      next: (response: any) => {
        const deliveredPos = response.data || [];
        this.pos.set(deliveredPos);
        this.updateFiltered();
      },
      error: (err: any) => {
        console.error('Failed to load POs:', err);
      },
    });
  }

  updateFiltered() {
    const query = this.searchQuery().toLowerCase();
    let filtered = this.pos();

    if (query) {
      filtered = filtered.filter(
        (po) =>
          (po.poNo && po.poNo.toLowerCase().includes(query)) ||
          (po.distributor?.name && po.distributor.name.toLowerCase().includes(query))
      );
    }

    this.filteredPos.set(filtered);
    this.totalCount.set(filtered.length);
  }

  createGrn(po: any) {
    this.router.navigate(['/grn/create', po.id.toString()]);
  }

  viewGrn(grnId: number) {
    this.router.navigate(['/grn/detail', grnId.toString()]);
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

  getGrnStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }
}
