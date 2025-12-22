import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemService } from '../../services/item.service';
import { ReturnsService } from '../../services/returns.service';

@Component({
  selector: 'app-distributor-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './distributor-returns.component.html',
  styleUrls: ['./distributor-returns.component.scss'],
})
export class DistributorReturnsComponent implements OnInit {
  private itemService = inject(ItemService);
  private returnsService = inject(ReturnsService);

  activeTab: 'purchase' | 'sales' = 'purchase';
  items: any[] = [];
  purchaseReturns: any[] = [];
  salesReturns: any[] = [];
  loading = false;

  purchaseReturnForm = {
    returnNo: '',
    returnDate: '',
    itemId: '',
    quantity: 0,
    rate: 0,
    reason: '',
  };

  salesReturnForm = {
    returnNo: '',
    returnDate: '',
    itemId: '',
    quantity: 0,
    rate: 0,
    reason: '',
  };

  ngOnInit() {
    this.loadItems();
    this.loadReturns();
  }

  loadItems() {
    this.itemService.getItems().subscribe({
      next: (data) => {
        this.items = data.data || [];
      },
    });
  }

  loadReturns() {
    this.returnsService.getPurchaseReturns().subscribe({
      next: (data) => {
        this.purchaseReturns = data.data || [];
      },
    });

    this.returnsService.getSalesReturns().subscribe({
      next: (data) => {
        this.salesReturns = data.data || [];
      },
    });
  }

  calculateTotal(quantity: number, rate: number): number {
    return quantity * rate;
  }

  submitPurchaseReturn() {
    if (!this.validatePurchaseForm()) return;

    const payload = {
      ...this.purchaseReturnForm,
      itemId: parseInt(this.purchaseReturnForm.itemId),
      totalAmount: this.calculateTotal(this.purchaseReturnForm.quantity, this.purchaseReturnForm.rate),
      distributorId: 1, // From logged-in user
    };

    this.returnsService.createPurchaseReturn(payload).subscribe({
      next: () => {
        alert('Purchase return created successfully');
        this.resetPurchaseForm();
        this.loadReturns();
      },
      error: (err) => alert('Error creating purchase return: ' + err.error?.message),
    });
  }

  submitSalesReturn() {
    if (!this.validateSalesForm()) return;

    const payload = {
      ...this.salesReturnForm,
      itemId: parseInt(this.salesReturnForm.itemId),
      totalAmount: this.calculateTotal(this.salesReturnForm.quantity, this.salesReturnForm.rate),
      distributorId: 1, // From logged-in user
    };

    this.returnsService.createSalesReturn(payload).subscribe({
      next: () => {
        alert('Sales return created successfully');
        this.resetSalesForm();
        this.loadReturns();
      },
      error: (err) => alert('Error creating sales return: ' + err.error?.message),
    });
  }

  validatePurchaseForm(): boolean {
    if (!this.purchaseReturnForm.returnNo?.trim()) {
      alert('Please enter return number');
      return false;
    }
    if (!this.purchaseReturnForm.returnDate) {
      alert('Please select return date');
      return false;
    }
    if (!this.purchaseReturnForm.itemId) {
      alert('Please select an item');
      return false;
    }
    if (this.purchaseReturnForm.quantity <= 0) {
      alert('Please enter valid quantity');
      return false;
    }
    return true;
  }

  validateSalesForm(): boolean {
    if (!this.salesReturnForm.returnNo?.trim()) {
      alert('Please enter return number');
      return false;
    }
    if (!this.salesReturnForm.returnDate) {
      alert('Please select return date');
      return false;
    }
    if (!this.salesReturnForm.itemId) {
      alert('Please select an item');
      return false;
    }
    if (this.salesReturnForm.quantity <= 0) {
      alert('Please enter valid quantity');
      return false;
    }
    return true;
  }

  resetPurchaseForm() {
    this.purchaseReturnForm = {
      returnNo: '',
      returnDate: '',
      itemId: '',
      quantity: 0,
      rate: 0,
      reason: '',
    };
  }

  resetSalesForm() {
    this.salesReturnForm = {
      returnNo: '',
      returnDate: '',
      itemId: '',
      quantity: 0,
      rate: 0,
      reason: '',
    };
  }
}
