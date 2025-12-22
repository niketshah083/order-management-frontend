import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { InventoryService, InventoryItem } from '../../services/inventory.service';
import { ItemService, ApiItem } from '../../services/item.service';
import { BatchSerialService } from '../../services/batch-serial.service';
import { ModalComponent } from '../shared/ui/modal.component';

@Component({
  selector: 'app-inventory-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent],
  template: `
    <div class="bg-indigo-50 p-3 md:p-6 max-w-7xl mx-auto min-h-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Stock Inventory
          </h1>
          <p class="text-gray-500 text-sm mt-0.5">
            Manage your distributor inventory and stock levels
          </p>
        </div>

        <button
          (click)="openModal()"
          class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Item to Inventory
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div class="text-gray-600 text-sm font-medium">Total Items</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">{{ inventory().length }}</div>
        </div>
        <div class="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm bg-yellow-50">
          <div class="text-yellow-700 text-sm font-medium">Low Stock</div>
          <div class="text-2xl font-bold text-yellow-900 mt-1">{{ lowStockCount }}</div>
        </div>
        <div class="bg-white rounded-lg p-4 border border-red-200 shadow-sm bg-red-50">
          <div class="text-red-700 text-sm font-medium">Out of Stock</div>
          <div class="text-2xl font-bold text-red-900 mt-1">{{ outOfStockCount }}</div>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
        <!-- Download Sample & Upload Section -->
        <div class="flex flex-col sm:flex-row gap-2 mb-4 pb-4 border-b border-gray-200">
          <button
            (click)="downloadSampleInventory()"
            [disabled]="isDownloadingSample"
            class="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm whitespace-nowrap flex items-center justify-center gap-2"
          >
            <span>📥</span>
            {{ isDownloadingSample ? 'Downloading...' : 'Download Sample Excel' }}
          </button>
          <button
            (click)="uploadFileInput.click()"
            class="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm whitespace-nowrap flex items-center justify-center gap-2"
          >
            <span>📤</span>
            Upload Excel
          </button>
          <input
            #uploadFileInput
            type="file"
            accept=".xlsx,.xls"
            (change)="onFileSelected($event)"
            class="hidden"
          />
          @if (selectedFileName) {
            <div class="text-sm text-gray-600 self-center">
              Selected: <span class="font-semibold">{{ selectedFileName }}</span>
            </div>
          }
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row gap-2 items-end">
            <div class="flex-1">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search by item name..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
            <button
              (click)="performSearch()"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
            >
              Search
            </button>
            <button
              (click)="clearSearch()"
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
            >
              Clear
            </button>
          </div>

          <!-- Status Filter -->
          <div class="flex flex-wrap gap-2">
            <span class="text-sm font-medium text-gray-700 self-center">Filter by Status:</span>
            <button
              (click)="filterByStatus('all')"
              [class.bg-indigo-600]="selectedStatus() === 'all'"
              [class.text-white]="selectedStatus() === 'all'"
              [class.bg-gray-100]="selectedStatus() !== 'all'"
              [class.text-gray-800]="selectedStatus() !== 'all'"
              class="px-4 py-2 rounded-lg transition-colors font-medium text-sm border border-gray-300"
            >
              All Items
            </button>
            <button
              (click)="filterByStatus('in_stock')"
              [class.bg-green-600]="selectedStatus() === 'in_stock'"
              [class.text-white]="selectedStatus() === 'in_stock'"
              [class.bg-green-50]="selectedStatus() !== 'in_stock'"
              [class.text-green-800]="selectedStatus() !== 'in_stock'"
              class="px-4 py-2 rounded-lg transition-colors font-medium text-sm border border-green-300"
            >
              In Stock
            </button>
            <button
              (click)="filterByStatus('low_stock')"
              [class.bg-yellow-600]="selectedStatus() === 'low_stock'"
              [class.text-white]="selectedStatus() === 'low_stock'"
              [class.bg-yellow-50]="selectedStatus() !== 'low_stock'"
              [class.text-yellow-800]="selectedStatus() !== 'low_stock'"
              class="px-4 py-2 rounded-lg transition-colors font-medium text-sm border border-yellow-300"
            >
              Low Stock
            </button>
            <button
              (click)="filterByStatus('out_of_stock')"
              [class.bg-red-600]="selectedStatus() === 'out_of_stock'"
              [class.text-white]="selectedStatus() === 'out_of_stock'"
              [class.bg-red-50]="selectedStatus() !== 'out_of_stock'"
              [class.text-red-800]="selectedStatus() !== 'out_of_stock'"
              class="px-4 py-2 rounded-lg transition-colors font-medium text-sm border border-red-300"
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      <!-- Messages -->
      @if (errorMessage()) {
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-red-800 text-sm font-medium">Error</p>
            <p class="text-red-700 text-sm">{{ errorMessage() }}</p>
          </div>
        </div>
      }

      @if (successMessage()) {
        <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-green-700 text-sm">{{ successMessage() }}</p>
        </div>
      }

      <!-- Inventory Table -->
      <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-950/5">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Current Stock</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Reorder Level</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">📦 Batch No</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">🔢 Serial No</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">📅 Expiry</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (item of inventory(); track item.id) {
              <tr class="hover:bg-indigo-50/30 transition-colors">
                <td class="px-6 py-4 font-semibold text-gray-900">
                  <button (click)="toggleExpandItem(item.id)" class="text-indigo-600 hover:text-indigo-800 mr-2">{{ expandedItemId === item.id ? '▼' : '▶' }}</button>
                  {{ item.item?.name || 'N/A' }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ item.item?.unit || '-' }}</td>
                <td class="px-6 py-4 text-sm text-gray-600 text-right">
                  <span class="font-medium">{{ item.quantity }}</span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 text-right">{{ item.reorderLevel }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  @if (item.batchNumber) {
                    <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">{{ item.batchNumber }}</span>
                  } @else {
                    <span class="text-gray-400 text-xs">-</span>
                  }
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  @if (item.serialNumber) {
                    <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">{{ item.serialNumber }}</span>
                  } @else {
                    <span class="text-gray-400 text-xs">-</span>
                  }
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  @if (item.expiryDate) {
                    <span [ngClass]="{
                      'bg-red-100 text-red-800': isExpired(item.expiryDate),
                      'bg-amber-100 text-amber-800': !isExpired(item.expiryDate) && isExpiringSoon(item.expiryDate),
                      'bg-green-100 text-green-800': !isExpired(item.expiryDate) && !isExpiringSoon(item.expiryDate)
                    }" class="px-2 py-1 rounded text-xs font-medium">
                      {{ item.expiryDate | date:'MMM dd, yyyy' }}
                    </span>
                  } @else {
                    <span class="text-gray-400 text-xs">-</span>
                  }
                </td>
                <td class="px-6 py-4">
                  <span
                    [ngClass]="{
                      'bg-green-100 text-green-800': item.status === 'in_stock',
                      'bg-yellow-100 text-yellow-800': item.status === 'low_stock',
                      'bg-red-100 text-red-800': item.status === 'out_of_stock'
                    }"
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {{ item.status === 'in_stock' ? 'In Stock' : item.status === 'low_stock' ? 'Low Stock' : 'Out of Stock' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex gap-1 justify-end flex-wrap">
                    <button
                      (click)="editItem(item)"
                      class="text-blue-500 hover:text-blue-700 text-xs font-medium hover:bg-blue-50 px-2.5 py-1 rounded transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      (click)="deleteItem(item.id)"
                      class="text-red-500 hover:text-red-700 text-xs font-medium hover:bg-red-50 px-2.5 py-1 rounded transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
              
              @if (expandedItemId === item.id) {
              <tr class="bg-indigo-25">
                <td colspan="9" class="px-6 py-4">
                  <div class="grid grid-cols-2 gap-6">
                    <!-- Batch Details -->
                    <div>
                      <h4 class="font-semibold text-gray-900 mb-2">📦 Batch Details</h4>
                      @if (batchDetails().length > 0) {
                        <table class="w-full text-xs border border-gray-300 rounded">
                          <thead class="bg-purple-100">
                            <tr>
                              <th class="px-3 py-2 text-left font-medium">Batch No</th>
                              <th class="px-3 py-2 text-right font-medium">Qty</th>
                              <th class="px-3 py-2 text-left font-medium">Expiry</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-gray-200">
                            @for (batch of batchDetails(); track batch.id) {
                            <tr class="hover:bg-purple-50">
                              <td class="px-3 py-2">{{ batch.batchNumber }}</td>
                              <td class="px-3 py-2 text-right font-medium">{{ batch.quantity }}</td>
                              <td class="px-3 py-2">
                                @if (batch.expiryDate) {
                                  <span [ngClass]="{
                                    'text-red-600 font-bold': isExpired(batch.expiryDate),
                                    'text-amber-600': !isExpired(batch.expiryDate) && isExpiringSoon(batch.expiryDate),
                                    'text-green-600': !isExpired(batch.expiryDate) && !isExpiringSoon(batch.expiryDate)
                                  }">{{ batch.expiryDate | date:'MMM dd, yyyy' }}</span>
                                } @else {
                                  <span class="text-gray-400">-</span>
                                }
                              </td>
                            </tr>
                            }
                          </tbody>
                        </table>
                      } @else {
                        <p class="text-gray-500 text-sm">No batch details</p>
                      }
                    </div>

                    <!-- Serial Details -->
                    <div>
                      <h4 class="font-semibold text-gray-900 mb-2">🔢 Serial Details</h4>
                      @if (serialDetails().length > 0) {
                        <table class="w-full text-xs border border-gray-300 rounded">
                          <thead class="bg-blue-100">
                            <tr>
                              <th class="px-3 py-2 text-left font-medium">Serial No</th>
                              <th class="px-3 py-2 text-right font-medium">Qty</th>
                              <th class="px-3 py-2 text-left font-medium">Expiry</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-gray-200">
                            @for (serial of serialDetails(); track serial.id) {
                            <tr class="hover:bg-blue-50">
                              <td class="px-3 py-2">{{ serial.serialNumber }}</td>
                              <td class="px-3 py-2 text-right font-medium">{{ serial.quantity }}</td>
                              <td class="px-3 py-2">
                                @if (serial.expiryDate) {
                                  <span [ngClass]="{
                                    'text-red-600 font-bold': isExpired(serial.expiryDate),
                                    'text-amber-600': !isExpired(serial.expiryDate) && isExpiringSoon(serial.expiryDate),
                                    'text-green-600': !isExpired(serial.expiryDate) && !isExpiringSoon(serial.expiryDate)
                                  }">{{ serial.expiryDate | date:'MMM dd, yyyy' }}</span>
                                } @else {
                                  <span class="text-gray-400">-</span>
                                }
                              </td>
                            </tr>
                            }
                          </tbody>
                        </table>
                      } @else {
                        <p class="text-gray-500 text-sm">No serial details</p>
                      }
                    </div>
                  </div>
                </td>
              </tr>
              }
              
              } @if (inventory().length === 0) {
              <tr>
                <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                  No inventory items found
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal -->
      <app-modal
        [isOpen]="isModalOpen()"
        [title]="editingItem ? 'Edit Stock' : 'Add Item to Inventory'"
        (close)="closeModal()"
      >
        <form [formGroup]="inventoryForm" (ngSubmit)="onSubmit()" class="space-y-4">
          @if (editingItem) {
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-xs text-blue-600 font-medium">Editing Item</p>
              <p class="text-sm font-semibold text-blue-900 mt-1">{{ editingItem.item?.name }} ({{ editingItem.item?.unit }})</p>
            </div>
          } @else {
            <div>
              <label class="text-sm font-semibold text-gray-700">Select Item *</label>
              <select
                formControlName="itemId"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">Choose an item</option>
                @for (item of items(); track item.id) {
                  <option [value]="item.id">{{ item.name }} ({{ item.unit }})</option>
                }
              </select>
              @if (getFieldError('itemId')) {
                <p class="text-red-600 text-xs mt-1">{{ getFieldError('itemId') }}</p>
              }
            </div>
          }

          <div>
            <label class="text-sm font-semibold text-gray-700">Current Stock *</label>
            <input
              type="number"
              formControlName="quantity"
              step="0.01"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Enter quantity"
            />
            @if (getFieldError('quantity')) {
              <p class="text-red-600 text-xs mt-1">{{ getFieldError('quantity') }}</p>
            }
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700">Reorder Level</label>
            <input
              type="number"
              formControlName="reorderLevel"
              step="0.01"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Minimum stock level (default: 10)"
            />
          </div>

          <!-- Batch Details Section (Only if item tracks batches) -->
          @if (getSelectedItem()?.hasBatchTracking) {
          <div class="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-lg">📦</span>
                <h4 class="font-semibold text-purple-900">Batch Details</h4>
              </div>
              <button
                type="button"
                (click)="addBatchEntry()"
                class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition"
              >
                + Add Batch
              </button>
            </div>
            
            @if (!batchEntries() || batchEntries().length === 0) {
              <p class="text-xs text-purple-700 italic">No batch entries yet.</p>
            } @else {
              <div class="space-y-2">
                @for (batch of batchEntries(); track $index; let batchIdx = $index) {
                  <div class="grid grid-cols-12 gap-2 items-end bg-white p-3 rounded border border-purple-200">
                    <div class="col-span-3">
                      <label class="text-xs font-medium text-gray-600">Batch No</label>
                      <input
                        type="text"
                        [(ngModel)]="batch.batchNumber"
                        [ngModelOptions]="{standalone: true}"
                        placeholder="Batch No"
                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div class="col-span-2">
                      <label class="text-xs font-medium text-gray-600">Qty</label>
                      <input
                        type="number"
                        [(ngModel)]="batch.quantity"
                        [ngModelOptions]="{standalone: true}"
                        [min]="0"
                        [max]="inventoryForm.get('quantity')?.value || 0"
                        placeholder="0"
                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div class="col-span-4">
                      <label class="text-xs font-medium text-gray-600">Expiry Date</label>
                      <input
                        type="date"
                        [(ngModel)]="batch.expiryDate"
                        [ngModelOptions]="{standalone: true}"
                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      (click)="removeBatchEntry($index)"
                      class="col-span-3 text-center px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition"
                    >
                      ✕ Remove
                    </button>
                  </div>
                }
                <div class="text-xs text-gray-600 mt-2">
                  Total: <span class="font-semibold">{{ getTotalBatchQty() }}</span> / {{ inventoryForm.get('quantity')?.value || 0 }}
                  @if (getTotalBatchQty() > (inventoryForm.get('quantity')?.value || 0)) {
                    <span class="text-red-600 font-bold">❌ Exceeds stock!</span>
                  }
                </div>
              </div>
            }
          </div>
          }

          <!-- Serial Details Section (Only if item tracks serials) -->
          @if (getSelectedItem()?.hasSerialTracking) {
          <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-lg">🔢</span>
                <h4 class="font-semibold text-blue-900">Serial Numbers</h4>
              </div>
              <button
                type="button"
                (click)="addSerialEntry()"
                class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition"
              >
                + Add Serial
              </button>
            </div>
            
            @if (!serialEntries() || serialEntries().length === 0) {
              <p class="text-xs text-blue-700 italic">No serial entries yet.</p>
            } @else {
              <div class="space-y-2">
                @for (serial of serialEntries(); track $index; let serialIdx = $index) {
                  <div class="grid grid-cols-12 gap-2 items-end bg-white p-3 rounded border border-blue-200">
                    <div class="col-span-4">
                      <label class="text-xs font-medium text-gray-600">Serial No</label>
                      <input
                        type="text"
                        [(ngModel)]="serial.serialNumber"
                        [ngModelOptions]="{standalone: true}"
                        placeholder="Serial No"
                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div class="col-span-2">
                      <label class="text-xs font-medium text-gray-600">Qty</label>
                      <input
                        type="number"
                        [(ngModel)]="serial.quantity"
                        [ngModelOptions]="{standalone: true}"
                        [min]="0"
                        [max]="inventoryForm.get('quantity')?.value || 0"
                        placeholder="0"
                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div class="col-span-4">
                      <label class="text-xs font-medium text-gray-600">Expiry Date</label>
                      <input
                        type="date"
                        [(ngModel)]="serial.expiryDate"
                        [ngModelOptions]="{standalone: true}"
                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      (click)="removeSerialEntry($index)"
                      class="col-span-2 text-center px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition"
                    >
                      ✕ Remove
                    </button>
                  </div>
                }
                <div class="text-xs text-gray-600 mt-2">
                  Total: <span class="font-semibold">{{ getTotalSerialQty() }}</span> / {{ inventoryForm.get('quantity')?.value || 0 }}
                  @if (getTotalSerialQty() > (inventoryForm.get('quantity')?.value || 0)) {
                    <span class="text-red-600 font-bold">❌ Exceeds stock!</span>
                  }
                </div>
              </div>
            }
          </div>
          }

          <div>
            <label class="text-sm font-semibold text-gray-700">Notes</label>
            <textarea
              formControlName="notes"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Add any notes about this item"
              rows="3"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              (click)="closeModal()"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="inventoryForm.invalid"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-gray-400 transition-colors"
            >
              {{ editingItem ? 'Update Stock' : 'Add Item' }}
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class InventoryMasterComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private itemService = inject(ItemService);
  private batchSerialService = inject(BatchSerialService);
  private fb = inject(FormBuilder);

  inventory = signal<any[]>([]);
  allInventory = signal<any[]>([]);
  items = signal<ApiItem[]>([]);
  isModalOpen = signal(false);
  searchQuery = '';
  editingItem: any | null = null;
  errorMessage = signal('');
  successMessage = signal('');
  lowStockCount = 0;
  outOfStockCount = 0;
  selectedStatus = signal<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  isDownloadingSample = false;
  selectedFileName: string | null = null;
  isUploading = false;
  serialCount: number | null = null;
  batchCsvData: any[] = [];
  
  // Batch/Serial tracking
  batchDetails = signal<any[]>([]);
  serialDetails = signal<any[]>([]);
  expandedItemId: number | null = null;
  batchEntries = signal<Array<{batchNumber: string, quantity: number, expiryDate: string}>>([]);
  serialEntries = signal<Array<{serialNumber: string, quantity: number, expiryDate: string}>>([]);
  
  // Serial search
  searchSerialQuery = signal('');
  availableSerials = signal<Array<{serialNumber: string, batchNumber?: string, quantity: number, expiryDate?: string}>>([]);
  selectedSerialIndex: number | null = null;
  tempSerialQty = 1;

  inventoryForm = this.fb.group({
    itemId: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    reorderLevel: [10, [Validators.min(0)]],
    notes: [''],
    batchNumber: [''],
    serialNumber: [''],
    expiryDate: [''],
  });

  ngOnInit() {
    this.loadInventory();
    this.loadItems();
  }

  loadInventory() {
    this.inventoryService.getInventory().subscribe({
      next: (res) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.allInventory.set(res.data);
          this.inventory.set(res.data);
          this.lowStockCount = res.data.filter(i => i.status === 'low_stock').length;
          this.outOfStockCount = res.data.filter(i => i.status === 'out_of_stock').length;
        } else {
          this.allInventory.set([]);
          this.inventory.set([]);
        }
      },
      error: (err) => {
        console.error('Failed to load inventory', err);
        this.allInventory.set([]);
        this.inventory.set([]);
      },
    });
  }

  loadItems() {
    this.itemService.getItems().subscribe({
      next: (res) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.items.set(res.data);
        } else {
          this.items.set([]);
        }
      },
      error: (err) => {
        console.error('Failed to load items', err);
        this.items.set([]);
      },
    });
  }

  performSearch() {
    this.inventoryService.getInventory(this.searchQuery || undefined).subscribe({
      next: (res) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.allInventory.set(res.data);
          this.applyFilters();
        }
      },
      error: (err) => console.error('Search failed', err),
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.selectedStatus.set('all');
    this.loadInventory();
  }

  filterByStatus(status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') {
    this.selectedStatus.set(status);
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.allInventory();
    
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(item => item.status === this.selectedStatus());
    }
    
    this.inventory.set(filtered);
  }

  getSelectedItem(): any {
    const itemId = this.inventoryForm.get('itemId')?.value;
    if (!itemId) return null;
    return this.items().find((i: any) => i.id === parseInt(itemId, 10));
  }

  getTotalBatchQty(): number {
    return this.batchEntries().reduce((sum, batch) => sum + (batch.quantity || 0), 0);
  }

  getTotalSerialQty(): number {
    return this.serialEntries().reduce((sum, serial) => sum + (serial.quantity || 0), 0);
  }

  openModal() {
    this.inventoryForm.reset({ reorderLevel: 10 });
    this.editingItem = null;
    this.serialCount = null;
    this.batchEntries.set([]);
    this.serialEntries.set([]);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isModalOpen.set(true);
  }

  editItem(item: any) {
    this.editingItem = item;
    this.inventoryForm.patchValue({
      itemId: item.itemId,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
      notes: item.notes,
      batchNumber: item.batchNumber || '',
      serialNumber: item.serialNumber || '',
      expiryDate: item.expiryDate || '',
    });
    this.serialCount = null;
    this.searchSerialQuery.set('');
    this.availableSerials.set([]);
    this.selectedSerialIndex = null;
    this.tempSerialQty = 1;
    this.loadAvailableSerials(item.itemId);
    this.inventoryForm.get('itemId')?.disable();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingItem = null;
    this.searchSerialQuery.set('');
    this.availableSerials.set([]);
    this.selectedSerialIndex = null;
    this.inventoryForm.get('itemId')?.enable();
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  loadAvailableSerials(itemId: number) {
    const item = this.allInventory().filter(inv => inv.itemId === itemId);
    const serials: any[] = [];
    item.forEach((inv: any) => {
      if (inv.serialNumber) {
        serials.push({
          serialNumber: inv.serialNumber,
          batchNumber: inv.batchNumber,
          quantity: inv.quantity,
          expiryDate: inv.expiryDate,
        });
      }
    });
    this.availableSerials.set(serials);
  }

  getFilteredSerials() {
    const query = this.searchSerialQuery().toLowerCase();
    return this.availableSerials().filter(s => 
      s.serialNumber.toLowerCase().includes(query) ||
      (s.batchNumber && s.batchNumber.toLowerCase().includes(query))
    );
  }

  selectSerialForEdit(index: number) {
    this.selectedSerialIndex = index;
    this.tempSerialQty = 1;
  }

  increaseSerialQty(amount: number = 1) {
    this.tempSerialQty = Math.max(1, this.tempSerialQty + amount);
  }

  decreaseSerialQty(amount: number = 1) {
    this.tempSerialQty = Math.max(1, this.tempSerialQty - amount);
  }

  addSelectedSerial() {
    if (this.selectedSerialIndex === null) return;
    
    const selectedSerial = this.getFilteredSerials()[this.selectedSerialIndex];
    if (!selectedSerial) return;
    
    const serial = {
      serialNumber: selectedSerial.serialNumber,
      quantity: this.tempSerialQty,
      expiryDate: selectedSerial.expiryDate || '',
    };
    
    // Check if serial already exists and update quantity
    const existingIndex = this.serialEntries().findIndex(
      s => s.serialNumber === serial.serialNumber
    );
    if (existingIndex >= 0) {
      this.serialEntries.update(entries => {
        const updated = [...entries];
        updated[existingIndex].quantity += serial.quantity;
        return updated;
      });
    } else {
      this.serialEntries.update(entries => [...entries, serial]);
    }
    
    // Reset
    this.searchSerialQuery.set('');
    this.selectedSerialIndex = null;
    this.tempSerialQty = 1;
  }

  getFieldError(fieldName: string): string {
    const field = this.inventoryForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }
    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['min']) return `${fieldName} must be a positive number`;
    return '';
  }

  addBatchEntry() {
    const batch = {
      batchNumber: this.inventoryForm.get('batchNumber')?.value?.trim() || '',
      quantity: this.inventoryForm.get('quantity')?.value || 0,
      expiryDate: this.inventoryForm.get('expiryDate')?.value || '',
    };
    if (batch.batchNumber && batch.quantity > 0) {
      this.batchEntries.update(entries => [...entries, batch]);
      this.inventoryForm.patchValue({ batchNumber: '', expiryDate: '' });
    }
  }

  removeBatchEntry(index: number) {
    this.batchEntries.update(entries => entries.filter((_, i) => i !== index));
  }

  addSerialEntry() {
    const serial = {
      serialNumber: this.inventoryForm.get('serialNumber')?.value?.trim() || '',
      quantity: this.serialCount || 1,
      expiryDate: this.inventoryForm.get('expiryDate')?.value || '',
    };
    if (serial.serialNumber && serial.quantity > 0) {
      // Check if serial already exists and update quantity
      const existingIndex = this.serialEntries().findIndex(
        s => s.serialNumber === serial.serialNumber
      );
      if (existingIndex >= 0) {
        this.serialEntries.update(entries => {
          const updated = [...entries];
          updated[existingIndex].quantity += serial.quantity;
          return updated;
        });
      } else {
        this.serialEntries.update(entries => [...entries, serial]);
      }
      this.inventoryForm.patchValue({ serialNumber: '', expiryDate: '' });
      this.serialCount = null;
    }
  }

  removeSerialEntry(index: number) {
    this.serialEntries.update(entries => entries.filter((_, i) => i !== index));
  }

  onSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.inventoryForm.invalid) {
      this.errorMessage.set('Please fill in all required fields');
      return;
    }

    const formValue = this.inventoryForm.getRawValue();
    const quantity = formValue.quantity ?? 0;
    const reorderLevel = formValue.reorderLevel ?? 10;
    const itemId = formValue.itemId ?? 0;
    const notes = formValue.notes || undefined;

    // Use array format if batch/serial entries exist
    const batchDetails = this.batchEntries().length > 0 ? this.batchEntries() : undefined;
    const serialDetails = this.serialEntries().length > 0 ? this.serialEntries() : undefined;

    if (this.editingItem) {
      // For editing, use simple update (legacy)
      const batchNumber = formValue.batchNumber?.trim() || undefined;
      const serialNumber = formValue.serialNumber?.trim() || undefined;
      const expiryDate = formValue.expiryDate || undefined;
      
      this.inventoryService
        .updateInventoryItem(
          this.editingItem.id,
          quantity,
          reorderLevel,
          notes,
          batchNumber,
          serialNumber,
          expiryDate,
        )
        .subscribe({
          next: () => {
            this.successMessage.set('Stock updated successfully');
            setTimeout(() => {
              this.loadInventory();
              this.closeModal();
            }, 1000);
          },
          error: (err) => {
            const errorMsg = err.error?.error || err.error?.message || 'Failed to update stock';
            this.errorMessage.set(errorMsg);
          },
        });
    } else {
      // For new items, use array format if batch/serial exist
      if (batchDetails || serialDetails) {
        this.inventoryService
          .addInventoryWithBatchSerials(
            Number(itemId),
            quantity,
            reorderLevel,
            notes,
            batchDetails,
            serialDetails,
          )
          .subscribe({
            next: () => {
              this.successMessage.set('Item added to inventory successfully');
              this.batchEntries.set([]);
              this.serialEntries.set([]);
              setTimeout(() => {
                this.loadInventory();
                this.closeModal();
              }, 1000);
            },
            error: (err) => {
              const errorMsg = err.error?.error || err.error?.message || 'Failed to add item';
              this.errorMessage.set(errorMsg);
            },
          });
      } else {
        // Fall back to legacy format
        const batchNumber = formValue.batchNumber?.trim() || undefined;
        const serialNumber = formValue.serialNumber?.trim() || undefined;
        const expiryDate = formValue.expiryDate || undefined;
        
        this.inventoryService
          .addInventoryItem(
            Number(itemId),
            quantity,
            reorderLevel,
            notes,
            batchNumber,
            serialNumber,
            expiryDate,
          )
          .subscribe({
            next: () => {
              this.successMessage.set('Item added to inventory successfully');
              setTimeout(() => {
                this.loadInventory();
                this.closeModal();
              }, 1000);
            },
            error: (err) => {
              const errorMsg = err.error?.error || err.error?.message || 'Failed to add item';
              this.errorMessage.set(errorMsg);
            },
          });
      }
    }
  }

  toggleExpandItem(itemId: number) {
    if (this.expandedItemId === itemId) {
      this.expandedItemId = null;
    } else {
      this.expandedItemId = itemId;
      this.loadBatchSerialDetails(itemId);
    }
  }

  loadBatchSerialDetails(inventoryId: number) {
    // Load batch and serial details
    this.inventoryService.getBatchDetails(inventoryId).subscribe({
      next: (res) => {
        this.batchDetails.set(res.data || []);
      },
      error: () => this.batchDetails.set([]),
    });

    this.inventoryService.getSerialDetails(inventoryId).subscribe({
      next: (res) => {
        this.serialDetails.set(res.data || []);
      },
      error: () => this.serialDetails.set([]),
    });
  }

  deleteItem(id: string) {
    if (confirm('Are you sure you want to remove this item from inventory?')) {
      this.inventoryService.deleteInventoryItem(id).subscribe({
        next: () => {
          this.successMessage.set('Item removed from inventory');
          setTimeout(() => this.loadInventory(), 1000);
        },
        error: (err) => this.errorMessage.set('Failed to delete item'),
      });
    }
  }

  isExpired(expiryDate: string): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  }

  isExpiringSoon(expiryDate: string): boolean {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }

  viewBatches(item: any) {
    if (!item.id) {
      this.errorMessage.set('Invalid inventory item');
      return;
    }
    this.batchSerialService.getBatchDetails(item.id).subscribe({
      next: (res) => {
        const batches = res.data || [];
        alert(`📦 Batch Details for ${item.item?.name}\n\nTotal Batches: ${batches.length}\n\n${
          batches.map((b: any) => `• ${b.batchNumber}: ${b.quantity} units${b.expiryDate ? ` (Expires: ${b.expiryDate})` : ''}`).join('\n')
        }`);
      },
      error: (err) => this.errorMessage.set('Failed to load batch details'),
    });
  }

  viewSerials(item: any) {
    if (!item.id) {
      this.errorMessage.set('Invalid inventory item');
      return;
    }
    this.batchSerialService.getSerialDetails(item.id).subscribe({
      next: (res) => {
        const serials = res.data || [];
        alert(`🔢 Serial Numbers for ${item.item?.name}\n\nTotal Serials: ${serials.length}\n\n${
          serials.map((s: any) => `• ${s.serialNumber}${s.expiryDate ? ` (Expires: ${s.expiryDate})` : ''}`).join('\n')
        }`);
      },
      error: (err) => this.errorMessage.set('Failed to load serial details'),
    });
  }

  downloadSampleInventory() {
    this.isDownloadingSample = true;
    try {
      this.inventoryService.downloadSampleInventory();
      this.successMessage.set('Sample inventory template downloaded!');
    } catch (error) {
      this.errorMessage.set('Failed to download sample inventory');
    } finally {
      this.isDownloadingSample = false;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      if (!confirm(`Upload "${file.name}"? This will create/update inventory items.`)) {
        this.selectedFileName = null;
        return;
      }

      this.isUploading = true;
      this.inventoryService.bulkImportInventory(file).subscribe({
        next: (response: any) => {
          const result = response.data;
          this.successMessage.set(
            `✅ Import completed! Success: ${result.success}, Failed: ${result.failed}`
          );
          if (result.errors && result.errors.length > 0) {
            console.warn('Import errors:', result.errors);
          }
          setTimeout(() => {
            this.loadInventory();
            this.selectedFileName = null;
          }, 1500);
        },
        error: (err) => {
          const errorMsg = err.error?.error || err.error?.message || 'Failed to import inventory';
          this.errorMessage.set(errorMsg);
          this.selectedFileName = null;
        },
        complete: () => {
          this.isUploading = false;
        },
      });
    }
  }

  onBatchCsvSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const csv = e.target.result;
        const lines = csv.split('\n').filter((line: string) => line.trim());
        const batches: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const [batchNumber, serialNumber, expiryDate] = lines[i].split(',').map((col: string) => col.trim());
          if (batchNumber) {
            batches.push({
              batchNumber,
              serialNumber: serialNumber || null,
              expiryDate: expiryDate || null,
            });
          }
        }

        if (batches.length > 0) {
          this.successMessage.set(`✅ Loaded ${batches.length} batch entries from CSV`);
          console.log('Batch data loaded:', batches);
        } else {
          this.errorMessage.set('❌ No valid batch entries found in CSV');
        }
      };
      reader.readAsText(file);
    }
  }
}
