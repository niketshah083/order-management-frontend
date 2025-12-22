import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BillingService, BillingItem } from '../../services/billing.service';
import { CustomerService, Customer } from '../../services/customer.service';
import { InventoryService } from '../../services/inventory.service';
import { ItemService, ApiItem } from '../../services/item.service';
import { environment } from '../../../environments/environment';

interface BatchOption {
  id: number;
  batchNumber?: string;
  serialNumber?: string;
  quantity: number;
  expiryDate?: string;
}

interface QuickItem {
  id: number;
  itemId: number;
  itemName: string;
  unit: string;
  rate: number;
  gstRate: number;
  stockQuantity: number;
  imageUrl?: string;
  hasBatchTracking: boolean;
  hasSerialTracking: boolean;
  batches: BatchOption[];
  selectedBatchId?: number;
  selectedBatch?: BatchOption;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  quantity: number;
  selected: boolean;
  discount: number;
  discountType: 'percentage' | 'amount';
}

@Component({
  selector: 'app-quick-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-invoice.component.html',
  styleUrls: ['./quick-invoice.component.scss']
})
export class QuickInvoiceComponent implements OnInit {
  private billingService = inject(BillingService);
  private customerService = inject(CustomerService);
  private inventoryService = inject(InventoryService);
  private itemService = inject(ItemService);
  private router = inject(Router);

  apiUrl = environment.APIUrl;

  // Data
  items = signal<QuickItem[]>([]);
  customers = signal<Customer[]>([]);
  allItems = signal<ApiItem[]>([]);

  // UI State
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  searchQuery = signal('');
  customerSearchQuery = signal('');
  showCustomerDropdown = signal(false);

  // Batch selector modal
  showBatchModal = signal(false);
  selectedItemForBatch = signal<QuickItem | null>(null);

  // Selected customer
  selectedCustomer = signal<Customer | null>(null);

  // Payment type
  paymentType = signal<'cash' | 'credit'>('cash');

  // Overall discount
  overallDiscount = signal(0);
  overallDiscountType = signal<'percentage' | 'amount'>('percentage');

