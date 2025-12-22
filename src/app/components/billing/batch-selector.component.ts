import { Component, Input, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface BatchOption {
  id?: string;
  batchNumber?: string;
  serialNumber?: string;
  quantity: number;
  expiryDate?: string;
  expiryStatus?: 'expired' | 'expiring_soon' | 'valid' | 'not_tracked';
}

@Component({
  selector: 'app-batch-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 space-y-3">
      <!-- Header with Search -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-bold text-amber-900">🎯 Available Batches ({{ batchesSignal().length }})</label>
          @if (selectedBatch()) {
            <span class="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">✅ Selected</span>
          }
        </div>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          placeholder="🔍 Filter by batch/serial number..."
          class="w-full px-3 py-2 text-sm border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
        />
      </div>

      <!-- Batch Selection Table - Always Visible -->
      @if (batchesSignal().length > 0) {
      <div class="border border-amber-300 rounded-lg overflow-hidden bg-white">
        <div class="overflow-y-auto max-h-64">
          <table class="w-full text-xs">
            <thead class="bg-amber-100 border-b-2 border-amber-300 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left font-bold text-amber-900 w-12">Select</th>
                <th class="px-3 py-2 text-left font-bold text-amber-900">Batch Number</th>
                <th class="px-3 py-2 text-left font-bold text-amber-900">Serial Number</th>
                <th class="px-3 py-2 text-center font-bold text-amber-900 w-16">Qty</th>
                <th class="px-3 py-2 text-left font-bold text-amber-900">Expiry Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-amber-100">
              @for (batch of filteredBatches(); track $index) {
              <tr
                (click)="selectBatch(batch)"
                [class.bg-green-100]="isSelected(batch)"
                [class.bg-orange-50]="!isSelected(batch) && batch.expiryStatus === 'expiring_soon'"
                [class.bg-red-50]="!isSelected(batch) && batch.expiryStatus === 'expired'"
                [class.hover:bg-amber-100]="!isSelected(batch) && batch.expiryStatus !== 'expiring_soon' && batch.expiryStatus !== 'expired'"
                class="cursor-pointer transition-colors"
              >
                <!-- Radio Button -->
                <td class="px-3 py-2 text-center">
                  <input
                    type="radio"
                    [checked]="isSelected(batch)"
                    (click)="$event.stopPropagation(); selectBatch(batch)"
                    class="h-4 w-4 cursor-pointer"
                  />
                </td>

                <!-- Batch Number -->
                <td class="px-3 py-2">
                  @if (batch.batchNumber) {
                    <span class="font-mono font-bold text-amber-900">{{ batch.batchNumber }}</span>
                  } @else {
                    <span class="text-gray-400">—</span>
                  }
                </td>

                <!-- Serial Number -->
                <td class="px-3 py-2">
                  @if (batch.serialNumber) {
                    <span class="font-mono font-bold text-blue-900">{{ batch.serialNumber }}</span>
                  } @else {
                    <span class="text-gray-400">—</span>
                  }
                </td>

                <!-- Quantity -->
                <td class="px-3 py-2 text-center">
                  <span class="inline-block bg-blue-100 text-blue-900 font-bold px-2 py-1 rounded text-xs">
                    {{ batch.quantity }}
                  </span>
                </td>

                <!-- Expiry Status -->
                <td class="px-3 py-2">
                  @if (batch.expiryDate) {
                    <div class="text-xs">
                      <div class="font-semibold text-gray-900">{{ batch.expiryDate | date: 'dd-MMM-yyyy' }}</div>
                      @if (batch.expiryStatus) {
                        <span
                          [class]="
                            batch.expiryStatus === 'expired'
                              ? 'text-red-700 font-bold'
                              : batch.expiryStatus === 'expiring_soon'
                              ? 'text-orange-700 font-bold'
                              : batch.expiryStatus === 'valid'
                              ? 'text-green-700 font-bold'
                              : 'text-gray-600'
                          "
                        >
                          @if (batch.expiryStatus === 'expired') { 🔴 Expired }
                          @else if (batch.expiryStatus === 'expiring_soon') { 🟡 Expiring Soon }
                          @else if (batch.expiryStatus === 'valid') { ✅ Valid }
                          @else { ⚪ Not Tracked }
                        </span>
                      }
                    </div>
                  } @else {
                    <span class="text-gray-400 text-xs">—</span>
                  }
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- No Results Message -->
        @if (filteredBatches().length === 0 && batchesSignal().length > 0) {
          <div class="text-center py-4 text-amber-700 text-sm font-medium bg-amber-50 border-t border-amber-200">
            🔍 No batches match "{{ searchQuery }}"
          </div>
        }
      </div>
      } @else {
        <div class="text-center py-8 text-amber-700 text-sm font-medium bg-white border border-amber-200 rounded-lg">
          📭 No batches available for this item
        </div>
      }

      <!-- Selected Batch Display -->
      @if (selectedBatch()) {
      <div class="bg-green-50 border-2 border-green-300 rounded-lg p-3">
        <div class="text-xs font-bold text-green-900 mb-2">✅ Selected Batch Details</div>
        <div class="grid grid-cols-2 gap-2 text-xs text-green-800">
          @if (selectedBatch()!.batchNumber) {
            <div>📦 <span class="font-mono font-bold">{{ selectedBatch()!.batchNumber }}</span></div>
          }
          @if (selectedBatch()!.serialNumber) {
            <div>🔢 <span class="font-mono font-bold">{{ selectedBatch()!.serialNumber }}</span></div>
          }
          <div>📊 Qty: <span class="font-bold">{{ selectedBatch()!.quantity }}</span></div>
          @if (selectedBatch()!.expiryDate) {
            <div>📅 {{ selectedBatch()!.expiryDate | date: 'dd-MMM-yyyy' }}</div>
          }
        </div>
      </div>
      }
    </div>
  `,
})
export class BatchSelectorComponent implements OnInit {
  @Input() batches: BatchOption[] = [];

  searchQuery = '';
  selectedBatch = signal<BatchOption | null>(null);
  batchesSignal = signal<BatchOption[]>([]);

  filteredBatches = computed(() => {
    const query = this.searchQuery.toLowerCase();
    if (!query) return this.batchesSignal();

    return this.batchesSignal().filter((batch) => {
      const batchMatch = batch.batchNumber?.toLowerCase().includes(query);
      const serialMatch = batch.serialNumber?.toLowerCase().includes(query);
      return batchMatch || serialMatch;
    });
  });

  ngOnInit() {
    this.batchesSignal.set(this.batches);
  }

  selectBatch(batch: BatchOption) {
    this.selectedBatch.set(batch);
  }

  isSelected(batch: BatchOption): boolean {
    const selected = this.selectedBatch();
    if (!selected) return false;
    return (
      selected.batchNumber === batch.batchNumber &&
      selected.serialNumber === batch.serialNumber
    );
  }

  getSelectedValue(): BatchOption | null {
    return this.selectedBatch();
  }

  clearSelection() {
    this.selectedBatch.set(null);
    this.searchQuery = '';
  }
}
