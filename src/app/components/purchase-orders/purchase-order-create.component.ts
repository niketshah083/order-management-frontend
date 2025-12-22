import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ItemService, ApiItem } from '../../services/item.service';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-purchase-order-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="min-h-screen bg-indigo-50">
      <!-- PROFESSIONAL HEADER SECTION -->
      <div class="bg-white border-b-4 border-indigo-600 shadow-md sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">📦 {{ isEditMode ? 'Edit' : 'Create' }} Purchase Order</h1>
              <p class="text-sm text-gray-600 mt-1">{{ isEditMode ? 'Update items in this purchase order' : 'Select items to build a new purchase order' }}</p>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-600">Total Items</div>
              <div class="text-4xl font-bold text-indigo-600">{{ selectedItems.length }}</div>
              <div class="text-xs text-gray-500 mt-1">₹{{ totalAmount.toFixed(0) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <!-- ADMIN DISTRIBUTOR SELECTOR -->
        @if (auth.isAdmin()) {
          <div class="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl shadow-sm p-4 mb-6">
            <label class="block text-sm font-bold text-blue-900 mb-2">👥 Create for Distributor (Admin Only)</label>
            <select
              [(ngModel)]="selectedDistributorId"
              class="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-sm"
            >
              <option [value]="null">My Own Purchase Order</option>
              @for (dist of distributors; track dist.id) {
                <option [value]="dist.id">{{ dist.businessName || dist.firstname + ' ' + dist.lastname }}</option>
              }
            </select>
          </div>
        }

        <!-- TWO-COLUMN GRID -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- ITEMS SELECTION (LEFT) -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-900">🔍 Available Items</h2>
                <span class="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">{{ filteredItems.length }} items</span>
              </div>

              <!-- SEARCH BOX -->
              <div class="mb-6">
                <input
                  type="text"
                  placeholder="Search by item name or SKU..."
                  (input)="searchItems($event)"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                />
              </div>

              <!-- ITEMS LIST -->
              <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                @for (item of filteredItems; track item.id) {
                  <div class="border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 cursor-pointer group">
                    <div class="flex items-center justify-between gap-4">
                      <div class="flex-1">
                        <p class="font-bold text-gray-900 text-sm">{{ item.name }}</p>
                        <div class="text-xs text-gray-600 mt-2 space-x-3 flex">
                          <span class="bg-gray-100 px-2 py-1 rounded">₹{{ item.rate }}/{{ item.unit }}</span>
                          <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">Qty: {{ item.qty }}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="500"
                          step="0.01"
                          placeholder="Qty"
                          [value]="quantities[item.id] || ''"
                          (input)="updateQuantity(item.id, $event)"
                          class="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg text-center font-semibold text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          (click)="addItem(item)"
                          class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-bold text-sm shadow-md transition-all"
                        >
                          ➕ Add
                        </button>
                      </div>
                    </div>
                  </div>
                }
                @if (filteredItems.length === 0) {
                  <div class="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <p class="text-gray-500 font-semibold">🔍 No items found</p>
                    <p class="text-xs text-gray-400 mt-1">Try different search keywords</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- ORDER SUMMARY (RIGHT) -->
          <div class="bg-white rounded-2xl shadow-md border border-gray-200 p-6 h-fit sticky top-24 lg:top-20">
            <h2 class="text-xl font-bold text-gray-900 mb-2">📋 Order Summary</h2>
            <p class="text-xs text-gray-500 mb-6">Items to be ordered</p>

            <!-- ITEMS IN SUMMARY - EDITABLE GRID -->
            <div class="mb-6 max-h-[350px] overflow-y-auto">
              @if (selectedItems.length === 0) {
                <div class="text-center py-8 bg-indigo-50 rounded-lg border-2 border-dashed border-indigo-200">
                  <p class="text-gray-600 text-sm font-semibold">📦 No items added</p>
                  <p class="text-xs text-gray-500 mt-1">Select items from left to begin</p>
                </div>
              } @else {
                <table class="w-full text-xs">
                  <thead class="bg-indigo-100 sticky top-0">
                    <tr>
                      <th class="px-2 py-2 text-left font-bold text-gray-700">Item</th>
                      <th class="px-2 py-2 text-center font-bold text-gray-700">Qty</th>
                      <th class="px-2 py-2 text-right font-bold text-gray-700">Rate</th>
                      <th class="px-2 py-2 text-right font-bold text-gray-700">Total</th>
                      <th class="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    @for (item of selectedItems; track item.itemId; let i = $index) {
                      <tr class="hover:bg-indigo-50">
                        <td class="px-2 py-2 font-semibold text-gray-900 max-w-[100px] truncate" [title]="getItemName(item.itemId)">{{ getItemName(item.itemId) }}</td>
                        <td class="px-2 py-2 text-center">
                          <input
                            type="number"
                            min="0.01"
                            max="500"
                            step="0.01"
                            [value]="item.quantity"
                            (input)="updateSelectedItemQty(i, $event)"
                            class="w-16 px-1 py-1 border border-blue-300 rounded text-center font-semibold text-xs focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-2 py-2 text-right text-gray-600">₹{{ getItemPrice(item.itemId) }}</td>
                        <td class="px-2 py-2 text-right font-bold text-indigo-600">₹{{ (getItemPrice(item.itemId) * item.quantity).toFixed(0) }}</td>
                        <td class="px-2 py-2 text-center">
                          <button (click)="removeItem(item.itemId)" class="text-red-500 hover:text-red-700 font-bold">✕</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>

            <!-- TOTAL AMOUNT -->
            <div class="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-4 mb-6">
              <div class="flex justify-between items-center">
                <span class="text-gray-700 font-bold">Total Amount:</span>
                <span class="text-3xl font-bold text-indigo-600">₹{{ totalAmount.toFixed(0) }}</span>
              </div>
            </div>

            <!-- ACTIONS -->
            <div class="space-y-3">
              <button
                (click)="savePurchaseOrder()"
                [disabled]="selectedItems.length === 0 || isSubmitting"
                class="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-bold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isSubmitting ? (isEditMode ? '⏳ Updating...' : '⏳ Creating...') : isEditMode ? '💾 Update PO' : '✅ Create PO' }}
              </button>
              <button
                (click)="router.navigate(['/purchase-orders'])"
                class="w-full border-2 border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-bold text-sm transition-all"
              >
                📋 View Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PurchaseOrderCreateComponent implements OnInit {
  itemService = inject(ItemService);
  poService = inject(PurchaseOrderService);
  userService = inject(UserService);
  auth = inject(AuthService);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  items: ApiItem[] = [];
  filteredItems: ApiItem[] = [];
  selectedItems: Array<{ itemId: number; quantity: number }> = [];
  quantities: Record<number, number> = {};
  isSubmitting = false;
  searchQuery = '';
  distributors: any[] = [];
  selectedDistributorId: number | null = null;
  isEditMode = false;
  editPoId: number | null = null;
  itemCache: Record<number, { name: string; price: number }> = {};

  ngOnInit() {
    this.loadItems();
    if (this.auth.isAdmin()) {
      this.loadDistributors();
    }

    // Check if we're in edit mode - wait for items to load first
    this.activatedRoute.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.editPoId = parseInt(params['id']);

        // Wait a bit for items to load, then load PO data
        setTimeout(() => {
          if (this.editPoId) {
            this.loadPurchaseOrderData(this.editPoId);
          }
        }, 500);
      }
    });
  }

  loadItems() {
    this.itemService.getItems(undefined, undefined, undefined, 1, 100).subscribe({
      next: (res) => {
        this.items = res.data.filter((i) => !i.isDisabled);
        this.filteredItems = this.items;
      },
      error: (err) => console.error('Error loading items:', err)
    });
  }

  loadDistributors() {
    this.userService.getDistributors().subscribe({
      next: (data) => {
        this.distributors = data.data || [];
      },
      error: (err) => console.error('Error loading distributors:', err)
    });
  }

  loadPurchaseOrderData(poId: number | null) {
    if (!poId) return;

    this.poService.getPurchaseOrderById(poId).subscribe({
      next: (res) => {
        const po = res.data;
        console.log('PO Data:', po);
        console.log('PO Items:', po.items);

        // Cache item details from the PO response
        this.selectedItems = po.items.map((item: any) => {
          const itemId = item.itemId || item.item?.id || item.id;
          const quantity = item.quantity;

          // Cache the item name and price from the PO response
          const itemName = item.itemName || item.item?.name || 'Unknown Item';
          const itemPrice = item.itemRate || item.item?.rate || item.rate || 0;

          if (itemId) {
            this.itemCache[itemId] = {
              name: itemName,
              price: itemPrice
            };
          }

          console.log(`Mapping item - itemId: ${itemId}, quantity: ${quantity}, name: ${itemName}, price: ${itemPrice}`);

          return {
            itemId,
            quantity
          };
        });

        console.log('Item Cache:', this.itemCache);
        console.log('Selected Items:', this.selectedItems);
      },
      error: (err) => {
        console.error('Error loading purchase order:', err);
        alert('Failed to load purchase order');
        this.router.navigate(['/purchase-orders']);
      }
    });
  }

  searchItems(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery = value;
    this.filteredItems = this.items.filter((item) => item.name.toLowerCase().includes(value));
  }

  updateQuantity(itemId: number, event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    // Limit to max 500
    this.quantities[itemId] = Math.min(500, Math.max(0, value));
  }

  updateSelectedItemQty(index: number, event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    // Limit to max 500
    if (this.selectedItems[index]) {
      this.selectedItems[index].quantity = Math.min(500, Math.max(0.01, value));
    }
  }

  addItem(item: ApiItem) {
    const qty = this.quantities[item.id];
    if (!qty || qty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    const existing = this.selectedItems.find((i) => i.itemId === item.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      this.selectedItems.push({ itemId: item.id, quantity: qty });
    }

    this.quantities[item.id] = 0;
  }

  removeItem(itemId: number) {
    this.selectedItems = this.selectedItems.filter((i) => i.itemId !== itemId);
  }

  getItemName(itemId: number): string {
    // First check the cache (for items loaded from edit)
    if (this.itemCache[itemId]) {
      return this.itemCache[itemId].name;
    }
    // Then check the available items
    return this.items.find((i) => i.id === itemId)?.name || '';
  }

  getItemPrice(itemId: number): number {
    // First check the cache (for items loaded from edit)
    if (this.itemCache[itemId]) {
      return this.itemCache[itemId].price;
    }
    // Then check the available items
    return this.items.find((i) => i.id === itemId)?.rate || 0;
  }

  get totalAmount(): number {
    return this.selectedItems.reduce((sum, item) => {
      return sum + this.getItemPrice(item.itemId) * item.quantity;
    }, 0);
  }

  savePurchaseOrder() {
    if (this.selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    this.isSubmitting = true;

    if (this.isEditMode && this.editPoId) {
      // Update existing PO
      this.poService.updatePurchaseOrder(this.editPoId, this.selectedItems).subscribe({
        next: () => {
          alert('Purchase Order updated successfully!');
          this.router.navigate(['/purchase-orders']);
        },
        error: (err) => {
          console.error('Error updating purchase order:', err);
          alert('Failed to update purchase order');
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new PO
      const payload: any = { items: this.selectedItems };

      // If admin created PO for a distributor, include distributorId
      if (this.auth.isAdmin() && this.selectedDistributorId) {
        payload.distributorId = this.selectedDistributorId;
      }

      this.poService.createPurchaseOrder(payload).subscribe({
        next: () => {
          alert('Purchase Order created successfully!');
          this.router.navigate(['/purchase-orders']);
        },
        error: (err) => {
          console.error('Error creating purchase order:', err);
          alert('Failed to create purchase order');
          this.isSubmitting = false;
        }
      });
    }
  }
}
