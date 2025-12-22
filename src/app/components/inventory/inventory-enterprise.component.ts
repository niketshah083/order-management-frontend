import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryEnterpriseService, StockBalance, InventoryLot, InventorySerial, InventoryTransaction, ExpiringLot, Warehouse } from '../../services/inventory-enterprise.service';
import { ItemService, ApiItem } from '../../services/item.service';

@Component({
  selector: 'app-inventory-enterprise',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 p-3 md:p-6 max-w-7xl mx-auto min-h-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Enterprise Inventory</h1>
          <p class="text-gray-500 text-sm mt-0.5">Real-time stock tracking with FIFO/FEFO, lot & serial management</p>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="bg-white border border-gray-200 rounded-2xl p-1 mb-6 shadow-sm flex flex-wrap gap-1">
        @for (tab of tabs; track tab.id) {
          <button
            (click)="activeTab.set(tab.id)"
            [class.bg-indigo-600]="activeTab() === tab.id"
            [class.text-white]="activeTab() === tab.id"
            [class.text-gray-700]="activeTab() !== tab.id"
            [class.hover:bg-gray-100]="activeTab() !== tab.id"
            class="px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2"
          >
            <span>{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-gray-600">Loading inventory data...</p>
        </div>
      }

      <!-- Error Message -->
      @if (errorMessage()) {
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-red-700 text-sm">{{ errorMessage() }}</p>
        </div>
      }

      <!-- Stock Balance Tab -->
      @if (activeTab() === 'stock' && !loading()) {
        <div class="space-y-6">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div class="text-gray-600 text-sm font-medium">Total Items</div>
              <div class="text-2xl font-bold text-gray-900 mt-1">{{ uniqueItems().length }}</div>
            </div>
            <div class="bg-white rounded-lg p-4 border border-green-200 shadow-sm bg-green-50">
              <div class="text-green-700 text-sm font-medium">Total On Hand</div>
              <div class="text-2xl font-bold text-green-900 mt-1">{{ totalOnHand() }}</div>
            </div>
            <div class="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm bg-yellow-50">
              <div class="text-yellow-700 text-sm font-medium">Reserved</div>
              <div class="text-2xl font-bold text-yellow-900 mt-1">{{ totalReserved() }}</div>
            </div>
            <div class="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm bg-indigo-50">
              <div class="text-indigo-700 text-sm font-medium">Available</div>
              <div class="text-2xl font-bold text-indigo-900 mt-1">{{ totalAvailable() }}</div>
            </div>
          </div>

          <!-- Stock Balance Table -->
          <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-end">
              <div class="flex-1">
                <label class="text-sm font-medium text-gray-700 block mb-1">Filter by Item</label>
                <select
                  [(ngModel)]="selectedItemId"
                  (ngModelChange)="loadStockBalance()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option [ngValue]="null">All Items</option>
                  @for (item of items(); track item.id) {
                    <option [ngValue]="item.id">{{ item.name }}</option>
                  }
                </select>
              </div>
              <button (click)="loadStockBalance()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Refresh</button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lot/Batch</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">On Hand</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Reserved</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Available</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Avg Cost</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (stock of stockBalance(); track stock.itemId + '-' + stock.lotId) {
                    <tr class="hover:bg-indigo-50/30 transition-colors">
                      <td class="px-6 py-4 font-semibold text-gray-900">{{ stock.itemName }}</td>
                      <td class="px-6 py-4 text-sm">
                        @if (stock.lotNumber) {
                          <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">{{ stock.lotNumber }}</span>
                        } @else {
                          <span class="text-gray-400">-</span>
                        }
                      </td>
                      <td class="px-6 py-4 text-sm">
                        @if (stock.expiryDate) {
                          <span [class]="getExpiryClass(stock.expiryDate)" class="px-2 py-1 rounded text-xs font-medium">
                            {{ stock.expiryDate | date: 'MMM dd, yyyy' }}
                          </span>
                        } @else {
                          <span class="text-gray-400">-</span>
                        }
                      </td>
                      <td class="px-6 py-4 text-sm text-right font-medium">{{ stock.onHand }}</td>
                      <td class="px-6 py-4 text-sm text-right">
                        <span class="text-yellow-600">{{ stock.reserved }}</span>
                      </td>
                      <td class="px-6 py-4 text-sm text-right">
                        <span class="font-bold text-green-600">{{ stock.available }}</span>
                      </td>
                      <td class="px-6 py-4 text-sm text-right text-gray-600">
                        {{ stock.avgCost ? '₹' + stock.avgCost.toFixed(2) : '-' }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">No stock balance data found</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Lots Tab -->
      @if (activeTab() === 'lots' && !loading()) {
        <div class="space-y-6">
          <!-- Lot Filter -->
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div class="flex flex-col sm:flex-row gap-3 items-end">
              <div class="flex-1">
                <label class="text-sm font-medium text-gray-700 block mb-1">Select Item</label>
                <select
                  [(ngModel)]="selectedItemIdForLots"
                  (ngModelChange)="loadLots()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option [ngValue]="null">Select an item...</option>
                  @for (item of items(); track item.id) {
                    <option [ngValue]="item.id">{{ item.name }}</option>
                  }
                </select>
              </div>
              <div class="flex gap-2">
                <button
                  (click)="allocationStrategy = 'FEFO'"
                  [class.bg-indigo-600]="allocationStrategy === 'FEFO'"
                  [class.text-white]="allocationStrategy === 'FEFO'"
                  [class.bg-gray-100]="allocationStrategy !== 'FEFO'"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  FEFO
                </button>
                <button
                  (click)="allocationStrategy = 'FIFO'"
                  [class.bg-indigo-600]="allocationStrategy === 'FIFO'"
                  [class.text-white]="allocationStrategy === 'FIFO'"
                  [class.bg-gray-100]="allocationStrategy !== 'FIFO'"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  FIFO
                </button>
              </div>
            </div>
          </div>

          <!-- Lots Table -->
          <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-gray-100 bg-purple-50">
              <h3 class="font-semibold text-purple-900 flex items-center gap-2">
                <span>📦</span> Lot/Batch Details
                <span class="text-sm font-normal text-purple-600">({{ allocationStrategy }} Order)</span>
              </h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lot Number</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Received</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quality</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Unit Cost</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (lot of lots(); track lot.id) {
                    <tr class="hover:bg-purple-50/30 transition-colors">
                      <td class="px-6 py-4">
                        <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">{{ lot.lotNumber }}</span>
                      </td>
                      <td class="px-6 py-4 font-semibold text-gray-900">{{ lot.item?.name || 'N/A' }}</td>
                      <td class="px-6 py-4 text-sm text-gray-600">{{ lot.receivedDate | date: 'MMM dd, yyyy' }}</td>
                      <td class="px-6 py-4 text-sm">
                        @if (lot.expiryDate) {
                          <span [class]="getExpiryClass(lot.expiryDate)" class="px-2 py-1 rounded text-xs font-medium">
                            {{ lot.expiryDate | date: 'MMM dd, yyyy' }}
                          </span>
                        } @else {
                          <span class="text-gray-400">-</span>
                        }
                      </td>
                      <td class="px-6 py-4">
                        <span [class]="getLotStatusClass(lot.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                          {{ lot.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span [class]="getQualityStatusClass(lot.qualityStatus)" class="px-2 py-1 rounded-full text-xs font-medium">
                          {{ lot.qualityStatus }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm text-right text-gray-600">
                        {{ lot.unitCost ? '₹' + lot.unitCost.toFixed(2) : '-' }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        {{ selectedItemIdForLots ? 'No lots found for this item' : 'Select an item to view lots' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Serials Tab -->
      @if (activeTab() === 'serials' && !loading()) {
        <div class="space-y-6">
          <!-- Serial Filter -->
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div class="flex flex-col sm:flex-row gap-3 items-end">
              <div class="flex-1">
                <label class="text-sm font-medium text-gray-700 block mb-1">Select Item</label>
                <select
                  [(ngModel)]="selectedItemIdForSerials"
                  (ngModelChange)="loadSerials()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option [ngValue]="null">Select an item...</option>
                  @for (item of items(); track item.id) {
                    <option [ngValue]="item.id">{{ item.name }}</option>
                  }
                </select>
              </div>
              <div class="flex-1">
                <label class="text-sm font-medium text-gray-700 block mb-1">Lookup Serial</label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    [(ngModel)]="serialLookupQuery"
                    placeholder="Enter serial number..."
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                  <button (click)="lookupSerial()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">🔍 Lookup</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Serial Lookup Result -->
          @if (serialLookupResult()) {
            <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
              <h4 class="font-semibold text-blue-900 mb-3">Serial Lookup Result</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">Serial:</span>
                  <span class="font-medium ml-2">{{ serialLookupResult()?.serialNumber }}</span>
                </div>
                <div>
                  <span class="text-gray-600">Item:</span>
                  <span class="font-medium ml-2">{{ serialLookupResult()?.item?.name }}</span>
                </div>
                <div>
                  <span class="text-gray-600">Status:</span>
                  <span [class]="getSerialStatusClass(serialLookupResult()?.status || '')" class="ml-2 px-2 py-1 rounded-full text-xs font-medium">
                    {{ serialLookupResult()?.status }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-600">Owner:</span>
                  <span class="font-medium ml-2">{{ serialLookupResult()?.currentOwnerType }}</span>
                </div>
              </div>
            </div>
          }

          <!-- Serials Table -->
          <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-gray-100 bg-blue-50">
              <h3 class="font-semibold text-blue-900 flex items-center gap-2"><span>🔢</span> Serial Numbers</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lot</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Received</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Warranty</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (serial of serials(); track serial.id) {
                    <tr class="hover:bg-blue-50/30 transition-colors">
                      <td class="px-6 py-4">
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">{{ serial.serialNumber }}</span>
                      </td>
                      <td class="px-6 py-4 font-semibold text-gray-900">{{ serial.item?.name || 'N/A' }}</td>
                      <td class="px-6 py-4 text-sm">
                        @if (serial.lot?.lotNumber) {
                          <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">{{ serial.lot?.lotNumber }}</span>
                        } @else {
                          <span class="text-gray-400">-</span>
                        }
                      </td>
                      <td class="px-6 py-4">
                        <span [class]="getSerialStatusClass(serial.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                          {{ serial.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-600">{{ serial.currentOwnerType }}</td>
                      <td class="px-6 py-4 text-sm text-gray-600">{{ serial.receivedDate | date: 'MMM dd, yyyy' }}</td>
                      <td class="px-6 py-4 text-sm">
                        @if (serial.warrantyEndDate) {
                          <span [class]="getExpiryClass(serial.warrantyEndDate)" class="px-2 py-1 rounded text-xs font-medium">
                            {{ serial.warrantyEndDate | date: 'MMM dd, yyyy' }}
                          </span>
                        } @else {
                          <span class="text-gray-400">-</span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        {{ selectedItemIdForSerials ? 'No serials found for this item' : 'Select an item to view serials' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Transactions Tab -->
      @if (activeTab() === 'transactions' && !loading()) {
        <div class="space-y-6">
          <!-- Transaction Filter -->
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div class="flex flex-col sm:flex-row gap-3 items-end">
              <div class="flex-1">
                <label class="text-sm font-medium text-gray-700 block mb-1">Filter by Item</label>
                <select
                  [(ngModel)]="selectedItemIdForTxn"
                  (ngModelChange)="loadTransactions()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option [ngValue]="null">All Items</option>
                  @for (item of items(); track item.id) {
                    <option [ngValue]="item.id">{{ item.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Limit</label>
                <select
                  [(ngModel)]="transactionLimit"
                  (ngModelChange)="loadTransactions()"
                  class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option [ngValue]="50">50</option>
                  <option [ngValue]="100">100</option>
                  <option [ngValue]="200">200</option>
                </select>
              </div>
              <button (click)="loadTransactions()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Refresh</button>
            </div>
          </div>

          <!-- Transactions Table -->
          <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-gray-100 bg-gray-50">
              <h3 class="font-semibold text-gray-900 flex items-center gap-2"><span>📋</span> Transaction History (Single Source of Truth)</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Txn No</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Movement</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lot</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Qty</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Balance</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (txn of transactions(); track txn.id) {
                    <tr class="hover:bg-gray-50/50 transition-colors">
                      <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ txn.transactionNo }}</td>
                      <td class="px-4 py-3 text-xs text-gray-600">{{ txn.transactionDate | date: 'MMM dd, HH:mm' }}</td>
                      <td class="px-4 py-3">
                        <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">{{ txn.transactionType }}</span>
                      </td>
                      <td class="px-4 py-3">
                        <span [class]="getMovementClass(txn.movementType)" class="px-2 py-1 rounded text-xs font-medium">
                          {{ txn.movementType }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ txn.item?.name || 'N/A' }}</td>
                      <td class="px-4 py-3 text-xs">
                        @if (txn.lot?.lotNumber) {
                          <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded">{{ txn.lot?.lotNumber }}</span>
                        } @else {
                          <span class="text-gray-400">-</span>
                        }
                      </td>
                      <td
                        class="px-4 py-3 text-sm text-right font-medium"
                        [class.text-green-600]="txn.movementType === 'IN' || txn.movementType === 'RELEASE'"
                        [class.text-red-600]="txn.movementType === 'OUT' || txn.movementType === 'RESERVE'"
                      >
                        {{ txn.movementType === 'IN' || txn.movementType === 'RELEASE' ? '+' : '-' }}{{ txn.quantity }}
                      </td>
                      <td class="px-4 py-3 text-xs text-gray-600">{{ txn.referenceNo || '-' }}</td>
                      <td class="px-4 py-3 text-sm text-right font-bold text-gray-900">{{ txn.runningBalance ?? '-' }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="9" class="px-6 py-8 text-center text-gray-500">No transactions found</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Expiring Tab -->
      @if (activeTab() === 'expiring' && !loading()) {
        <div class="space-y-6">
          <!-- Expiry Filter -->
          <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div class="flex flex-col sm:flex-row gap-3 items-end">
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Days Threshold</label>
                <select
                  [(ngModel)]="expiryDaysThreshold"
                  (ngModelChange)="loadExpiringLots()"
                  class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option [ngValue]="7">7 Days</option>
                  <option [ngValue]="14">14 Days</option>
                  <option [ngValue]="30">30 Days</option>
                  <option [ngValue]="60">60 Days</option>
                  <option [ngValue]="90">90 Days</option>
                </select>
              </div>
              <button (click)="loadExpiringLots()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Refresh</button>
            </div>
          </div>

          <!-- Summary -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-red-50 rounded-lg p-4 border border-red-200 shadow-sm">
              <div class="text-red-700 text-sm font-medium">Already Expired</div>
              <div class="text-2xl font-bold text-red-900 mt-1">{{ expiredCount() }}</div>
            </div>
            <div class="bg-amber-50 rounded-lg p-4 border border-amber-200 shadow-sm">
              <div class="text-amber-700 text-sm font-medium">Expiring Soon</div>
              <div class="text-2xl font-bold text-amber-900 mt-1">{{ expiringSoonCount() }}</div>
            </div>
            <div class="bg-green-50 rounded-lg p-4 border border-green-200 shadow-sm">
              <div class="text-green-700 text-sm font-medium">Total Qty at Risk</div>
              <div class="text-2xl font-bold text-green-900 mt-1">{{ totalExpiringQty() }}</div>
            </div>
          </div>

          <!-- Expiring Lots Table -->
          <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-gray-100 bg-amber-50">
              <h3 class="font-semibold text-amber-900 flex items-center gap-2"><span>⚠️</span> Expiring Lots (within {{ expiryDaysThreshold }} days)</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lot Number</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Left</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Available Qty</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (exp of expiringLots(); track exp.lot.id) {
                    <tr class="hover:bg-amber-50/30 transition-colors">
                      <td class="px-6 py-4">
                        <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">{{ exp.lot.lotNumber }}</span>
                      </td>
                      <td class="px-6 py-4 font-semibold text-gray-900">{{ exp.lot.item?.name || 'N/A' }}</td>
                      <td class="px-6 py-4 text-sm">
                        <span [class]="getExpiryClass(exp.lot.expiryDate)" class="px-2 py-1 rounded text-xs font-medium">
                          {{ exp.lot.expiryDate | date: 'MMM dd, yyyy' }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          [class.text-red-600]="exp.daysToExpiry <= 0"
                          [class.text-amber-600]="exp.daysToExpiry > 0 && exp.daysToExpiry <= 7"
                          [class.text-yellow-600]="exp.daysToExpiry > 7"
                          class="font-bold"
                        >
                          {{ exp.daysToExpiry <= 0 ? 'EXPIRED' : exp.daysToExpiry + ' days' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm text-right font-medium">{{ exp.availableQuantity }}</td>
                      <td class="px-6 py-4">
                        <span [class]="getLotStatusClass(exp.lot.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                          {{ exp.lot.status }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">No expiring lots found within {{ expiryDaysThreshold }} days 🎉</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Warehouses Tab -->
      @if (activeTab() === 'warehouses' && !loading()) {
        <div class="space-y-6">
          <!-- Warehouse Summary -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div class="text-gray-600 text-sm font-medium">Total Warehouses</div>
              <div class="text-2xl font-bold text-gray-900 mt-1">{{ warehouses().length }}</div>
            </div>
            <div class="bg-white rounded-lg p-4 border border-green-200 shadow-sm bg-green-50">
              <div class="text-green-700 text-sm font-medium">Active Warehouses</div>
              <div class="text-2xl font-bold text-green-900 mt-1">{{ activeWarehouseCount() }}</div>
            </div>
          </div>

          <!-- Warehouses Table -->
          <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-gray-100 bg-indigo-50 flex justify-between items-center">
              <h3 class="font-semibold text-indigo-900 flex items-center gap-2"><span>🏭</span> Warehouse Locations</h3>
              <button (click)="loadWarehouses()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Refresh</button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (wh of warehouses(); track wh.id) {
                    <tr class="hover:bg-indigo-50/30 transition-colors">
                      <td class="px-6 py-4">
                        <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">{{ wh.code }}</span>
                      </td>
                      <td class="px-6 py-4 font-semibold text-gray-900">{{ wh.name }}</td>
                      <td class="px-6 py-4 text-sm">
                        <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">{{ wh.type }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          [class.bg-green-100]="wh.isActive"
                          [class.text-green-800]="wh.isActive"
                          [class.bg-red-100]="!wh.isActive"
                          [class.text-red-800]="!wh.isActive"
                          class="px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {{ wh.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                        No warehouses found. A default warehouse will be created automatically when you receive your first GRN.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Success Message -->
      @if (successMessage()) {
        <div class="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg flex gap-3 z-50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-green-700 text-sm">{{ successMessage() }}</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class InventoryEnterpriseComponent implements OnInit {
  private inventoryService = inject(InventoryEnterpriseService);
  private itemService = inject(ItemService);

  // Tab management
  tabs = [
    { id: 'stock', label: 'Stock Balance', icon: '📊' },
    { id: 'lots', label: 'Lots/Batches', icon: '📦' },
    { id: 'serials', label: 'Serials', icon: '🔢' },
    { id: 'transactions', label: 'Transactions', icon: '📋' },
    { id: 'expiring', label: 'Expiring', icon: '⚠️' },
    { id: 'warehouses', label: 'Warehouses', icon: '🏭' }
  ];
  activeTab = signal<string>('stock');

  // State
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  items = signal<ApiItem[]>([]);

  // Warehouses
  warehouses = signal<Warehouse[]>([]);

  // Stock Balance
  stockBalance = signal<StockBalance[]>([]);
  selectedItemId: number | null = null;

  // Lots
  lots = signal<InventoryLot[]>([]);
  availableLots = signal<any[]>([]);
  selectedItemIdForLots: number | null = null;
  allocationStrategy: 'FIFO' | 'FEFO' = 'FEFO';
  selectedWarehouseId: number | null = null;

  // Serials
  serials = signal<InventorySerial[]>([]);
  selectedItemIdForSerials: number | null = null;
  serialLookupQuery = '';
  serialLookupResult = signal<InventorySerial | null>(null);

  // Transactions
  transactions = signal<InventoryTransaction[]>([]);
  selectedItemIdForTxn: number | null = null;
  transactionLimit = 100;

  // Expiring
  expiringLots = signal<ExpiringLot[]>([]);
  expiryDaysThreshold = 30;

  // Computed values
  uniqueItems = computed(() => {
    const itemIds = new Set(this.stockBalance().map((s) => s.itemId));
    return Array.from(itemIds);
  });

  totalOnHand = computed(() => this.stockBalance().reduce((sum, s) => sum + s.onHand, 0));
  totalReserved = computed(() => this.stockBalance().reduce((sum, s) => sum + s.reserved, 0));
  totalAvailable = computed(() => this.stockBalance().reduce((sum, s) => sum + s.available, 0));

  expiredCount = computed(() => this.expiringLots().filter((e) => e.daysToExpiry <= 0).length);
  expiringSoonCount = computed(() => this.expiringLots().filter((e) => e.daysToExpiry > 0 && e.daysToExpiry <= 7).length);
  totalExpiringQty = computed(() => this.expiringLots().reduce((sum, e) => sum + e.availableQuantity, 0));
  activeWarehouseCount = computed(() => this.warehouses().filter((w) => w.isActive).length);

  ngOnInit(): void {
    this.loadItems();
    this.loadStockBalance();
    this.loadExpiringLots();
    this.loadWarehouses();
  }

  loadItems(): void {
    this.itemService.getItems().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.items.set(res.data);
        }
      },
      error: (err) => {
        console.error('Failed to load items:', err);
      }
    });
  }

  loadStockBalance(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.inventoryService.getStockBalance(this.selectedItemId || undefined).subscribe({
      next: (res) => {
        this.stockBalance.set(res.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to load stock balance');
        this.loading.set(false);
      }
    });
  }

  loadLots(): void {
    if (!this.selectedItemIdForLots) {
      this.lots.set([]);
      this.availableLots.set([]);
      return;
    }

    this.loading.set(true);
    this.inventoryService.getLots(this.selectedItemIdForLots).subscribe({
      next: (res) => {
        this.lots.set(res.data || []);
        this.loading.set(false);
        // Also load available lots if warehouse is selected
        this.loadAvailableLots();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to load lots');
        this.loading.set(false);
      }
    });
  }

  loadAvailableLots(): void {
    if (!this.selectedItemIdForLots || !this.selectedWarehouseId) {
      this.availableLots.set([]);
      return;
    }

    this.inventoryService.getAvailableLots(this.selectedItemIdForLots, this.selectedWarehouseId, this.allocationStrategy).subscribe({
      next: (res) => {
        this.availableLots.set(res.data || []);
      },
      error: (err) => {
        console.error('Failed to load available lots:', err);
      }
    });
  }

  loadSerials(): void {
    if (!this.selectedItemIdForSerials) {
      this.serials.set([]);
      return;
    }

    this.loading.set(true);
    this.inventoryService.getSerials(this.selectedItemIdForSerials).subscribe({
      next: (res) => {
        this.serials.set(res.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to load serials');
        this.loading.set(false);
      }
    });
  }

  lookupSerial(): void {
    if (!this.serialLookupQuery.trim()) return;

    this.inventoryService.lookupSerial(this.serialLookupQuery.trim()).subscribe({
      next: (res) => {
        this.serialLookupResult.set(res.data);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Serial not found');
        this.serialLookupResult.set(null);
      }
    });
  }

  loadTransactions(): void {
    this.loading.set(true);
    this.inventoryService
      .getTransactions({
        itemId: this.selectedItemIdForTxn || undefined,
        limit: this.transactionLimit
      })
      .subscribe({
        next: (res) => {
          this.transactions.set(res.data || []);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to load transactions');
          this.loading.set(false);
        }
      });
  }

  loadExpiringLots(): void {
    this.inventoryService.getExpiringLots(this.expiryDaysThreshold).subscribe({
      next: (res) => {
        this.expiringLots.set(res.data || []);
      },
      error: (err) => {
        console.error('Failed to load expiring lots:', err);
      }
    });
  }

  loadWarehouses(): void {
    this.inventoryService.getWarehouses().subscribe({
      next: (res) => {
        this.warehouses.set(res.data || []);
      },
      error: (err) => {
        console.error('Failed to load warehouses:', err);
      }
    });
  }

  // Helper methods for styling
  getExpiryClass(date: string | undefined): string {
    if (!date) return 'bg-gray-100 text-gray-800';
    const expiry = new Date(date);
    const today = new Date();
    const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysToExpiry <= 0) return 'bg-red-100 text-red-800';
    if (daysToExpiry <= 7) return 'bg-amber-100 text-amber-800';
    if (daysToExpiry <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  getLotStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'BLOCKED':
        return 'bg-gray-100 text-gray-800';
      case 'CONSUMED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getQualityStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'QUARANTINE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getSerialStatusClass(status: string): string {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'RESERVED':
        return 'bg-yellow-100 text-yellow-800';
      case 'SOLD':
        return 'bg-blue-100 text-blue-800';
      case 'RETURNED':
        return 'bg-purple-100 text-purple-800';
      case 'DAMAGED':
        return 'bg-red-100 text-red-800';
      case 'SCRAPPED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getMovementClass(movement: string): string {
    switch (movement) {
      case 'IN':
        return 'bg-green-100 text-green-800';
      case 'OUT':
        return 'bg-red-100 text-red-800';
      case 'RESERVE':
        return 'bg-yellow-100 text-yellow-800';
      case 'RELEASE':
        return 'bg-blue-100 text-blue-800';
      case 'ADJUST':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
