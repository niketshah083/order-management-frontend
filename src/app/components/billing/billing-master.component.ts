import { Component, inject, signal, computed, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { BillingService, Billing, BillingItem } from '../../services/billing.service';
import { CustomerService, Customer } from '../../services/customer.service';
import { ItemService, ApiItem } from '../../services/item.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { InventoryService } from '../../services/inventory.service';
import { ModalComponent } from '../shared/ui/modal.component';
import { BatchSerialInputComponent, BatchSerialEntry } from './batch-serial-input.component';
import { AddCustomerFormComponent } from '../shared/add-customer-form.component';
import { BatchSelectorComponent } from './batch-selector.component';
import { BarcodeScannerComponent } from '../shared/barcode-scanner/barcode-scanner.component';

@Component({
  selector: 'app-billing-master',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent, BatchSerialInputComponent, AddCustomerFormComponent, BatchSelectorComponent, BarcodeScannerComponent],
  templateUrl: './billing-master.component.html',
  styleUrls: ['./billing-master.component.scss']
})
export class BillingMasterComponent implements OnInit {
  @ViewChild(BatchSerialInputComponent)
  batchSerialModal!: BatchSerialInputComponent;
  @ViewChild('batchSelector') batchSelector: any;
  private billingService = inject(BillingService);
  private customerService = inject(CustomerService);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  inventoryService = inject(InventoryService);

  billings = signal<Billing[]>([]);
  customers = signal<Customer[]>([]);
  items = signal<ApiItem[]>([]);
  itemStockStatus = signal<Map<number, { stockQuantity: number; inStock: boolean }>>(new Map());
  distributors = signal<any[]>([]);
  editBillingId = signal<number | null>(null);
  isEditMode = computed(() => this.editBillingId() !== null);

  // Crop and Disease data
  cropNames = signal<string[]>(['Wheat', 'Rice', 'Corn', 'Sugarcane', 'Paddy', 'Maize', 'Soybean', 'Pulses', 'Cotton', 'Tobacco', 'Barley', 'Millet', 'Jowar', 'Bajra']);

  cornDiseases = signal<string[]>([
    'Corn Leaf Blight (Northern)',
    'Corn Leaf Blight (Southern)',
    'Corn Smut',
    'Fusarium Wilt',
    "Stewart's Wilt",
    'Anthracnose',
    'Gray Leaf Spot',
    'Eyespot',
    'Common Rust',
    'Polyspora Rust',
    'Goss Wilt',
    'Bacterial Leaf Streak'
  ]);

  selectedDistributor = signal<any | null>(null);
  isAdmin = signal(false);

  selectedCustomer = signal<Customer | null>(null);
  billingItems = signal<BillingItem[]>([]);
  availableBatches = signal<any[]>([]);
  availableSerials = signal<any[]>([]);
  availableInventory = signal<any[]>([]);
  selectedItemForBatch = signal<ApiItem | null>(null);
  batchOptionsForSelector = computed(() => this.mapInventoryToBatches());

  // Latest bill constraints
  latestBillDate = signal<string | null>(null);
  latestInvoiceNumber = signal<number | null>(null);

  showCustomerModal = signal(false);
  showItemModal = signal(false);
  showCustomerSearch = signal(false);
  showBatchPicker = signal(false);
  selectedQtyForBatch = signal(1);
  selectedQtyForBatchInput = 1;
  selectedBatchForPicker = signal<any | null>(null);

  // Batch/Serial bulk input state
  pendingBillingItemData: any = null;

  searchQuery = signal('');
  customerSearchQuery = signal('');
  itemSearchQuery = signal('');
  batchSearchQuery = signal('');
  batchSearchInput = ''; // Regular property for ngModel binding
  itemSearchTab = signal<'by-name' | 'by-batch'>('by-name');
  itemsFoundByBatch = signal<any[]>([]);
  selectedBatchResult = signal<any | null>(null);

  // Unified search
  unifiedSearchQuery = '';
  isSearching = signal(false);
  private searchDebounceTimer: any;

  paymentType = signal<'cash' | 'online' | 'credit'>('cash');

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  customerForm!: FormGroup;
  itemAddForm!: FormGroup;
  billingForm!: FormGroup;

  overallDiscountType = signal<'percentage' | 'amount'>('percentage');
  overallDiscountValue = signal<number>(0);

