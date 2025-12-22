import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../shared/ui/modal.component';

export interface BatchSerialEntry {
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
}

@Component({
  selector: 'app-batch-serial-input',
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen()" (close)="cancel()">
      <div class="p-6 max-w-2xl">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">📦 Add {{ trackingType() }}</h2>
        <p class="text-sm text-gray-600 mb-6">
          You need to add {{ quantity() }} individual {{ trackingType().toLowerCase() }} for <strong>{{ itemName() }}</strong>
        </p>

        <!-- Tab Selection -->
        <div class="flex gap-2 mb-6 border-b border-gray-200">
          <button
            type="button"
            (click)="setMode('manual')"
            [class.border-indigo-600]="mode() === 'manual'"
            [class.text-indigo-600]="mode() === 'manual'"
            class="pb-2 px-4 font-semibold text-sm border-b-2 border-transparent transition-colors"
          >
            ✏️ Manual Entry
          </button>
          <button
            type="button"
            (click)="setMode('bulk')"
            [class.border-indigo-600]="mode() === 'bulk'"
            [class.text-indigo-600]="mode() === 'bulk'"
            class="pb-2 px-4 font-semibold text-sm border-b-2 border-transparent transition-colors"
          >
            📤 Bulk Upload (CSV)
          </button>
        </div>

        <!-- Manual Entry Tab -->
        @if (mode() === 'manual') {
        <div class="mb-6">
          <div class="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-3">
            @for (entry of entries; let i = $index; track i) {
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label class="text-xs font-semibold text-gray-700 mb-1 block">Unit {{ i + 1 }}</label>
                @if (hasBatchTracking()) {
                <input
                  type="text"
                  [(ngModel)]="entries[i].batchNumber"
                  placeholder="Batch No"
                  class="w-full px-2 py-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                />
                }
                @if (hasSerialTracking()) {
                <input
                  type="text"
                  [(ngModel)]="entries[i].serialNumber"
                  placeholder="Serial No"
                  class="w-full px-2 py-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 mt-1"
                />
                }
              </div>
              @if (hasExpiryDate()) {
              <div>
                <label class="text-xs font-semibold text-gray-700 mb-1 block">Expiry</label>
                <input
                  type="date"
                  [(ngModel)]="entries[i].expiryDate"
                  class="w-full px-2 py-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              }
            </div>
            }
          </div>

          <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            📝 Fill in all {{ trackingType().toLowerCase() }} numbers above. Empty fields will be skipped.
          </div>
        </div>
        }

        <!-- Bulk Upload Tab -->
        @if (mode() === 'bulk') {
        <div class="mb-6 space-y-4">
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p class="font-semibold mb-2">📋 CSV Format:</p>
            <p class="font-mono text-xs mb-2">One entry per line. Example:</p>
            <p class="font-mono text-xs text-blue-600">batch1{{ hasSerialTracking() ? ',serial1' : '' }}{{ hasExpiryDate() ? ',2025-12-31' : '' }}</p>
            <p class="text-xs mt-2">Paste {{ quantity() }} lines in the format above.</p>
          </div>

          <textarea
            [(ngModel)]="csvInput"
            rows="10"
            placeholder="Paste your data here..."
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
          ></textarea>

          <button
            type="button"
            (click)="parseBulkData()"
            class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors"
          >
            📤 Parse Data
          </button>

          @if (bulkParseMessage()) {
          <div [ngClass]="bulkParseError() ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'"
            class="p-3 border rounded-lg text-sm">
            {{ bulkParseMessage() }}
          </div>
          }
        </div>
        }

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            (click)="submit()"
            class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
          >
            ✅ Add Items
          </button>
          <button
            type="button"
            (click)="cancel()"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </app-modal>
  `,
})
export class BatchSerialInputComponent implements OnInit {
  isOpen = signal(false);
  mode = signal<'manual' | 'bulk'>('manual');
  quantity = signal(0);
  itemName = signal('');
  hasBatchTracking = signal(false);
  hasSerialTracking = signal(false);
  hasExpiryDate = signal(false);
  trackingType = signal('');

  entries: BatchSerialEntry[] = [];
  csvInput = '';
  bulkParseMessage = signal('');
  bulkParseError = signal(false);

  onSubmit?: (entries: BatchSerialEntry[]) => void;
  onCancel?: () => void;

  ngOnInit() {}

  open(config: {
    quantity: number;
    itemName: string;
    hasBatch: boolean;
    hasSerial: boolean;
    hasExpiry: boolean;
    onSubmit: (entries: BatchSerialEntry[]) => void;
    onCancel: () => void;
  }) {
    this.quantity.set(config.quantity);
    this.itemName.set(config.itemName);
    this.hasBatchTracking.set(config.hasBatch);
    this.hasSerialTracking.set(config.hasSerial);
    this.hasExpiryDate.set(config.hasExpiry);
    this.onSubmit = config.onSubmit;
    this.onCancel = config.onCancel;

    const types: string[] = [];
    if (config.hasBatch) types.push('Batch Numbers');
    if (config.hasSerial) types.push('Serial Numbers');
    if (config.hasExpiry) types.push('Expiry Dates');
    this.trackingType.set(types.join(' & '));

    this.entries = Array(config.quantity).fill(null).map(() => ({}));
    this.csvInput = '';
    this.bulkParseMessage.set('');
    this.bulkParseError.set(false);
    this.mode.set('manual');

    this.isOpen.set(true);
  }

  setMode(newMode: 'manual' | 'bulk') {
    this.mode.set(newMode);
  }

  parseBulkData() {
    const lines = this.csvInput.trim().split('\n').filter(l => l.trim());

    if (lines.length !== this.quantity()) {
      this.bulkParseError.set(true);
      this.bulkParseMessage.set(`❌ Expected ${this.quantity()} lines, got ${lines.length}`);
      return;
    }

    const newEntries: BatchSerialEntry[] = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      const entry: BatchSerialEntry = {};

      let partIndex = 0;

      if (this.hasBatchTracking()) {
        entry.batchNumber = parts[partIndex] || undefined;
        partIndex++;
      }

      if (this.hasSerialTracking()) {
        entry.serialNumber = parts[partIndex] || undefined;
        partIndex++;
      }

      if (this.hasExpiryDate()) {
        entry.expiryDate = parts[partIndex] || undefined;
        partIndex++;
      }

      newEntries.push(entry);
    }

    this.entries = newEntries;
    this.bulkParseError.set(false);
    this.bulkParseMessage.set(`✅ Successfully parsed ${newEntries.length} entries!`);
  }

  submit() {
    const validEntries = this.entries.filter(e => {
      return (this.hasBatchTracking() && e.batchNumber) ||
             (this.hasSerialTracking() && e.serialNumber) ||
             (this.hasExpiryDate() && e.expiryDate);
    });

    if (validEntries.length === 0) {
      alert(`Please add at least one ${this.trackingType().toLowerCase()}`);
      return;
    }

    if (this.onSubmit) {
      this.onSubmit(validEntries);
    }

    this.isOpen.set(false);
  }

  cancel() {
    if (this.onCancel) {
      this.onCancel();
    }
    this.isOpen.set(false);
  }
}
