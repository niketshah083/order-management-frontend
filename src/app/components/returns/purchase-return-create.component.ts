import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReturnsService } from '../../services/returns.service';
import { ItemService } from '../../services/item.service';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-purchase-return-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 min-h-screen bg-indigo-50 p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Create Purchase Return</h1>
          <p class="text-gray-500 mt-1">Return items from your purchase orders</p>
        </div>

      <form (ngSubmit)="submitForm()" class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <!-- Purchase Order Number -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Purchase Order No *</label>
          <select
            [(ngModel)]="formData.poNumber"
            name="poNumber"
            (change)="onPOChange()"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select Purchase Order</option>
            @for (po of purchaseOrders; track po.id) {
            <option [value]="po.poNo">{{ po.poNo }} - ₹{{ (+po.totalAmount).toFixed(2) }}</option>
            }
          </select>
          @if (formError.poNumber) {
          <p class="text-red-600 text-sm mt-1">{{ formError.poNumber }}</p>
          }
        </div>

        <!-- Items Section -->
        @if (selectedPO) {
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Items to Return *</label>
          <div class="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
            @for (poItem of selectedPO.items; track poItem.id) {
            <div class="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-100">
              <input
                type="checkbox"
                [id]="'item-' + poItem.id"
                [(ngModel)]="poItem.selected"
                [name]="'item-' + poItem.id"
                class="h-4 w-4 rounded"
              />
              <div class="flex-1">
                <label [for]="'item-' + poItem.id" class="font-medium text-gray-900">
                  {{ poItem.item?.name }}
                </label>
                <div class="text-sm text-gray-600">
                  Qty: {{ poItem.quantity }} | Rate: ₹{{ (+poItem.unitPrice).toFixed(2) }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-700">Return Qty:</label>
                <input
                  type="number"
                  [(ngModel)]="poItem.returnQuantity"
                  [name]="'returnQty-' + poItem.id"
                  min="1"
                  [max]="poItem.quantity"
                  class="w-20 px-2 py-1 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            }
          </div>
          @if (formError.items) {
          <p class="text-red-600 text-sm mt-1">{{ formError.items }}</p>
          }
        </div>
        }

        <!-- Reason -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Reason for Return *</label>
          <select
            [(ngModel)]="formData.reason"
            name="reason"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">Select a reason</option>
            <option value="Quality Issue">Quality Issue - Product defective or damaged</option>
            <option value="Pest Damaged">Pest Damaged - Infestation detected</option>
            <option value="Weather Damage">Weather Damage - Affected by moisture/rain</option>
            <option value="Expired Stock">Expired Stock - Product past expiry date</option>
            <option value="Wrong Variety">Wrong Variety - Received incorrect crop variety</option>
            <option value="Quantity Mismatch">Quantity Mismatch - Less than ordered</option>
            <option value="Storage Issue">Storage Issue - Improper storage conditions</option>
            <option value="Specification Mismatch">Specification Mismatch - Doesn't meet requirements</option>
            <option value="Returns from Customer">Returns from Customer - Farmer returned unsold stock</option>
            <option value="Seasonal Surplus">Seasonal Surplus - Overstocked inventory</option>
          </select>
          @if (formError.reason) {
          <p class="text-red-600 text-sm mt-1">{{ formError.reason }}</p>
          }
        </div>

        <!-- Notes -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
          <textarea
            [(ngModel)]="formData.notes"
            name="notes"
            rows="2"
            placeholder="Any additional information..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          ></textarea>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            (click)="router.navigate(['/returns'])"
            class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="isSubmitting"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-all disabled:opacity-50"
          >
            {{ isSubmitting ? 'Submitting...' : 'Create Purchase Return' }}
          </button>
        </div>
      </form>
      </div>
    </div>
  `,
})
export class PurchaseReturnCreateComponent implements OnInit {
  private returnsService = inject(ReturnsService);
  private poService = inject(PurchaseOrderService);
  private auth = inject(AuthService);
  router = inject(Router);

  purchaseOrders: any[] = [];
  selectedPO: any = null;
  isSubmitting = false;

  formData = {
    poNumber: '',
    reason: '',
    notes: '',
    items: [] as any[],
  };

  formError = {
    poNumber: '',
    items: '',
    reason: '',
  };

  ngOnInit() {
    this.loadPurchaseOrders();
  }

  loadPurchaseOrders() {
    // Load all POs (no status filter) so users can create returns for any PO
    this.poService.getPurchaseOrders(undefined, undefined, 1, 1000).subscribe({
      next: (res) => {
        this.purchaseOrders = res.data || [];
      },
      error: (err) => console.error('Failed to load POs:', err),
    });
  }

  onPOChange() {
    this.selectedPO = this.purchaseOrders.find((po) => po.poNo === this.formData.poNumber);
    if (this.selectedPO) {
      this.selectedPO.items.forEach((item: any) => {
        item.selected = false;
        item.returnQuantity = 1;
      });
    }
    this.formError.poNumber = '';
  }

  submitForm() {
    this.formError = { poNumber: '', items: '', reason: '' };

    if (!this.formData.poNumber) {
      this.formError.poNumber = 'Please select a purchase order';
      return;
    }

    const selectedItems = this.selectedPO.items.filter((item: any) => item.selected);
    if (selectedItems.length === 0) {
      this.formError.items = 'Please select at least one item to return';
      return;
    }

    if (!this.formData.reason.trim()) {
      this.formError.reason = 'Please provide a reason for return';
      return;
    }

    const returnData = {
      poNumber: this.formData.poNumber,
      reason: this.formData.reason,
      notes: this.formData.notes,
      items: selectedItems.map((item: any) => ({
        itemId: item.itemId,
        quantity: item.returnQuantity,
        unitPrice: item.unitPrice,
      })),
    };

    this.isSubmitting = true;
    this.returnsService.createPurchaseReturn(returnData).subscribe({
      next: () => {
        alert('Purchase return created successfully');
        this.router.navigate(['/returns']);
      },
      error: (err) => {
        console.error('Error creating purchase return:', err);
        alert('Failed to create purchase return');
        this.isSubmitting = false;
      },
    });
  }
}