  // Custom validator for future dates
  noFutureDateValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      return { futureDate: true };
    }
    return null;
  };

  filteredCustomers = computed(() => {
    const query = this.customerSearchQuery().toLowerCase();
    if (!query) return this.customers();
    return this.customers().filter(
      (c) =>
        c.firstname.toLowerCase().includes(query) ||
        c.lastname.toLowerCase().includes(query) ||
        c.mobileNo.includes(query) ||
        (c.emailId && c.emailId.toLowerCase().includes(query))
    );
  });

  filteredItems = computed(() => {
    const query = this.itemSearchQuery().toLowerCase();
    // Only show items that have batch tracking for billing
    const batchTrackedItems = this.items().filter((item) => item.hasBatchTracking);

    if (!query) return batchTrackedItems;
    return batchTrackedItems.filter((item) => item.name.toLowerCase().includes(query));
  });

  subtotal = computed(() => {
    return this.billingItems().reduce((sum, item) => sum + item.taxableAmount, 0);
  });

  totalAfterDiscount = computed(() => {
    const sub = this.subtotal();
    const discount = this.overallDiscountValue();
    const type = this.overallDiscountType();

    if (type === 'percentage') {
      return sub - (sub * discount) / 100;
    } else {
      return sub - discount;
    }
  });

  cgstTotal = computed(() => {
    return this.billingItems().reduce((sum, item) => sum + item.cgst, 0);
  });

  sgstTotal = computed(() => {
    return this.billingItems().reduce((sum, item) => sum + item.sgst, 0);
  });

  igstTotal = computed(() => {
    return this.billingItems().reduce((sum, item) => sum + item.igst, 0);
  });

  grandTotal = computed(() => {
    return this.totalAfterDiscount() + this.cgstTotal() + this.sgstTotal() + this.igstTotal();
  });

  finalAmount = computed(() => {
    return Math.round(this.grandTotal());
  });

  roundOff = computed(() => {
    return this.finalAmount() - this.grandTotal();
  });

  // Helper method to calculate discount amount for display
  calculateDiscountAmount(): number {
    const sub = this.subtotal();
    const discount = this.overallDiscountValue();
    const type = this.overallDiscountType();
    if (type === 'percentage') {
      return (sub * discount) / 100;
    }
    return discount;
  }

  // Discount change handler
  onDiscountChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.overallDiscountValue.set(value);
  }

  // Set discount type
  setDiscountType(type: 'percentage' | 'amount') {
    this.overallDiscountType.set(type);
  }

  ngOnInit() {
    this.checkIfAdmin();
    this.initForms();

    // Subscribe to overall discount changes to make it reactive
    this.billingForm.get('overallDiscount')?.valueChanges.subscribe((value) => {
      this.overallDiscountValue.set(value || 0);
    });

    this.loadCustomers();
    this.loadItems();

    // Check if editing existing billing
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id && !isNaN(Number(id))) {
      this.editBillingId.set(Number(id));
      this.loadBillingForEdit(Number(id));
    } else {
      this.loadLatestBill();
    }

    if (this.isAdmin()) {
      this.loadDistributors();
    }
  }

  checkIfAdmin() {
    const user = this.authService.getCurrentUser() as any;
    this.isAdmin.set(user?.role === 'super_admin' || user?.role === 'admin');
  }

  loadDistributors() {
    this.userService.getDistributors().subscribe({
      next: (data) => {
        this.distributors.set(data.data || []);
      },
      error: (err) => console.error('Error loading distributors:', err)
    });
  }

  initForms() {
    const todayDate = new Date().toISOString().split('T')[0];
    // Only mobileNo and firstname are required
    this.customerForm = this.fb.group({
      mobileNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      firstname: ['', Validators.required],
      lastname: [''],
      emailId: ['', Validators.email],
      gstin: [''],
      addressLine1: [''],
      addressLine2: [''],
      city: [''],
      state: [''],
      pincode: ['', Validators.pattern(/^[0-9]{6}$/)]
    });

    this.itemAddForm = this.fb.group({
      selectedItem: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      rate: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      discountType: ['percentage'],
      cgstRate: [9, [Validators.min(0), Validators.max(100)]],
      sgstRate: [9, [Validators.min(0), Validators.max(100)]],
      igstRate: [0, [Validators.min(0), Validators.max(100)]],
      batchNumber: [''],
      serialNumber: [''],
      expiryDate: ['']
    });

    this.billingForm = this.fb.group({
      billDate: [todayDate, [Validators.required, this.noFutureDateValidator]],
      overallDiscount: [0, [Validators.min(0)]],
      notes: [''],
      paymentType: ['cash'],
      distributorId: [null],
      cropName: [''],
      cropDiseases: ['']
    });
  }

  loadCustomers() {
    this.isLoading.set(true);
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        if (response && response.data && Array.isArray(response.data)) {
          this.customers.set(response.data);
        } else {
          this.customers.set([]);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to fetch customers', error);
        this.customers.set([]);
        this.errorMessage.set('Failed to load customers');
        this.isLoading.set(false);
      }
    });
  }

  loadItems() {
    this.itemService.getItemsWithStockStatus().subscribe({
      next: (response) => {
        if (response && response.data && Array.isArray(response.data)) {
          this.items.set(response.data);
          // Build stock status map
          const stockMap = new Map<number, { stockQuantity: number; inStock: boolean }>();
          response.data.forEach((item) => {
            stockMap.set(item.id, {
              stockQuantity: item.stockQuantity || 0,
              inStock: item.inStock || false
            });
          });
          this.itemStockStatus.set(stockMap);
        } else {
          this.items.set([]);
          this.itemStockStatus.set(new Map());
        }
      },
      error: (error) => {
        console.error('Failed to fetch items', error);
        this.items.set([]);
        this.itemStockStatus.set(new Map());
      }
    });
  }

  loadBillingForEdit(billId: number) {
    this.isLoading.set(true);
    this.billingService.getBillings().subscribe({
      next: (response) => {
        if (response && response.data && Array.isArray(response.data)) {
          const billing = response.data.find((b) => b.id === billId);
          if (billing && billing.status === 'draft') {
            // Set customer
            this.selectedCustomer.set(billing.customer || null);

            // Set billing form values
            this.billingForm.patchValue({
              billDate: billing.billDate,
              overallDiscount: billing.overallDiscount || 0,
              notes: billing.notes || ''
            });

            this.overallDiscountType.set(billing.overallDiscountType || 'percentage');
            this.paymentType.set(billing.paymentType || 'cash');
            this.billingItems.set(billing.items || []);

            this.isLoading.set(false);
          } else {
            this.errorMessage.set('Only draft invoices can be edited');
            this.isLoading.set(false);
            setTimeout(() => this.router.navigate(['/billing-history']), 2000);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load billing for edit', err);
        this.errorMessage.set('Failed to load invoice');
        this.isLoading.set(false);
      }
    });
  }

  loadLatestBill() {
    const user = this.authService.getCurrentUser() as any;

    this.billingService.getBillings().subscribe({
      next: (response) => {
        if (response && response.data && Array.isArray(response.data)) {
          // Sort bills by date descending and get the latest
          const sortedBills = response.data.sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());

          if (sortedBills.length > 0) {
            const latestBill = sortedBills[0];
            this.latestBillDate.set(latestBill.billDate);

            // Extract invoice number from billNo (format: BILL-timestamp or BILL-24, etc.)
            if (latestBill.billNo) {
              const parts = latestBill.billNo.split('-');
              const lastPart = parts[parts.length - 1];
              const invoiceNum = parseInt(lastPart, 10);
              if (!isNaN(invoiceNum)) {
                this.latestInvoiceNumber.set(invoiceNum);
              }
            }
          }
        }
      },
      error: (error) => {
        console.error('Failed to fetch latest bill', error);
      }
    });
  }

  openCustomerSearch() {
    this.showCustomerSearch.set(true);
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer.set(customer);
    this.showCustomerSearch.set(false);
  }

  openNewCustomerForm() {
    this.showCustomerSearch.set(false);
    this.showCustomerModal.set(true);
    this.customerForm.reset();
  }

  closeCustomerModal() {
    this.showCustomerModal.set(false);
  }

  onCustomerFormSubmitted(customerData: Partial<Customer>) {
    this.isLoading.set(true);
    this.customerService.createCustomer(customerData).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.selectedCustomer.set(response.data);
          this.customers.update((customers) => [...(customers || []), response.data]);
          this.successMessage.set('Customer created successfully');
          this.closeCustomerModal();
        }
        this.isLoading.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        console.error('Failed to create customer', error);
        this.errorMessage.set('Failed to create customer');
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 3000);
      }
    });
  }

  openItemModal() {
    this.showItemModal.set(true);
    this.itemAddForm.reset({
      quantity: 1,
      rate: 0,
      discount: 0,
      discountType: 'percentage',
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0
    });
  }

  closeItemModal() {
    this.showItemModal.set(false);
  }

  onItemSelect(item: ApiItem, selectedBatch?: any) {
    const stockInfo = this.itemStockStatus().get(item.id);
    if (!stockInfo?.inStock) {
      alert('This item is not available in your stock.');
      return;
    }

    this.itemSearchQuery.set('');
    this.selectedItemForBatch.set(item);
    this.itemsFoundByBatch.set([]);
    this.selectedBatchResult.set(null);

    // Load available batches first
    if (item.hasBatchTracking || item.hasSerialTracking) {
      this.loadAvailableBatches(item.id);
      // Show batch picker instead of form
      this.showBatchPicker.set(true);
      this.selectedQtyForBatch.set(1);
    } else {
      // No batch tracking - show regular form
      this.itemAddForm.patchValue({
        selectedItem: item,
        rate: item.rate || 0,
        batchNumber: '',
        serialNumber: '',
        expiryDate: '',
        orderedByBox: false,
        boxCount: 1
      });
    }
  }

  selectBatchFromPicker(batch: any) {
    const item = this.selectedItemForBatch();
    if (!item || !batch) return;

    // Determine batch/serial identifier
    const batchNumber = batch.batchNumber || '';
    const serialNumber = batch.serialNumber || '';
    const inventoryId = batch.inventoryId || batch.id;

    // VALIDATION: For items with serial tracking, serial number is required
    if (item.hasSerialTracking && !serialNumber) {
      this.errorMessage.set(
        `⚠️ "${item.name}" has serial tracking enabled. Each unit must have a serial number. ` +
          `Please select a specific serial entry from the list, or ensure the inventory has serial numbers assigned.`
      );
      setTimeout(() => this.errorMessage.set(''), 6000);
      return;
    }

    // Create billing item data with selected batch and quantity
    const formValue = {
      selectedItem: item,
      quantity: this.selectedQtyForBatch(),
      rate: item.rate || 0,
      discount: 0,
      discountType: 'percentage',
      cgstRate: (item.gstRate || 0) / 2, // Split GST equally for CGST/SGST
      sgstRate: (item.gstRate || 0) / 2,
      igstRate: 0,
      batchNumber: batchNumber,
      serialNumber: serialNumber,
      expiryDate: batch.expiryDate || '',
      orderedByBox: false,
      boxCount: 1,
      inventoryId: inventoryId
    };

    // Add item directly to billing
    this.finalizeBillingItem(formValue);

    // Close batch picker
    this.showBatchPicker.set(false);
    this.closeBatchPicker();

    // Build success message with identifier
    let identifier = '';
    if (batchNumber) {
      identifier = `Batch: ${batchNumber}`;
    } else if (serialNumber) {
      identifier = `Serial: ${serialNumber}`;
    } else {
      identifier = `Stock #${inventoryId}`;
    }
    this.successMessage.set(`✓ Added ${item.name} (${identifier}, Qty: ${this.selectedQtyForBatch()}) to billing`);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  closeBatchPicker() {
    this.showBatchPicker.set(false);
    this.selectedItemForBatch.set(null);
    this.availableInventory.set([]);
    this.selectedQtyForBatch.set(1);
    this.selectedBatchForPicker.set(null);
  }

  incrementQty(amount: number) {
    const newQty = Math.max(1, this.selectedQtyForBatch() + amount);
    this.selectedQtyForBatch.set(newQty);
  }

  decrementQty(amount: number) {
    const newQty = Math.max(1, this.selectedQtyForBatch() - amount);
    this.selectedQtyForBatch.set(newQty);
  }

  updateQtyFromInput(inputValue: any) {
    const newQty = Math.max(1, parseInt(inputValue) || 1);
    this.selectedQtyForBatch.set(newQty);
    this.selectedQtyForBatchInput = newQty;
  }

  // Unified search handler with debounce
  onUnifiedSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.unifiedSearchQuery = query;
    this.itemSearchQuery.set(query); // Also update item search for filtering

    // Clear previous timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    // Debounce batch/serial search (300ms)
    if (query.length >= 2) {
      this.searchDebounceTimer = setTimeout(() => {
        this.performUnifiedSearch();
      }, 300);
    } else {
      this.itemsFoundByBatch.set([]);
    }
  }

  performUnifiedSearch() {
    const query = this.unifiedSearchQuery.trim();
    if (!query || query.length < 2) {
      this.itemsFoundByBatch.set([]);
      return;
    }

    this.isSearching.set(true);
    this.billingService.searchItemsByBatchSerial(query).subscribe({
      next: (response) => {
        this.itemsFoundByBatch.set(response.data || []);
        this.isSearching.set(false);
      },
      error: (err) => {
        console.error('Error searching items by batch/serial:', err);
        this.itemsFoundByBatch.set([]);
        this.isSearching.set(false);
      }
    });
  }

  searchItemsByBatchSerial() {
    const query = this.batchSearchInput.trim();
    this.batchSearchQuery.set(query); // Update signal for display

    if (!query || query.length < 2) {
      this.itemsFoundByBatch.set([]);
      return;
    }

    this.isLoading.set(true);
    this.billingService.searchItemsByBatchSerial(query).subscribe({
      next: (response) => {
        this.itemsFoundByBatch.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error searching items by batch/serial:', err);
        this.errorMessage.set('Failed to search items by batch/serial');
        this.itemsFoundByBatch.set([]);
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 3000);
      }
    });
  }

  selectItemFromBatchSearch(itemResult: any, batch: any) {
    // VALIDATION: For items with BOTH batch AND serial tracking,
    // user MUST select a serial number (not just a batch)
    // because serial is the sellable unit
    if (itemResult.hasBatchTracking && itemResult.hasSerialTracking) {
      if (!batch.serialNumber) {
        this.errorMessage.set(
          `⚠️ "${itemResult.name}" has serial tracking enabled. Please select a specific serial number to sell, not just the batch. ` +
            `Click on one of the serial entries (S: FAN-SERIAL-1, etc.) below the batch.`
        );
        setTimeout(() => this.errorMessage.set(''), 6000);
        return;
      }
    }

    // Convert the search result to ApiItem format
    const item: any = {
      id: itemResult.id,
      name: itemResult.name,
      rate: itemResult.rate,
      unit: itemResult.unit,
      hasBatchTracking: itemResult.hasBatchTracking,
      hasSerialTracking: itemResult.hasSerialTracking,
      hasExpiryDate: itemResult.hasExpiryDate,
      hasBoxPackaging: itemResult.hasBoxPackaging,
      unitsPerBox: itemResult.unitsPerBox,
      boxRate: itemResult.boxRate,
      gstRate: itemResult.gstRate || 0,
      qty: 1,
      assets: []
    };

    // For serial-tracked items, quantity is always 1 per serial
    const quantity = itemResult.hasSerialTracking ? 1 : 1;

    // DIRECT ADD: Finalize billing item immediately without showing form again
    const formValue = {
      selectedItem: item,
      quantity: quantity,
      rate: itemResult.rate || 0,
      discount: 0,
      discountType: 'percentage',
      cgstRate: (itemResult.gstRate || 0) / 2, // Split GST equally for CGST/SGST
      sgstRate: (itemResult.gstRate || 0) / 2,
      igstRate: 0,
      batchNumber: batch.batchNumber || batch.linkedBatchNumber || '',
      serialNumber: batch.serialNumber || '',
      expiryDate: batch.expiryDate || '',
      orderedByBox: false,
      boxCount: 1,
      inventoryId: batch.inventoryId || batch.id
    };

    // Add item directly to billing - NO MODAL
    this.finalizeBillingItem(formValue);

    // Close any open modals
    this.closeItemModal();

    // Clear search
    this.batchSearchInput = '';
    this.batchSearchQuery.set('');
    this.itemsFoundByBatch.set([]);
    this.itemSearchTab.set('by-name');

    // Show success message with serial info if applicable
    const identifier = batch.serialNumber ? `Serial: ${batch.serialNumber}` : `Batch: ${batch.batchNumber}`;
    this.successMessage.set(`✓ Added ${itemResult.name} (${identifier}) to billing`);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  loadAvailableBatches(itemId: number) {
    // Get available inventory with expiry status for this item
    this.inventoryService.getAvailableForBilling(itemId).subscribe({
      next: (response) => {
        const inventoryItems = response.data || [];
        this.availableInventory.set(inventoryItems);

        const batches = new Set<string>();
        const serials = new Set<string>();

        inventoryItems.forEach((inv) => {
          if (inv.batchNumber) batches.add(inv.batchNumber);
          if (inv.serialNumber) serials.add(inv.serialNumber);
        });

        this.availableBatches.set(Array.from(batches).sort());
        this.availableSerials.set(Array.from(serials).sort());
      },
      error: (err) => {
        console.error('Error loading batches:', err);
        this.availableBatches.set([]);
        this.availableSerials.set([]);
        this.availableInventory.set([]);
      }
    });
  }

  mapInventoryToBatches() {
    return this.availableInventory().map((inv: any) => ({
      id: inv.id,
      inventoryId: inv.id,
      batchNumber: inv.batchNumber || '',
      serialNumber: inv.serialNumber || '',
      quantity: inv.quantity,
      expiryDate: inv.expiryDate,
      expiryStatus: inv.expiryStatus,
      itemId: inv.itemId,
      itemName: inv.item?.name || ''
    }));
  }

  getExpiryStatusColor(expiryStatus?: string): string {
    switch (expiryStatus) {
      case 'expired':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'expiring_soon':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'valid':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  }

  getExpiryStatusBadge(expiryStatus?: string): string {
    switch (expiryStatus) {
      case 'expired':
        return '🔴 Expired';
      case 'expiring_soon':
        return '🟡 Expiring Soon';
      case 'valid':
        return '✅ Valid';
      default:
        return '⚪ Not Tracked';
    }
  }

  getMaxQtyForBatch(): number {
    const batchNumber = this.itemAddForm.get('batchNumber')?.value;
    if (!batchNumber) return 9999; // No limit if batch not selected

    // Find max qty from available inventory for this batch
    const maxQty = this.availableInventory()
      .filter((inv) => inv.batchNumber === batchNumber)
      .reduce((max, inv) => Math.max(max, inv.quantity), 0);

    return maxQty || 9999;
  }

  addItemToBilling() {
    if (this.itemAddForm.invalid) {
      Object.keys(this.itemAddForm.controls).forEach((key) => {
        this.itemAddForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Get selected batch from batch selector component if available
    if (this.batchSelector) {
      const selectedBatch = this.batchSelector.getSelectedValue();
      if (selectedBatch) {
        this.itemAddForm.patchValue({
          batchNumber: selectedBatch.batchNumber || '',
          serialNumber: selectedBatch.serialNumber || '',
          expiryDate: selectedBatch.expiryDate || ''
        });
      }
    }

    const formValue = this.itemAddForm.value;
    const item = formValue.selectedItem as ApiItem;

    // VALIDATION: Check if batch number is mandatory
    if (item.hasBatchTracking && !formValue.batchNumber) {
      this.errorMessage.set(`Batch number is required for "${item.name}" as it has batch tracking enabled. Please select a batch from the list.`);
      setTimeout(() => this.errorMessage.set(''), 5000);
      return;
    }

    // VALIDATION: Check if serial number is mandatory
    if (item.hasSerialTracking && !formValue.serialNumber) {
      this.errorMessage.set(`Serial number is required for "${item.name}" as it has serial tracking enabled. Please select a batch/serial from the list.`);
      setTimeout(() => this.errorMessage.set(''), 5000);
      return;
    }
    const quantity = formValue.quantity;

    // Check if bulk batch/serial input is needed
    const needsBulkInput = quantity > 1 && (item.hasBatchTracking || item.hasSerialTracking || item.hasExpiryDate);

    if (needsBulkInput) {
      // Store the form data temporarily
      this.pendingBillingItemData = formValue;

      // Open batch/serial input modal
      setTimeout(() => {
        if (this.batchSerialModal) {
          this.batchSerialModal.open({
            quantity,
            itemName: item.name,
            hasBatch: item.hasBatchTracking || false,
            hasSerial: item.hasSerialTracking || false,
            hasExpiry: item.hasExpiryDate || false,
            onSubmit: (entries: BatchSerialEntry[]) => this.onBatchSerialSubmit(entries),
            onCancel: () => this.onBatchSerialCancel()
          });
        }
      }, 100);
      return;
    }

    // Original logic for single item or no batch/serial tracking
    this.finalizeBillingItem(formValue);
  }

  onBatchSerialSubmit(entries: BatchSerialEntry[]) {
    const formValue = this.pendingBillingItemData;
    formValue.batchSerialEntries = entries;
    this.finalizeBillingItem(formValue);
  }

  onBatchSerialCancel() {
    this.pendingBillingItemData = null;
  }

  finalizeBillingItem(formValue: any) {
    const item = formValue.selectedItem as ApiItem;
    const orderedByBox = formValue.orderedByBox || false;
    const boxCount = formValue.boxCount || 0;
    const discount = formValue.discount || 0;
    const discountType = formValue.discountType;
    const cgstRate = formValue.cgstRate || 0;
    const sgstRate = formValue.sgstRate || 0;
    const igstRate = formValue.igstRate || 0;

    let quantity: number;
    let rate: number;
    let itemTotal: number;
    let boxRate: number | undefined;
    let unitsPerBox: number | undefined;

    // Calculate based on box ordering or regular quantity
    if (orderedByBox && boxCount > 0) {
      quantity = boxCount * (item.unitsPerBox || 1);
      rate = item.boxRate || item.rate || 0;
      itemTotal = boxCount * rate;
      boxRate = item.boxRate || 0;
      unitsPerBox = item.unitsPerBox || 1;
    } else {
      quantity = formValue.quantity;
      rate = formValue.rate;
      itemTotal = quantity * rate;
    }

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = itemTotal * (discount / 100);
    } else {
      discountAmount = discount;
    }

    const taxableAmount = itemTotal - discountAmount;
    const cgst = taxableAmount * (cgstRate / 100);
    const sgst = taxableAmount * (sgstRate / 100);
    const igst = taxableAmount * (igstRate / 100);
    const totalAmount = taxableAmount + cgst + sgst + igst;

    const newBillingItem: BillingItem = {
      itemId: String(item.id),
      itemName: item.name,
      unit: item.unit,
      quantity,
      rate,
      discount,
      discountType,
      taxableAmount,
      cgst,
      sgst,
      igst,
      cgstRate,
      sgstRate,
      igstRate,
      totalAmount,
      batchNumber: formValue.batchNumber || undefined,
      serialNumber: formValue.serialNumber || undefined,
      expiryDate: formValue.expiryDate || undefined,
      batchSerialEntries: formValue.batchSerialEntries || undefined,
      orderedByBox,
      boxCount: orderedByBox ? boxCount : undefined,
      boxRate,
      unitsPerBox,
      inventoryId: formValue.inventoryId || undefined
    };

    // BATCH CLUBBING: Check if same item with same rate and tax rates exists, if yes combine them
    const existingIndex = this.billingItems().findIndex(
      (existingItem) =>
        existingItem.itemId === newBillingItem.itemId &&
        existingItem.rate === newBillingItem.rate &&
        (existingItem.cgstRate ?? 0) === cgstRate &&
        (existingItem.sgstRate ?? 0) === sgstRate &&
        (existingItem.igstRate ?? 0) === igstRate
    );

    if (existingIndex >= 0) {
      // Combine quantities and recalculate totals
      this.billingItems.update((items) => {
        const updated = [...items];
        const existing = updated[existingIndex];

        const combinedQty = existing.quantity + newBillingItem.quantity;
        const combinedItemTotal = combinedQty * newBillingItem.rate;
        const combinedDiscount = (newBillingItem.discount / newBillingItem.quantity) * combinedQty;
        const combinedTaxableAmount = combinedItemTotal - combinedDiscount;
        const combinedCgst = combinedTaxableAmount * (cgstRate / 100);
        const combinedSgst = combinedTaxableAmount * (sgstRate / 100);
        const combinedIgst = combinedTaxableAmount * (igstRate / 100);
        const combinedTotal = combinedTaxableAmount + combinedCgst + combinedSgst + combinedIgst;

        updated[existingIndex] = {
          ...existing,
          quantity: combinedQty,
          taxableAmount: combinedTaxableAmount,
          cgst: combinedCgst,
          sgst: combinedSgst,
          igst: combinedIgst,
          totalAmount: combinedTotal
        };
        return updated;
      });
    } else {
      // Add as new item
      this.billingItems.update((items) => [...items, newBillingItem]);
    }

    // Reset form but KEEP MODAL OPEN for next entry
    this.resetItemAddForm();
    this.pendingBillingItemData = null;
  }

  resetItemAddForm() {
    this.itemAddForm.reset({
      selectedItem: null,
      quantity: '',
      rate: '',
      discount: 0,
      discountType: 'percentage',
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      batchNumber: '',
      serialNumber: '',
      expiryDate: '',
      orderedByBox: false,
      boxCount: 1,
      inventoryId: null
    });
    // Re-enable batch fields for next entry
    this.itemAddForm.get('batchNumber')?.enable();
    this.itemAddForm.get('serialNumber')?.enable();
    this.itemAddForm.get('expiryDate')?.enable();
    this.itemSearchQuery.set('');
    this.batchSearchQuery.set('');
  }

  getTotalBillingAmount(): string {
    const total = this.billingItems().reduce((sum: number, item: BillingItem) => sum + item.totalAmount, 0);
    return total.toFixed(2);
  }

  removeItem(index: number) {
    this.billingItems.update((items) => items.filter((_, i) => i !== index));
  }

  private validateBillingData() {
    if (!this.selectedCustomer()) {
      this.errorMessage.set('Please select a customer');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return false;
    }

    if (this.billingItems().length === 0) {
      this.errorMessage.set('Please add at least one item');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return false;
    }

    // Validate bill date
    const billDateStr = this.billingForm.value.billDate;
    const [year, month, day] = new Date(billDateStr).toDateString().split('-').map(Number);
    const billDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (billDate > today) {
      this.errorMessage.set('Bill date cannot be in the future');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return false;
    }

    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    if (billDate < tenDaysAgo) {
      this.errorMessage.set('Bill date cannot be older than 10 days');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return false;
    }

    const latestDate = this.latestBillDate();
    if (latestDate) {
      const [latYear, latMonth, latDay] = latestDate.split('-').map(Number);
      const latestBillDateObj = new Date(latYear, latMonth - 1, latDay, 0, 0, 0, 0);
      if (billDate < latestBillDateObj) {
        this.errorMessage.set(`Bill date cannot be before the latest bill date (${latestDate})`);
        setTimeout(() => this.errorMessage.set(''), 3000);
        return false;
      }
    }

    return true;
  }

  saveDraft() {
    if (!this.validateBillingData()) return;

    const billing: Partial<Billing> = {
      billDate: this.billingForm.value.billDate,
      customerId: Number(this.selectedCustomer()!.id),
      items: this.billingItems(),
      subtotal: this.subtotal(),
      overallDiscount: this.billingForm.value.overallDiscount || 0,
      overallDiscountType: this.overallDiscountType(),
      totalAfterDiscount: this.totalAfterDiscount(),
      cgstTotal: this.cgstTotal(),
      sgstTotal: this.sgstTotal(),
      igstTotal: this.igstTotal(),
      grandTotal: this.grandTotal(),
      roundOff: this.roundOff(),
      finalAmount: this.finalAmount(),
      notes: this.billingForm.value.notes,
      status: 'draft',
      paymentType: this.paymentType(),
      cropName: this.billingForm.value.cropName || '',
      cropDiseases: this.billingForm.value.cropDiseases || ''
    };

    this.isLoading.set(true);

    // Use update if editing, create if new
    const saveOperation =
      this.isEditMode() && this.editBillingId() ? this.billingService.updateBilling(this.editBillingId()!, billing) : this.billingService.createBilling(billing);

    saveOperation.subscribe({
      next: (response) => {
        const action = this.isEditMode() ? 'updated' : 'saved';
        this.successMessage.set(`✅ Invoice ${action} as Draft (no invoice number yet)`);
        setTimeout(() => {
          this.router.navigate(['/billing-history']);
        }, 1500);
        this.resetBillingForm();
        this.editBillingId.set(null);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to save draft', error);
        let errorMsg = 'Failed to save draft';
        if (error?.error?.message) errorMsg = error.error.message;
        else if (error?.error?.error) errorMsg = error.error.error;
        this.errorMessage.set(errorMsg);
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  completeBilling() {
    if (!this.validateBillingData()) return;

    const billing: Partial<Billing> = {
      billDate: this.billingForm.value.billDate,
      customerId: Number(this.selectedCustomer()!.id),
      items: this.billingItems(),
      subtotal: this.subtotal(),
      overallDiscount: this.billingForm.value.overallDiscount || 0,
      overallDiscountType: this.overallDiscountType(),
      totalAfterDiscount: this.totalAfterDiscount(),
      cgstTotal: this.cgstTotal(),
      sgstTotal: this.sgstTotal(),
      igstTotal: this.igstTotal(),
      grandTotal: this.grandTotal(),
      roundOff: this.roundOff(),
      finalAmount: this.finalAmount(),
      notes: this.billingForm.value.notes,
      status: 'draft',
      paymentType: this.paymentType(),
      cropName: this.billingForm.value.cropName || '',
      cropDiseases: this.billingForm.value.cropDiseases || ''
    };

    this.isLoading.set(true);

    const handleCompletion = (billingId: number) => {
      this.billingService.completeBilling(billingId).subscribe({
        next: () => {
          this.successMessage.set('✅ Invoice completed with invoice number generated!');
          setTimeout(() => {
            this.router.navigate(['/billing-history']);
          }, 1500);
          this.resetBillingForm();
          this.editBillingId.set(null);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Failed to complete billing', error);
          this.errorMessage.set('Invoice saved but failed to generate invoice number');
          this.isLoading.set(false);
          setTimeout(() => this.errorMessage.set(''), 5000);
        }
      });
    };

    if (this.isEditMode() && this.editBillingId()) {
      // Update existing draft, then complete it
      this.billingService.updateBilling(this.editBillingId()!, billing).subscribe({
        next: () => {
          handleCompletion(this.editBillingId()!);
        },
        error: (error: any) => {
          console.error('Failed to update billing', error);
          let errorMsg = 'Failed to complete invoice';
          if (error?.error?.message) errorMsg = error.error.message;
          else if (error?.error?.error) errorMsg = error.error.error;
          this.errorMessage.set(errorMsg);
          this.isLoading.set(false);
          setTimeout(() => this.errorMessage.set(''), 5000);
        }
      });
    } else {
      // Create as draft, then complete it
      this.billingService.createBilling(billing).subscribe({
        next: (response) => {
          const billingId = response.data?.id;
          if (!billingId) {
            this.errorMessage.set('Failed to get billing ID');
            this.isLoading.set(false);
            setTimeout(() => this.errorMessage.set(''), 5000);
            return;
          }

          handleCompletion(billingId);
        },
        error: (error: any) => {
          console.error('Failed to create billing', error);
          let errorMsg = 'Failed to complete invoice';
          if (error?.error?.message) errorMsg = error.error.message;
          else if (error?.error?.error) errorMsg = error.error.error;
          this.errorMessage.set(errorMsg);
          this.isLoading.set(false);
          setTimeout(() => this.errorMessage.set(''), 5000);
        }
      });
    }
  }

  updateItemQuantity(index: number, event: any) {
    const items = [...this.billingItems()];
    const newQuantity = parseFloat(event.target.value) || items[index].quantity;
    items[index].quantity = newQuantity;
    items[index].taxableAmount =
      newQuantity * items[index].rate -
      (items[index].discount && items[index].discountType === 'percentage' ? (newQuantity * items[index].rate * items[index].discount) / 100 : items[index].discount || 0);
    items[index].totalAmount = items[index].taxableAmount + items[index].cgst + items[index].sgst + items[index].igst;
    this.billingItems.set(items);
  }

  updateItemRate(index: number, event: any) {
    const items = [...this.billingItems()];
    const newRate = parseFloat(event.target.value) || items[index].rate;
    items[index].rate = newRate;
    items[index].taxableAmount =
      items[index].quantity * newRate -
      (items[index].discount && items[index].discountType === 'percentage' ? (items[index].quantity * newRate * items[index].discount) / 100 : items[index].discount || 0);
    items[index].totalAmount = items[index].taxableAmount + items[index].cgst + items[index].sgst + items[index].igst;
    this.billingItems.set(items);
  }

  updateItemDiscount(index: number, event: any) {
    const items = [...this.billingItems()];
    const newDiscount = parseFloat(event.target.value) || items[index].discount;
    items[index].discount = newDiscount;
    const baseAmount = items[index].quantity * items[index].rate;
    const discountAmount = items[index].discountType === 'percentage' ? (baseAmount * newDiscount) / 100 : newDiscount;
    items[index].taxableAmount = baseAmount - discountAmount;
    items[index].totalAmount = items[index].taxableAmount + items[index].cgst + items[index].sgst + items[index].igst;
    this.billingItems.set(items);
  }

  resetBillingForm() {
    this.selectedCustomer.set(null);
    this.billingItems.set([]);
    this.billingForm.reset({
      billDate: new Date().toISOString().split('T')[0],
      overallDiscount: 0,
      notes: ''
    });
  }

  // Barcode scanner handler
  onBarcodeScanned(code: string) {
    // Set the scanned code to unified search
    this.unifiedSearchQuery = code;
    this.itemSearchQuery.set(code);
    this.batchSearchInput = code;
    this.batchSearchQuery.set(code);

    // Open item modal if not already open
    if (!this.showItemModal()) {
      this.showItemModal.set(true);
    }

    // Trigger unified search automatically
    this.performUnifiedSearch();

    // Show success feedback
    this.successMessage.set(`📷 Scanned: ${code}`);
    setTimeout(() => this.successMessage.set(''), 2000);
  }
}
