import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { GrnService } from '../../services/grn.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-grn-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 min-h-screen p-4 md:p-8">
      <div class="max-w-5xl mx-auto">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">📝 Create GRN</h1>
          <p class="text-gray-600 mb-6">Create Goods Receipt Note for delivered PO</p>

          @if (errorMessage()) {
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-800">❌ {{ errorMessage() }}</p>
          </div>
          }

          @if (successMessage()) {
          <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-sm text-green-800">✅ {{ successMessage() }}</p>
          </div>
          }

          @if (po()) {
          <!-- Admin/Manager: Distributor Selector -->
          @if (isAdminOrManager) {
          <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Distributor *</label>
            <select
              [(ngModel)]="selectedDistributorId"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Choose a distributor...</option>
              @for (dist of distributors; track dist.id) {
              <option [value]="dist.id">{{ dist.businessName }} ({{ dist.email }})</option>
              }
            </select>
          </div>
          }

          <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <p class="text-sm font-medium text-indigo-900">
              <strong>PO:</strong> {{ po()?.poNo }}
            </p>
            <p class="text-sm text-indigo-800 mt-1">
              <strong>Total Items:</strong> {{ po()?.items?.length || 0 }}
            </p>
          </div>

          <div class="space-y-6 mb-6">
            <h2 class="text-lg font-bold text-gray-900">Items Received</h2>

            @for (item of po()?.items; track item.id; let idx = $index) {
            <div class="border-2 border-gray-200 rounded-lg p-5 bg-white">
              <!-- Item Header -->
              <div class="flex justify-between items-start mb-5">
                <div>
                  <p class="font-semibold text-gray-900 text-lg">{{ item.item?.name }}</p>
                  <div class="flex gap-4 mt-2 text-sm text-gray-600">
                    <span><strong>PO Qty:</strong> {{ item.quantity }}</span>
                    @if (item.item?.hasBatchTracking) {
                      <span class="text-blue-600 font-medium">📦 Batch Tracking</span>
                    }
                    @if (item.item?.hasSerialTracking) {
                      <span class="text-green-600 font-medium">🔢 Serial Tracking</span>
                    }
                  </div>
                </div>
                <span class="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-medium">
                  ₹{{ (+item.unitPrice).toFixed(2) }}
                </span>
              </div>

              <!-- Received Quantity -->
              <div class="mb-5">
                <label class="block text-sm font-medium text-gray-700 mb-2">Received Qty *</label>
                <div class="flex gap-3">
                  <input
                    type="number"
                    [(ngModel)]="grnItems[idx].receivedQuantity"
                    [min]="0"
                    [max]="item.quantity"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div class="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg self-center font-medium">
                    Pending: {{ item.quantity - grnItems[idx].receivedQuantity }}
                  </div>
                </div>
              </div>

              <!-- Batch Details Section (Only if item tracks batches) -->
              @if (item.item?.hasBatchTracking) {
              <div class="mb-5 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex justify-between items-center mb-4">
                  <label class="text-sm font-semibold text-blue-900">📦 Batch Details (ID, Serial, Expiry)</label>
                  <button
                    type="button"
                    (click)="addBatchRow(idx)"
                    class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                  >
                    + Add Batch
                  </button>
                </div>

                @if (!grnItems[idx].batchDetails || grnItems[idx].batchDetails.length === 0) {
                  <p class="text-xs text-blue-700 italic">No batch entries yet. Click "+ Add Batch" to add.</p>
                } @else {
                  <div class="space-y-2">
                    @for (batch of grnItems[idx].batchDetails; track $index; let batchIdx = $index) {
                      <div class="grid grid-cols-12 gap-2 items-end bg-white p-3 rounded border border-blue-200">
                        <div class="col-span-3">
                          <input
                            type="text"
                            [(ngModel)]="batch.batchNumber"
                            placeholder="Batch No"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div class="col-span-2">
                          <input
                            type="number"
                            [(ngModel)]="batch.quantity"
                            [min]="0"
                            [max]="grnItems[idx].receivedQuantity - getTotalBatchQty(idx, batchIdx)"
                            placeholder="Qty"
                            (change)="validateBatchQty(idx)"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div class="col-span-4">
                          <input
                            type="date"
                            [(ngModel)]="batch.expiryDate"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          (click)="removeBatchRow(idx, batchIdx)"
                          class="col-span-3 text-center px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    }
                    <div class="text-xs text-gray-600 mt-2 px-2">
                      Total Qty: <span class="font-semibold">{{ getTotalBatchQty(idx) }}</span> / {{ grnItems[idx].receivedQuantity }}
                      @if (getTotalBatchQty(idx) > grnItems[idx].receivedQuantity) {
                        <span class="text-red-600 font-bold">❌ Exceeds received qty!</span>
                      }
                    </div>
                  </div>
                }
              </div>
              }

              <!-- Serial Details Section (Only if item tracks serials) -->
              @if (item.item?.hasSerialTracking) {
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex justify-between items-center mb-4">
                  <label class="text-sm font-semibold text-green-900">🔢 Serial Number Details</label>
                  <button
                    type="button"
                    (click)="addSerialRow(idx)"
                    class="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition"
                  >
                    + Add Serial
                  </button>
                </div>

                @if (!grnItems[idx].serialDetails || grnItems[idx].serialDetails.length === 0) {
                  <p class="text-xs text-green-700 italic">No serial entries yet. Click "+ Add Serial" to add.</p>
                } @else {
                  <div class="space-y-2">
                    @for (serial of grnItems[idx].serialDetails; track $index; let serialIdx = $index) {
                      <div class="grid grid-cols-12 gap-2 items-end bg-white p-3 rounded border border-green-200">
                        <div class="col-span-4">
                          <input
                            type="text"
                            [(ngModel)]="serial.serialNumber"
                            placeholder="Serial No"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        </div>
                        <div class="col-span-2">
                          <input
                            type="number"
                            [(ngModel)]="serial.quantity"
                            [min]="0"
                            [max]="grnItems[idx].receivedQuantity - getTotalSerialQty(idx, serialIdx)"
                            placeholder="Qty"
                            (change)="validateSerialQty(idx)"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        </div>
                        <div class="col-span-4">
                          <input
                            type="date"
                            [(ngModel)]="serial.expiryDate"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          (click)="removeSerialRow(idx, serialIdx)"
                          class="col-span-2 text-center px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    }
                    <div class="text-xs text-gray-600 mt-2 px-2">
                      Total Qty: <span class="font-semibold">{{ getTotalSerialQty(idx) }}</span> / {{ grnItems[idx].receivedQuantity }}
                      @if (getTotalSerialQty(idx) > grnItems[idx].receivedQuantity) {
                        <span class="text-red-600 font-bold">❌ Exceeds received qty!</span>
                      }
                    </div>
                  </div>
                }
              </div>
              }
            </div>
            }
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Remarks (Optional)</label>
            <textarea
              [(ngModel)]="remarks"
              placeholder="Any notes about the delivery..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows="3"
            ></textarea>
          </div>

          <div class="flex gap-4">
            <button
              (click)="goBack()"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              (click)="submitGrn()"
              [disabled]="isSubmitting() || hasQtyErrors()"
              class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition active:scale-95"
              [title]="hasQtyErrors() ? 'Fix batch/serial qty errors' : ''"
            >
              {{ isSubmitting() ? 'Creating...' : 'Create GRN' }}
            </button>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class GrnCreateComponent implements OnInit {
  route = inject(ActivatedRoute);
  poService = inject(PurchaseOrderService);
  grnService = inject(GrnService);
  router = inject(Router);
  auth = inject(AuthService);
  userService = inject(UserService);

  po = signal<any>(null);
  grnItems: any[] = [];
  remarks = '';
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isAdminOrManager = false;
  distributors: any[] = [];
  selectedDistributorId: number | string = '';

  ngOnInit() {
    this.isAdminOrManager = this.auth.isAdmin() || this.auth.isManager();
    if (this.isAdminOrManager) {
      this.loadDistributors();
    }
    const poIdStr = this.route.snapshot.paramMap.get('id');
    if (poIdStr) {
      this.loadPo(parseInt(poIdStr));
    }
  }

  loadDistributors() {
    this.userService.getDistributors().subscribe({
      next: (res: any) => {
        const distArray = res.data || res || [];
        this.distributors = distArray.map((d: any) => ({
          id: d.id,
          businessName: d.businessName || d.firstName + ' ' + d.lastName || 'Unknown',
          email: d.email
        }));
      },
      error: (err: any) => {
        console.error('Error loading distributors:', err);
      }
    });
  }

  loadPo(poId: number) {
    this.poService.getPurchaseOrders(undefined, undefined, 1, 100).subscribe({
      next: (response: any) => {
        const po = response.data?.find((p: any) => p.id === poId);
        if (po) {
          this.po.set(po);
          // Initialize GRN items with PO item quantities
          this.grnItems = po.items.map((item: any) => ({
            poItemId: item.id,
            itemId: item.itemId,
            receivedQuantity: item.quantity,
            originalQuantity: item.quantity,
            unitPrice: item.unitPrice,
            batchDetails: [],
            serialDetails: [],
          }));
        }
      },
      error: (err: any) => {
        console.error('Failed to load PO:', err);
      },
    });
  }

  // Batch operations
  addBatchRow(itemIdx: number) {
    if (!this.grnItems[itemIdx].batchDetails) {
      this.grnItems[itemIdx].batchDetails = [];
    }
    this.grnItems[itemIdx].batchDetails.push({
      batchNumber: '',
      quantity: 0,
      expiryDate: '',
    });
  }

  removeBatchRow(itemIdx: number, batchIdx: number) {
    if (this.grnItems[itemIdx].batchDetails) {
      this.grnItems[itemIdx].batchDetails.splice(batchIdx, 1);
    }
  }

  getTotalBatchQty(itemIdx: number, excludeIdx?: number): number {
    const batches = this.grnItems[itemIdx]?.batchDetails || [];
    return batches.reduce((sum: number, batch: any, idx: number) => {
      if (excludeIdx !== undefined && idx === excludeIdx) return sum;
      return sum + (batch.quantity || 0);
    }, 0);
  }

  validateBatchQty(itemIdx: number) {
    const totalBatchQty = this.getTotalBatchQty(itemIdx);
    const receivedQty = this.grnItems[itemIdx].receivedQuantity;
    if (totalBatchQty > receivedQty) {
      // Find which batch exceeds and adjust
      const excess = totalBatchQty - receivedQty;
      const batches = this.grnItems[itemIdx].batchDetails;
      for (let i = batches.length - 1; i >= 0 && excess > 0; i--) {
        const reduction = Math.min(batches[i].quantity, excess);
        batches[i].quantity -= reduction;
      }
    }
  }

  // Serial operations
  addSerialRow(itemIdx: number) {
    if (!this.grnItems[itemIdx].serialDetails) {
      this.grnItems[itemIdx].serialDetails = [];
    }
    this.grnItems[itemIdx].serialDetails.push({
      serialNumber: '',
      quantity: 0,
      expiryDate: '',
    });
  }

  removeSerialRow(itemIdx: number, serialIdx: number) {
    if (this.grnItems[itemIdx].serialDetails) {
      this.grnItems[itemIdx].serialDetails.splice(serialIdx, 1);
    }
  }

  getTotalSerialQty(itemIdx: number, excludeIdx?: number): number {
    const serials = this.grnItems[itemIdx]?.serialDetails || [];
    return serials.reduce((sum: number, serial: any, idx: number) => {
      if (excludeIdx !== undefined && idx === excludeIdx) return sum;
      return sum + (serial.quantity || 0);
    }, 0);
  }

  validateSerialQty(itemIdx: number) {
    const totalSerialQty = this.getTotalSerialQty(itemIdx);
    const receivedQty = this.grnItems[itemIdx].receivedQuantity;
    if (totalSerialQty > receivedQty) {
      // Find which serial exceeds and adjust
      const excess = totalSerialQty - receivedQty;
      const serials = this.grnItems[itemIdx].serialDetails;
      for (let i = serials.length - 1; i >= 0 && excess > 0; i--) {
        const reduction = Math.min(serials[i].quantity, excess);
        serials[i].quantity -= reduction;
      }
    }
  }

  hasQtyErrors(): boolean {
    return this.grnItems.some((item, idx) => {
      const batchQtyOk = this.getTotalBatchQty(idx) <= item.receivedQuantity;
      const serialQtyOk = this.getTotalSerialQty(idx) <= item.receivedQuantity;
      return !batchQtyOk || !serialQtyOk;
    });
  }

  submitGrn() {
    if (!this.po()) {
      this.errorMessage.set('PO not loaded. Please try again.');
      return;
    }
    
    if (this.isAdminOrManager && !this.selectedDistributorId) {
      this.errorMessage.set('Please select a distributor');
      return;
    }

    if (this.hasQtyErrors()) {
      this.errorMessage.set('Please fix batch/serial quantity errors. Total cannot exceed received quantity.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload: any = {
      purchaseOrderId: this.po().id,
      items: this.grnItems.map(item => ({
        poItemId: item.poItemId,
        itemId: item.itemId,
        receivedQuantity: item.receivedQuantity,
        originalQuantity: item.originalQuantity,
        unitPrice: item.unitPrice,
        batchDetails: item.batchDetails?.filter((b: any) => b.batchNumber && b.quantity > 0) || [],
        serialDetails: item.serialDetails?.filter((s: any) => s.serialNumber && s.quantity > 0) || [],
      })),
      remarks: this.remarks,
    };

    // Add distributorId if admin/manager
    if (this.isAdminOrManager && this.selectedDistributorId) {
      payload.distributorId = parseInt(String(this.selectedDistributorId), 10);
    }

    this.grnService.createGrn(payload).subscribe({
      next: (response: any) => {
        this.isSubmitting.set(false);
        this.successMessage.set('GRN created successfully! Redirecting to GRN list...');
        setTimeout(() => {
          this.router.navigate(['/grn']);
        }, 1500);
      },
      error: (err: any) => {
        console.error('Failed to create GRN:', err);
        this.isSubmitting.set(false);
        const errorMsg = err?.error?.message || err?.message || 'Failed to create GRN. Please try again.';
        this.errorMessage.set(errorMsg);
      },
    });
  }

  goBack() {
    this.router.navigate(['/in-ward']);
  }
}
