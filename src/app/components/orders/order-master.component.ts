import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, ApiOrder } from '../../services/order.service';
import { ModalComponent } from '../shared/ui/modal.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-order-master',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <div class="bg-indigo-50 p-3 md:p-6 max-w-7xl mx-auto">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3"
      >
        <div>
          <h1
            class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight"
          >
            Order Master
          </h1>
          <p class="text-gray-500 text-sm mt-0.5">
            Track and manage customer orders
          </p>
        </div>
        <input 
          type="text" 
          placeholder="Search orders..." 
          (input)="onSearch($event.target.value)" 
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
        />

        @if (auth.isAdmin() && selectedDbIds().size > 0) {
        <button
          (click)="completeSelected()"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 animate-in slide-in-from-right-5 fade-in"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Complete Selected ({{ selectedDbIds().size }})</span>
        </button>
        }
      </div>

      <!-- Desktop View (Table) -->
      <div
        class="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-950/5"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-gray-50/50 border-b border-gray-100">
              <tr>
                @if (auth.isAdmin()) {
                <th class="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    [checked]="isAllSelected()"
                    (change)="toggleAll($event)"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </th>
                }
                <th
                  class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32"
                >
                  Order ID
                </th>
                <th
                  class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Customer
                </th>
                <th
                  class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right"
                >
                  Total
                </th>
                <th
                  class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center"
                >
                  Status
                </th>
                <th
                  class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (order of orders(); track order.id) {
              <tr
                class="hover:bg-indigo-50/30 transition-colors group"
                [class.bg-indigo-50]="selectedDbIds().has(order.id)"
              >
                @if (auth.isAdmin()) {
                <td class="px-6 py-4">
                  @if (order.status === 'PENDING') {
                  <input
                    type="checkbox"
                    [checked]="selectedDbIds().has(order.id)"
                    (change)="toggleSelection(order.id, $event)"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  }
                </td>
                }
                <td class="px-6 py-4">
                  <span
                    class="font-mono text-sm text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-lg"
                    >#{{ order.orderNo }}</span
                  >
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                  {{ order.customer!.name || 'Unknown' }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ order.createdAt | date : 'mediumDate' }}
                </td>
                <td
                  class="px-6 py-4 text-sm font-bold text-gray-900 text-right"
                >
                  {{ order.totalAmount | currency : 'INR' }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    [class]="getStatusClass(order.status || 'PENDING')"
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      [class.bg-amber-500]="order.status === 'PENDING'"
                      [class.bg-green-500]="order.status === 'COMPLETED'"
                    ></span>
                    {{ order.status || 'PENDING' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <button
                    (click)="viewOrder(order)"
                    class="text-gray-500 hover:text-indigo-600 font-medium text-sm transition-colors flex items-center justify-center mx-auto gap-1 group-hover:bg-white group-hover:shadow-sm px-3 py-1.5 rounded-lg"
                  >
                    View
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile View (Cards) -->
      <div class="md:hidden space-y-3">
        @for (order of orders(); track order.id) {
        <div
          class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-[0.99] transition-transform"
          [class.ring-2]="selectedDbIds().has(order.id)"
          [class.ring-indigo-500]="selectedDbIds().has(order.id)"
          (click)="viewOrder(order)"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <div
                  class="font-mono text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md"
                >
                  #{{ order.orderNo }}
                </div>
                <span class="text-xs text-gray-400">{{
                  order.createdAt | date : 'shortDate'
                }}</span>
              </div>
              <h3 class="font-bold text-gray-900 text-sm">
                {{ order.customer!.name || 'Unknown' }}
              </h3>
            </div>
            <span
              [class]="getStatusClass(order.status || 'PENDING')"
              class="px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap"
            >
              {{ order.status || 'PENDING' }}
            </span>
          </div>

          <div
            class="flex justify-between items-end pt-2 border-t border-gray-50"
          >
            <div class="text-lg font-bold text-gray-900">
              {{ order.totalAmount | currency : 'INR' }}
            </div>
          </div>
        </div>
        } @if (orders().length === 0) {
        <div
          class="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500"
        >
          No orders found
        </div>
        }
      </div>

      <!-- Order Details Modal -->
      <app-modal
        [isOpen]="!!selectedOrder()"
        [title]="'Order #' + selectedOrder()?.orderNo"
        (close)="selectedOrder.set(null)"
      >
        @if (selectedOrder(); as order) {
        <div class="space-y-6">
          <!-- Status Bar (Admin Only) -->
          @if (auth.isAdmin()) {
          <div
            class="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2"
          >
            <span
              class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >Update Order Status</span
            >
            @if (order.status === 'PENDING') {
            <button
              (click)="completeSingleOrder(order)"
              class="w-full py-3 text-sm font-bold rounded-xl border border-indigo-200 bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Mark as Completed
            </button>
            } @else {
            <div
              class="w-full py-3 text-sm font-bold rounded-xl border border-green-200 bg-green-50 text-green-700 flex items-center justify-center gap-2"
            >
              <span class="h-2 w-2 rounded-full bg-green-500"></span>
              Order Completed
            </div>
            }
          </div>
          } @else {
          <div
            class="p-4 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center"
          >
            <span class="text-sm font-medium text-gray-600"
              >Current Status</span
            >
            <span
              [class]="getStatusClass(order.status || 'PENDING')"
              class="px-3 py-1 rounded-full text-sm font-bold border"
            >
              {{ order.status || 'PENDING' }}
            </span>
          </div>
          }

          <!-- Order Items -->
          <!-- Note: Order items are not provided in the list view API. They would ideally be fetched here via getOrderDetails(id) -->
          <div>
            <h4
              class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3"
            >
              Order Items
            </h4>
            <div
              class="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden"
            >
              <div class="p-4 text-center text-gray-400 text-sm italic">
                Items view details not available
              </div>
            </div>
          </div>

          <!-- Totals -->
          <div
            class="flex justify-between items-center pt-4 border-t border-gray-100"
          >
            <span class="text-gray-600 font-medium text-sm">Total Amount</span>
            <span
              class="text-xl md:text-2xl font-bold text-indigo-600 tracking-tight"
              >{{ order.totalAmount | currency : 'INR' }}</span
            >
          </div>
        </div>
        }
      </app-modal>
    </div>
  `,
})
export class OrderMasterComponent implements OnInit {
  orderService = inject(OrderService);
  auth = inject(AuthService);

  orders = signal<ApiOrder[]>([]);
  selectedOrder = signal<ApiOrder | null>(null);
  selectedDbIds = signal<Set<number>>(new Set());

  searchQuery = '';

  ngOnInit() {
    this.fetchOrders();
  }

  fetchOrders(search?: string) {
    this.orderService.getOrders(search).subscribe({
      next: (res) => {
        if (res.data) this.orders.set(res.data);
      },
      error: (err) => console.error(err),
    });
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.fetchOrders(query || undefined);
  }

  isAllSelected = computed(() => {
    const pending = this.orders().filter((o) => o.status === 'PENDING');
    return (
      pending.length > 0 && pending.every((o) => this.selectedDbIds().has(o.id))
    );
  });

  viewOrder(order: ApiOrder) {
    this.selectedOrder.set(order);
  }

  completeSingleOrder(order: ApiOrder) {
    if (confirm('Are you sure you want to mark this order as completed?')) {
      this.orderService.completeOrders([order.id]).subscribe({
        next: () => {
          this.fetchOrders();
          this.selectedOrder.set(null);
        },
        error: (err) => alert('Failed to complete order'),
      });
    }
  }

  completeSelected() {
    const ids = Array.from(this.selectedDbIds());
    if (ids.length === 0) return;

    if (
      confirm(
        `Are you sure you want to mark ${ids.length} orders as completed?`
      )
    ) {
      this.orderService.completeOrders(ids).subscribe({
        next: () => {
          this.fetchOrders();
          this.selectedDbIds.set(new Set());
        },
        error: (err) => alert('Failed to complete orders'),
      });
    }
  }

  toggleSelection(dbId: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedDbIds.update((set) => {
      const newSet = new Set(set);
      if (checked) newSet.add(dbId);
      else newSet.delete(dbId);
      return newSet;
    });
  }

  toggleAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const pendingIds = this.orders()
        .filter((o) => o.status === 'PENDING')
        .map((o) => o.id);
      this.selectedDbIds.set(new Set(pendingIds));
    } else {
      this.selectedDbIds.set(new Set());
    }
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  }
}
