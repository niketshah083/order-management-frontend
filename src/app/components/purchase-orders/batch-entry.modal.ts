import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-batch-entry-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen()" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex justify-between items-center">
          <h2 class="text-lg font-bold">📦 Batch Details Required</h2>
          <button (click)="close()" class="text-white hover:bg-purple-800 p-1 rounded">✕</button>
        </div>

        <div class="p-6">
          <div class="space-y-4">
            <div *ngFor="let item of requiredItems(); let i = index" class="border rounded-lg p-4 bg-gray-50">
              <p class="font-semibold text-gray-800 mb-3">{{ item.item?.name }} (Qty: {{ item.quantity }})</p>
              
              <div class="grid grid-cols-3 gap-3">
                <div *ngIf="item.item?.hasBatchTracking">
                  <label class="text-xs font-semibold text-gray-600">📦 Batch No *</label>
                  <input 
                    type="text" 
                    [(ngModel)]="entries[i].batchNumber"
                    placeholder="BATCH-001"
                    class="w-full px-3 py-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div *ngIf="item.item?.hasSerialTracking">
                  <label class="text-xs font-semibold text-gray-600">🔢 Serial No</label>
                  <input 
                    type="text" 
                    [(ngModel)]="entries[i].serialNumber"
                    placeholder="Optional"
                    class="w-full px-3 py-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div *ngIf="item.item?.hasExpiryDate">
                  <label class="text-xs font-semibold text-gray-600">📅 Expiry *</label>
                  <input 
                    type="date" 
                    [(ngModel)]="entries[i].expiryDate"
                    class="w-full px-3 py-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3 justify-end pt-4 border-t mt-4">
            <button 
              (click)="close()"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
            >
              Cancel
            </button>
            <button 
              (click)="save()"
              [disabled]="isLoading()"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
            >
              {{ isLoading() ? 'Saving...' : '✓ Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BatchEntryModalComponent {
  private http = inject(HttpClient);
  
  isOpen = signal(false);
  isLoading = signal(false);
  poId = signal<number | null>(null);
  poItems = signal<any[]>([]);
  entries: any[] = [];

  requiredItems() {
    return this.poItems().filter(item => 
      item.item?.hasBatchTracking || item.item?.hasSerialTracking || item.item?.hasExpiryDate
    );
  }

  open(poId: number, poItems: any[]) {
    this.poId.set(poId);
    this.poItems.set(poItems);
    const required = this.requiredItems();
    this.entries = required.map(item => ({
      itemId: item.itemId,
      batchNumber: '',
      serialNumber: '',
      expiryDate: ''
    }));
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  save() {
    const required = this.requiredItems();
    const errors: string[] = [];

    this.entries.forEach((e, i) => {
      const item = required[i];
      if (item.item?.hasBatchTracking && !e.batchNumber) errors.push(`Batch #${i+1}: Batch No required`);
      if (item.item?.hasExpiryDate && !e.expiryDate) errors.push(`Batch #${i+1}: Expiry required`);
    });

    if (errors.length > 0) {
      alert('Please fill required fields:\n' + errors.join('\n'));
      return;
    }

    this.isLoading.set(true);
    this.http.post(`/purchase-orders/${this.poId()}/batch-details`, { 
      batchDetails: this.entries 
    }).subscribe({
      next: () => {
        alert('✓ Batch details saved');
        this.close();
        this.isLoading.set(false);
        window.location.reload();
      },
      error: (err) => {
        alert('Error: ' + (err.error?.message || 'Failed to save'));
        this.isLoading.set(false);
      }
    });
  }
}
