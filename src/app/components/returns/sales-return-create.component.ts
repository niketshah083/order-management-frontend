import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReturnsService } from '../../services/returns.service';
import { ItemService } from '../../services/item.service';
import { CustomerService } from '../../services/customer.service';
import { BillingService } from '../../services/billing.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sales-return-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 min-h-screen bg-indigo-50 p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Create Sales Return</h1>
          <p class="text-gray-500 mt-1">Accept returned items from customers</p>
        </div>

        <form (ngSubmit)="submitForm()" class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <!-- Customer Selection with Search -->
          <div class="mb-6 relative">
            <label class="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
            <input
              type="text"
              [(ngModel)]="customerSearchQuery"
              name="customerSearch"
              (input)="filterCustomers()"
              (focus)="showCustomerDropdown = true"
              placeholder="Search by name, mobile, or city..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            <!-- Customer Dropdown List -->
            @if (showCustomerDropdown && filteredCustomers.length > 0) {
              <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                @for (customer of filteredCustomers; track customer.id) {
                  <button
                    type="button"
                    (click)="selectCustomer(customer)"
                    class="w-full text-left px-4 py-2 hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition"
                  >
                    <div class="font-medium text-gray-900">{{ customer.firstname }} {{ customer.lastname }}</div>
                    <div class="text-xs text-gray-600">{{ customer.mobileNo }} • {{ customer.city }}</div>
                  </button>
                }
              </div>
            }

            @if (showCustomerDropdown && filteredCustomers.length === 0 && customerSearchQuery) {
              <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-4 text-center text-gray-500">No customers found</div>
            }

            @if (selectedCustomer) {
              <div class="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-800">
                Selected: {{ selectedCustomer.firstname }} {{ selectedCustomer.lastname }}
              </div>
            }

            @if (formError.customerId) {
              <p class="text-red-600 text-sm mt-1">{{ formError.customerId }}</p>
            }
          </div>

          <!-- Customer Details Display -->
          @if (selectedCustomer) {
            <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 class="font-semibold text-gray-900 mb-2">Customer Information</h3>
              <div class="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div><span class="font-medium">Name:</span> {{ selectedCustomer.firstname }} {{ selectedCustomer.lastname }}</div>
                <div><span class="font-medium">Mobile:</span> {{ selectedCustomer.mobileNo }}</div>
                <div><span class="font-medium">Email:</span> {{ selectedCustomer.emailId }}</div>
                <div><span class="font-medium">City:</span> {{ selectedCustomer.city }}</div>
              </div>
            </div>
          }

          <!-- Invoices Created for Customer -->
          @if (selectedCustomer && customerInvoices.length > 0) {
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Invoices Created for Customer</label>
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-4 py-2 text-left text-gray-700 font-semibold">Bill No</th>
                      <th class="px-4 py-2 text-left text-gray-700 font-semibold">Date</th>
                      <th class="px-4 py-2 text-left text-gray-700 font-semibold">Items</th>
                      <th class="px-4 py-2 text-right text-gray-700 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (invoice of customerInvoices; track invoice.id) {
                      <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="px-4 py-2 text-gray-900 font-medium">{{ invoice.billNo }}</td>
                        <td class="px-4 py-2 text-gray-600">{{ invoice.billDate | date: 'short' }}</td>
                        <td class="px-4 py-2 text-gray-600">{{ invoice.billingItems?.length || invoice.items?.length || 0 }} items</td>
                        <td class="px-4 py-2 text-right text-gray-900 font-medium">₹{{ (+invoice.finalAmount).toFixed(2) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @if (selectedCustomer && customerInvoices.length === 0) {
            <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <strong>Note:</strong> No invoices found for this customer. Cannot create return without purchase history.
            </div>
          }

          <!-- Items Section - Only Show Purchased Items -->
          @if (selectedCustomer && customerInvoices.length > 0) {
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Select Items to Accept as Return * <span class="text-xs font-normal text-gray-500">(Showing only items customer purchased)</span></label
              >
              <div class="space-y-3">
                <div class="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search purchased items..."
                    [(ngModel)]="itemSearchQuery"
                    name="itemSearch"
                    (input)="filterItems()"
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  @if (filteredItems.length === 0) {
                    <p class="text-gray-500 text-center py-4">
                      @if (itemSearchQuery) {
                        No items match your search
                      } @else {
                        No items found in customer's invoices
                      }
                    </p>
                  } @else {
                    @for (item of filteredItems; track item.uniqueKey; let i = $index) {
                      <div class="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-100 mb-2">
                        <input type="checkbox" [id]="'item-' + i" [(ngModel)]="item.selected" [name]="'item-' + i" class="h-4 w-4 rounded" />
                        <div class="flex-1">
                          <label [for]="'item-' + i" class="font-medium text-gray-900">
                            {{ item.name || 'Unknown Item' }}
                          </label>
                          <div class="text-sm text-gray-600">
                            Unit: {{ item.unit || '-' }} | Rate: ₹{{ (item.rate || 0).toFixed(2) }} | Purchased: {{ item.totalPurchased }} units
                          </div>
                          <div class="flex flex-wrap gap-1 mt-1">
                            <span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Bill: {{ item.billNo }}</span>
                            @if (item.batchNumber) {
                              <span class="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Batch: {{ item.batchNumber }}</span>
                            }
                            @if (item.serialNumber) {
                              <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Serial: {{ item.serialNumber }}</span>
                            }
                            @if (item.expiryDate) {
                              <span class="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Exp: {{ item.expiryDate }}</span>
                            }
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <label class="text-sm font-medium text-gray-700">Return Qty:</label>
                          <input
                            type="number"
                            [(ngModel)]="item.returnQuantity"
                            [name]="'returnQty-' + i"
                            min="1"
                            [max]="item.totalPurchased"
                            class="w-20 px-2 py-1 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    }
                  }
                </div>
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
              <option value="Quality Issue">Quality Issue - Product defective or not as expected</option>
              <option value="Pest Damaged">Pest Damaged - Product infested</option>
              <option value="Weather Damage">Weather Damage - Moisture/rain affected</option>
              <option value="Expired Stock">Expired Stock - Product past expiry</option>
              <option value="Wrong Variety">Wrong Variety - Incorrect crop/seed variety</option>
              <option value="Quantity Mismatch">Quantity Mismatch - Received less than ordered</option>
              <option value="Storage Issue">Storage Issue - Damaged in storage</option>
              <option value="Specification Mismatch">Specification Mismatch - Doesn't meet requirements</option>
              <option value="Farmer Rejection">Farmer Rejection - Farmer returned unsold stock</option>
              <option value="Market Surplus">Market Surplus - Excess inventory in market</option>
              <option value="Better Alternative">Better Alternative - Found better product elsewhere</option>
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
              placeholder="Any additional information about the return..."
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
              {{ isSubmitting ? 'Submitting...' : 'Create Sales Return' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class SalesReturnCreateComponent implements OnInit {
  private returnsService = inject(ReturnsService);
  private itemService = inject(ItemService);
  private customerService = inject(CustomerService);
  private billingService = inject(BillingService);
  private auth = inject(AuthService);
  router = inject(Router);

  customers: any[] = [];
  filteredCustomers: any[] = [];
  customerInvoices: any[] = [];
  allItems: any[] = [];
  filteredItems: any[] = [];
  selectedCustomer: any = null;
  isSubmitting = false;
  itemSearchQuery = '';
  customerSearchQuery = '';
  showCustomerDropdown = false;

  formData = {
    customerId: '',
    reason: '',
    notes: '',
    items: [] as any[]
  };

  formError = {
    customerId: '',
    items: '',
    reason: ''
  };

  ngOnInit() {
    this.loadCustomers();
    this.loadItems();
  }

  loadCustomers() {
    this.customerService.getCustomers().subscribe({
      next: (res) => {
        this.customers = res.data || [];
        this.filteredCustomers = this.customers;
      },
      error: (err) => console.error('Failed to load customers:', err)
    });
  }

  filterCustomers() {
    const query = this.customerSearchQuery.toLowerCase();
    if (!query) {
      this.filteredCustomers = this.customers;
      return;
    }

    this.filteredCustomers = this.customers.filter(
      (customer) =>
        customer.firstname.toLowerCase().includes(query) ||
        customer.lastname.toLowerCase().includes(query) ||
        customer.mobileNo.includes(query) ||
        customer.city.toLowerCase().includes(query)
    );
  }

  selectCustomer(customer: any) {
    this.selectedCustomer = customer;
    this.formData.customerId = customer.id.toString();
    this.customerSearchQuery = `${customer.firstname} ${customer.lastname}`;
    this.showCustomerDropdown = false;
    this.formError.customerId = '';
    this.loadCustomerInvoices(customer.id);
  }

  loadCustomerInvoices(customerId: number) {
    this.billingService.getBillings().subscribe({
      next: (res) => {
        const allBillings = res.data || [];
        this.customerInvoices = allBillings.filter((b: any) => b.customerId === customerId || b.customerId === customerId.toString());
        this.loadPurchasedItems();
      },
      error: (err) => console.error('Failed to load invoices:', err)
    });
  }

  loadItems() {
    this.itemService.getItems().subscribe({
      next: (res) => {
        this.allItems = (res.data || []).map((item: any) => ({
          ...item,
          selected: false,
          returnQuantity: 1,
          totalPurchased: 0
        }));
        this.filteredItems = this.allItems;
      },
      error: (err) => console.error('Failed to load items:', err)
    });
  }

  loadPurchasedItems() {
    // Extract items from customer's invoices
    // Check both 'items' and 'billingItems' as backend returns 'billingItems'
    const purchasedItemsList: any[] = [];

    this.customerInvoices.forEach((invoice: any) => {
      const invoiceItems = invoice.billingItems || invoice.items || [];
      if (Array.isArray(invoiceItems)) {
        invoiceItems.forEach((billingItem: any) => {
          const itemId = billingItem.itemId;
          // Create unique key for batch/serial tracking per bill
          const uniqueKey = `${invoice.billNo}-${itemId}-${billingItem.batchNumber || ''}-${billingItem.serialNumber || ''}`;

          // Each line item from each bill is a separate returnable entry
          purchasedItemsList.push({
            id: itemId,
            uniqueKey: uniqueKey,
            name: billingItem.itemName || billingItem.item?.name || 'Unknown Item',
            unit: billingItem.unit || billingItem.item?.unit || '-',
            rate: billingItem.rate || 0,
            totalPurchased: billingItem.quantity || 0,
            selected: false,
            returnQuantity: 1,
            batchNumber: billingItem.batchNumber || null,
            serialNumber: billingItem.serialNumber || null,
            expiryDate: billingItem.expiryDate || null,
            billNo: invoice.billNo,
            billId: invoice.id,
            billDate: invoice.billDate
          });
        });
      }
    });

    // Set as filtered items
    this.allItems = purchasedItemsList;
    this.filteredItems = this.allItems;
  }

  filterItems() {
    const query = this.itemSearchQuery.toLowerCase();
    if (!query) {
      this.filteredItems = this.allItems;
      return;
    }
    this.filteredItems = this.allItems.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.unit && item.unit.toLowerCase().includes(query)) ||
        (item.batchNumber && item.batchNumber.toLowerCase().includes(query)) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(query)) ||
        (item.billNo && item.billNo.toLowerCase().includes(query))
    );
  }

  submitForm() {
    this.formError = { customerId: '', items: '', reason: '' };

    if (!this.formData.customerId) {
      this.formError.customerId = 'Please select a customer';
      return;
    }

    if (this.customerInvoices.length === 0) {
      this.formError.customerId = 'Cannot create return: customer has no invoices';
      return;
    }

    const selectedItems = this.allItems.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      this.formError.items = 'Please select at least one item to return';
      return;
    }

    if (!this.formData.reason.trim()) {
      this.formError.reason = 'Please provide a reason for return';
      return;
    }

    const returnData = {
      customerId: +this.formData.customerId,
      reason: this.formData.reason,
      notes: this.formData.notes,
      items: selectedItems.map((item) => ({
        itemId: item.id,
        quantity: item.returnQuantity,
        rate: item.rate,
        batchNumber: item.batchNumber || undefined,
        serialNumber: item.serialNumber || undefined,
        expiryDate: item.expiryDate || undefined,
        billNo: item.billNo || undefined,
        billId: item.billId || undefined
      }))
    };

    this.isSubmitting = true;
    this.returnsService.createSalesReturn(returnData).subscribe({
      next: () => {
        alert('Sales return created successfully');
        this.router.navigate(['/returns']);
      },
      error: (err) => {
        console.error('Error creating sales return:', err);
        alert('Failed to create sales return');
        this.isSubmitting = false;
      }
    });
  }
}