  // Filtered items based on search
  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allItems = this.items();
    if (!query) return allItems;
    return allItems.filter(
      (item) =>
        item.itemName.toLowerCase().includes(query) ||
        (item.batchNumber && item.batchNumber.toLowerCase().includes(query)) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(query))
    );
  });

  // Filtered customers
  filteredCustomers = computed(() => {
    const query = this.customerSearchQuery().toLowerCase();
    if (!query) return this.customers().slice(0, 10);
    return this.customers()
      .filter((c) => c.firstname.toLowerCase().includes(query) || c.lastname?.toLowerCase().includes(query) || c.mobileNo.includes(query))
      .slice(0, 10);
  });

  // Selected items (quantity > 0)
  selectedItems = computed(() => {
    return this.items().filter((item) => item.quantity > 0);
  });

  // Calculate item total after discount
  getItemTotal(item: QuickItem): number {
    const gross = item.quantity * item.rate;
    if (item.discount <= 0) return gross;
    if (item.discountType === 'percentage') {
      return gross - (gross * item.discount) / 100;
    }
    return gross - item.discount;
  }

  // Calculate item discount amount
  getItemDiscountAmount(item: QuickItem): number {
    const gross = item.quantity * item.rate;
    if (item.discount <= 0) return 0;
    if (item.discountType === 'percentage') {
      return (gross * item.discount) / 100;
    }
    return item.discount;
  }

  // Calculate totals
  subtotal = computed(() => {
    return this.selectedItems().reduce((sum, item) => {
      return sum + this.getItemTotal(item);
    }, 0);
  });

  // Total item-level discounts
  totalItemDiscount = computed(() => {
    return this.selectedItems().reduce((sum, item) => {
      return sum + this.getItemDiscountAmount(item);
    }, 0);
  });

  // Overall discount amount
  overallDiscountAmount = computed(() => {
    const sub = this.subtotal();
    const discount = this.overallDiscount();
    if (discount <= 0) return 0;
    if (this.overallDiscountType() === 'percentage') {
      return (sub * discount) / 100;
    }
    return discount;
  });

  // Subtotal after overall discount
  subtotalAfterDiscount = computed(() => {
    return this.subtotal() - this.overallDiscountAmount();
  });

  totalGst = computed(() => {
    return this.selectedItems().reduce((sum, item) => {
      const taxable = this.getItemTotal(item);
      return sum + (taxable * (item.gstRate || 0)) / 100;
    }, 0);
  });

  // GST after overall discount (proportional reduction)
  totalGstAfterDiscount = computed(() => {
    const sub = this.subtotal();
    if (sub === 0) return 0;
    const ratio = this.subtotalAfterDiscount() / sub;
    return this.totalGst() * ratio;
  });

  grandTotal = computed(() => {
    return Math.round(this.subtotalAfterDiscount() + this.totalGstAfterDiscount());
  });

  totalItems = computed(() => {
    return this.selectedItems().length;
  });

  ngOnInit() {
    this.loadCustomers();
    // Load items first, then inventory (to ensure we have item images)
    this.loadItemsThenInventory();
  }

  loadItemsThenInventory() {
    this.isLoading.set(true);
    this.itemService.getItems().subscribe({
      next: (response) => {
        this.allItems.set(response.data || []);
        // Now load inventory after items are loaded
        this.loadInventory();
      },
      error: (err) => {
        console.error('Failed to load items:', err);
        // Still try to load inventory even if items fail
        this.loadInventory();
      }
    });
  }

  loadInventory() {
    this.inventoryService.getAvailableForBilling().subscribe({
      next: (response) => {
        const inventoryItems = response.data || [];
        const allItemsData = this.allItems();

        // Group by itemId to consolidate batches
        const itemMap = new Map<number, QuickItem>();

        inventoryItems
          .filter((inv) => inv.quantity > 0)
          .forEach((inv) => {
            const itemId = Number(inv.itemId);
            const item = inv.item as any;

            // Find item details from allItems for image
            const itemDetails = allItemsData.find((i) => i.id === itemId);
            let imageUrl: string | undefined;

            // Check assetsUrls first (signed URLs from API)
            if (itemDetails?.assetsUrls && itemDetails.assetsUrls.length > 0) {
              imageUrl = itemDetails.assetsUrls[0];
            }
            // Fallback to assets array (raw paths)
            if (!imageUrl && itemDetails?.assets && itemDetails.assets.length > 0) {
              const firstAsset = itemDetails.assets[0];
              imageUrl = typeof firstAsset === 'string' ? firstAsset : firstAsset?.url;
            }
            // Fallback to item from inventory response
            if (!imageUrl && item?.assetsUrls && item.assetsUrls.length > 0) {
              imageUrl = item.assetsUrls[0];
            }
            if (!imageUrl && item?.assets && item.assets.length > 0) {
              const firstAsset = item.assets[0];
              imageUrl = typeof firstAsset === 'string' ? firstAsset : firstAsset?.url;
            }

            const batchOption: BatchOption = {
              id: Number(inv.id),
              batchNumber: inv.batchNumber,
              serialNumber: inv.serialNumber,
              quantity: inv.quantity,
              expiryDate: inv.expiryDate
            };

            if (itemMap.has(itemId)) {
              // Add batch to existing item
              const existingItem = itemMap.get(itemId)!;
              existingItem.batches.push(batchOption);
              existingItem.stockQuantity += inv.quantity;
            } else {
              // Create new item entry
              itemMap.set(itemId, {
                id: Number(inv.id),
                itemId: itemId,
                itemName: item?.name || itemDetails?.name || 'Unknown Item',
                unit: item?.unit || itemDetails?.unit || 'pcs',
                rate: item?.rate || itemDetails?.rate || 0,
                gstRate: item?.gstRate || itemDetails?.gstRate || 0,
                stockQuantity: inv.quantity,
                imageUrl: imageUrl,
                hasBatchTracking: item?.hasBatchTracking || itemDetails?.hasBatchTracking || !!inv.batchNumber,
                hasSerialTracking: item?.hasSerialTracking || itemDetails?.hasSerialTracking || !!inv.serialNumber,
                batches: [batchOption],
                quantity: 0,
                selected: false,
                discount: 0,
                discountType: 'percentage'
              });
            }
          });

        this.items.set(Array.from(itemMap.values()));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load inventory:', err);
        this.errorMessage.set('Failed to load inventory');
        this.isLoading.set(false);
      }
    });
  }

  loadCustomers() {
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        this.customers.set(response.data || []);
      },
      error: (err) => console.error('Failed to load customers:', err)
    });
  }

  getImageUrl(item: QuickItem): string {
    if (item.imageUrl) {
      if (item.imageUrl.startsWith('http')) {
        return item.imageUrl;
      }
      return `${this.apiUrl}/${item.imageUrl}`;
    }
    return '';
  }

  // Open batch/serial selector modal
  openBatchSelector(item: QuickItem) {
    this.selectedItemForBatch.set(item);
    this.showBatchModal.set(true);
  }

  closeBatchModal() {
    this.showBatchModal.set(false);
    this.selectedItemForBatch.set(null);
  }

  selectBatch(item: QuickItem, batch: BatchOption) {
    item.selectedBatchId = batch.id;
    item.selectedBatch = batch;
    item.batchNumber = batch.batchNumber;
    item.serialNumber = batch.serialNumber;
    item.expiryDate = batch.expiryDate;
    item.stockQuantity = batch.quantity;

    // For serial tracked items, auto-set quantity to 1
    if (item.hasSerialTracking && batch.serialNumber) {
      item.quantity = 1;
    }

    this.items.update((items) => [...items]);
    this.closeBatchModal();
  }

  onQuantityChange(item: QuickItem, value: number) {
    // If trying to set quantity > 0 and batch selection is required
    if (value > 0 && (item.hasBatchTracking || item.hasSerialTracking) && !item.selectedBatch) {
      // If multiple batches, open selector
      if (item.batches.length > 1) {
        item.quantity = 0; // Reset quantity until batch is selected
        this.items.update((items) => [...items]);
        this.openBatchSelector(item);
        return;
      }
      // Auto-select first batch if only one available
      if (item.batches.length === 1) {
        this.selectBatch(item, item.batches[0]);
      }
    }

    // For serial tracked items, quantity must be 1
    if (item.hasSerialTracking && item.serialNumber) {
      item.quantity = value > 0 ? 1 : 0;
    } else {
      const maxQty = item.selectedBatch ? item.selectedBatch.quantity : item.stockQuantity;
      item.quantity = Math.min(Math.max(0, value), maxQty);
    }
    this.items.update((items) => [...items]);
  }

  incrementQty(item: QuickItem) {
    // Check if batch selection is required
    if ((item.hasBatchTracking || item.hasSerialTracking) && !item.selectedBatch && item.batches.length > 1) {
      this.openBatchSelector(item);
      return;
    }

    // Auto-select first batch if only one available
    if ((item.hasBatchTracking || item.hasSerialTracking) && !item.selectedBatch && item.batches.length === 1) {
      this.selectBatch(item, item.batches[0]);
    }

    const maxQty = item.selectedBatch ? item.selectedBatch.quantity : item.stockQuantity;

    // For serial tracked items, quantity is always 1
    if (item.hasSerialTracking && item.serialNumber) {
      item.quantity = 1;
    } else if (item.quantity < maxQty) {
      item.quantity++;
    }
    this.items.update((items) => [...items]);
  }

  decrementQty(item: QuickItem) {
    if (item.quantity > 0) {
      item.quantity--;
      this.items.update((items) => [...items]);
    }
  }

  quickAdd(item: QuickItem, qty: number) {
    // Check if batch selection is required
    if ((item.hasBatchTracking || item.hasSerialTracking) && !item.selectedBatch && item.batches.length > 1) {
      this.openBatchSelector(item);
      return;
    }

    // Auto-select first batch if only one available
    if ((item.hasBatchTracking || item.hasSerialTracking) && !item.selectedBatch && item.batches.length === 1) {
      this.selectBatch(item, item.batches[0]);
    }

    const maxQty = item.selectedBatch ? item.selectedBatch.quantity : item.stockQuantity;

    // For serial tracked items, quantity is always 1
    if (item.hasSerialTracking && item.serialNumber) {
      item.quantity = 1;
    } else {
      item.quantity = Math.min(item.quantity + qty, maxQty);
    }
    this.items.update((items) => [...items]);
  }

  clearItem(item: QuickItem) {
    item.quantity = 0;
    item.discount = 0;
    item.discountType = 'percentage';
    item.selectedBatch = undefined;
    item.selectedBatchId = undefined;
    item.batchNumber = undefined;
    item.serialNumber = undefined;
    item.expiryDate = undefined;
    this.items.update((items) => [...items]);
  }

  clearAll() {
    this.items.update((items) =>
      items.map((item) => ({
        ...item,
        quantity: 0,
        discount: 0,
        discountType: 'percentage' as const,
        selectedBatch: undefined,
        selectedBatchId: undefined,
        batchNumber: undefined,
        serialNumber: undefined,
        expiryDate: undefined
      }))
    );
    this.overallDiscount.set(0);
    this.overallDiscountType.set('percentage');
  }

  // Item discount handlers
  onItemDiscountChange(item: QuickItem, value: number) {
    item.discount = Math.max(0, value);
    if (item.discountType === 'percentage') {
      item.discount = Math.min(100, item.discount);
    }
    this.items.update((items) => [...items]);
  }

  toggleItemDiscountType(item: QuickItem) {
    item.discountType = item.discountType === 'percentage' ? 'amount' : 'percentage';
    item.discount = 0;
    this.items.update((items) => [...items]);
  }

  // Overall discount handlers
  onOverallDiscountChange(value: number) {
    let discount = Math.max(0, value);
    if (this.overallDiscountType() === 'percentage') {
      discount = Math.min(100, discount);
    }
    this.overallDiscount.set(discount);
  }

  toggleOverallDiscountType() {
    this.overallDiscountType.update((t) => (t === 'percentage' ? 'amount' : 'percentage'));
    this.overallDiscount.set(0);
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer.set(customer);
    this.showCustomerDropdown.set(false);
    this.customerSearchQuery.set('');
  }

  clearCustomer() {
    this.selectedCustomer.set(null);
  }

  setPaymentType(type: 'cash' | 'credit') {
    this.paymentType.set(type);
  }

  canCreateInvoice(): boolean {
    return this.selectedCustomer() !== null && this.selectedItems().length > 0;
  }

  createInvoice(status: 'draft' | 'completed' = 'draft') {
    if (!this.canCreateInvoice()) {
      this.errorMessage.set('Please select a customer and add items');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    // Validate batch/serial selection for tracked items
    const invalidItems = this.selectedItems().filter((item) => (item.hasBatchTracking || item.hasSerialTracking) && !item.selectedBatch);

    if (invalidItems.length > 0) {
      this.errorMessage.set(`Please select batch/serial for: ${invalidItems.map((i) => i.itemName).join(', ')}`);
      setTimeout(() => this.errorMessage.set(''), 5000);
      return;
    }

    this.isLoading.set(true);
    const customer = this.selectedCustomer()!;
    const items = this.selectedItems();

    // Build billing items with discounts
    const billingItems: BillingItem[] = items.map((item) => {
      const grossAmount = item.quantity * item.rate;
      const itemDiscountAmount = this.getItemDiscountAmount(item);
      const taxableAmount = grossAmount - itemDiscountAmount;
      const gstAmount = (taxableAmount * (item.gstRate || 0)) / 100;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;

      return {
        itemId: String(item.itemId),
        itemName: item.itemName,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        discount: item.discount,
        discountType: item.discountType,
        taxableAmount: taxableAmount,
        cgst: cgst,
        sgst: sgst,
        igst: 0,
        cgstRate: (item.gstRate || 0) / 2,
        sgstRate: (item.gstRate || 0) / 2,
        igstRate: 0,
        totalAmount: taxableAmount + gstAmount,
        batchNumber: item.batchNumber,
        serialNumber: item.serialNumber,
        expiryDate: item.expiryDate
      };
    });

    const billing = {
      billDate: new Date().toISOString().split('T')[0],
      customerId: customer.id,
      items: billingItems,
      subtotal: this.subtotal(),
      overallDiscount: this.overallDiscount(),
      overallDiscountType: this.overallDiscountType(),
      totalAfterDiscount: this.subtotalAfterDiscount(),
      cgstTotal: this.totalGstAfterDiscount() / 2,
      sgstTotal: this.totalGstAfterDiscount() / 2,
      igstTotal: 0,
      grandTotal: this.subtotalAfterDiscount() + this.totalGstAfterDiscount(),
      roundOff: this.grandTotal() - (this.subtotalAfterDiscount() + this.totalGstAfterDiscount()),
      finalAmount: this.grandTotal(),
      paymentType: this.paymentType(),
      status: status
    };

    this.billingService.createBilling(billing).subscribe({
      next: () => {
        const statusText = status === 'completed' ? 'completed' : 'saved as draft';
        this.successMessage.set(`Invoice ${statusText} successfully!`);
        this.isLoading.set(false);
        this.clearAll();
        this.selectedCustomer.set(null);

        setTimeout(() => {
          this.loadInventory();
          this.successMessage.set('');
        }, 2000);
      },
      error: (err) => {
        console.error('Failed to create invoice:', err);
        this.errorMessage.set(err.error?.message || 'Failed to create invoice');
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  saveDraft() {
    this.createInvoice('draft');
  }

  completeInvoice() {
    this.createInvoice('completed');
  }

  goToBillingHistory() {
    this.router.navigate(['/billing-history']);
  }

  getExpiryClass(expiryDate?: string): string {
    if (!expiryDate) return '';
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysToExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysToExpiry < 0) return 'text-red-600 bg-red-50';
    if (daysToExpiry <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  }

  formatExpiry(expiryDate?: string): string {
    if (!expiryDate) return '-';
    return new Date(expiryDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  }
}
