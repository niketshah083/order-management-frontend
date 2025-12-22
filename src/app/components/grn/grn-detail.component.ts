import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GrnService } from '../../services/grn.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-grn-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 min-h-screen p-4 md:p-8">
      <div class="max-w-5xl mx-auto">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          @if (grn()) {
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">GRN {{ grn()?.grnNo }}</h1>
              <p class="text-sm text-gray-500 mt-1">PO: {{ grn()?.purchaseOrder?.poNo }}</p>
            </div>
            <span
              [class]="'px-4 py-2 text-sm font-semibold rounded-full ' + getStatusClass(grn()?.status)"
            >
              {{ grn()?.status | uppercase }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-sm text-blue-600">Created Date</p>
              <p class="font-bold text-blue-900">{{ formatDate(grn()?.createdAt) }}</p>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="text-sm text-green-600">Total Amount</p>
              <p class="font-bold text-green-900">₹{{ (+grn()?.totalAmount).toFixed(2) }}</p>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p class="text-sm text-amber-600">Items</p>
              <p class="font-bold text-amber-900">{{ grn()?.items?.length || 0 }}</p>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-6 mb-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">Items Received</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="px-4 py-2 text-left font-semibold">Item</th>
                    <th class="px-4 py-2 text-center font-semibold">Original Qty</th>
                    <th class="px-4 py-2 text-center font-semibold">Received Qty</th>
                    <th class="px-4 py-2 text-center font-semibold">Pending</th>
                    <th class="px-4 py-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of grn()?.items; track item.id) {
                  <tr class="border-b hover:bg-gray-50">
                    <td class="px-4 py-3">{{ item.item?.name }}</td>
                    <td class="px-4 py-3 text-center">{{ item.originalQuantity }}</td>
                    <td class="px-4 py-3 text-center font-bold text-green-600">
                      {{ item.receivedQuantity }}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span
                        [class]="'px-2 py-1 rounded-full text-xs font-semibold ' +
                          (item.pendingQuantity > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')"
                      >
                        {{ item.pendingQuantity }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">₹{{ (item.unitPrice * item.receivedQuantity).toFixed(2) }}</td>
                  </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          @if (grn()?.remarks) {
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p class="text-sm font-medium text-gray-600">Remarks</p>
            <p class="text-gray-900">{{ grn()?.remarks }}</p>
          </div>
          }

          @if (auth.isDistributor() && grn()?.status === 'DRAFT') {
          <div class="flex gap-4 mb-6">
            <button
              (click)="updateQuantities()"
              class="flex-1 px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium transition"
            >
              Update Quantities
            </button>
            <button
              (click)="approveGrn()"
              [disabled]="isProcessing()"
              class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition active:scale-95"
            >
              {{ isProcessing() ? 'Processing...' : 'Approve & Record Inventory' }}
            </button>
          </div>

          @if (hasPendingItems() > 0) {
          <div class="flex gap-4">
            <button
              (click)="closePo()"
              class="flex-1 px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 font-medium transition"
            >
              Close PO (Mark as Closed)
            </button>
            <button
              (click)="splitPo()"
              class="flex-1 px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition"
            >
              Split PO (Create New for Pending)
            </button>
          </div>
          }
          }

          @if (grn()?.status === 'APPROVED') {
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm font-medium text-green-800">✓ Approved</p>
            <p class="text-sm text-green-700 mt-1">
              Approved on {{ formatDate(grn()?.approvedAt) }}
            </p>
          </div>
          }

          <div class="mt-6 pt-6 border-t border-gray-200">
            <button
              (click)="goBack()"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
            >
              ← Back to In Ward
            </button>
          </div>
          } @else {
          <div class="text-center py-12 text-gray-500">
            <p class="text-lg">Loading GRN...</p>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class GrnDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  grnService = inject(GrnService);
  auth = inject(AuthService);
  router = inject(Router);

  grn = signal<any>(null);
  isProcessing = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadGrn(parseInt(id));
    }
  }

  loadGrn(id: number) {
    this.grnService.getGrnDetail(id).subscribe({
      next: (response: any) => {
        this.grn.set(response.data || response);
      },
      error: (err: any) => {
        console.error('Failed to load GRN:', err);
      },
    });
  }

  approveGrn() {
    if (!this.grn()) return;
    this.isProcessing.set(true);

    this.grnService.approveGrn(this.grn().id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.loadGrn(this.grn().id);
      },
      error: (err: any) => {
        console.error('Failed to approve GRN:', err);
        this.isProcessing.set(false);
      },
    });
  }

  updateQuantities() {
    this.router.navigate(['/grn/update', this.grn().id]);
  }

  closePo() {
    if (!this.grn()) return;
    this.isProcessing.set(true);

    this.grnService.closePo(this.grn().purchaseOrderId).subscribe({
      next: () => {
        this.isProcessing.set(false);
        alert('PO closed successfully');
        this.router.navigate(['/in-ward']);
      },
      error: (err: any) => {
        console.error('Failed to close PO:', err);
        this.isProcessing.set(false);
      },
    });
  }

  splitPo() {
    if (!this.grn()) return;
    
    const pendingItems = this.grn().items
      .filter((item: any) => item.pendingQuantity > 0)
      .map((item: any) => item.poItemId);

    if (pendingItems.length === 0) {
      alert('No pending items to split');
      return;
    }

    this.isProcessing.set(true);
    this.grnService.splitPo(this.grn().purchaseOrderId, pendingItems).subscribe({
      next: () => {
        this.isProcessing.set(false);
        alert('PO split successfully. New PO created for pending items.');
        this.router.navigate(['/purchase-orders']);
      },
      error: (err: any) => {
        console.error('Failed to split PO:', err);
        this.isProcessing.set(false);
      },
    });
  }

  hasPendingItems(): number {
    if (!this.grn()) return 0;
    return this.grn().items.reduce((sum: number, item: any) => sum + item.pendingQuantity, 0);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  goBack() {
    this.router.navigate(['/in-ward']);
  }
}
