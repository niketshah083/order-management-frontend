import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ItemService, ApiItem } from '../../services/item.service';
import { CategoryService, Category } from '../../services/category.service';
import { OrderService } from '../../services/order.service';
import { ModalComponent } from '../shared/ui/modal.component';
import { AuthService } from '../../services/auth.service';
import { ExcelService } from '../../services/excel.service';
import { BulkImportService } from '../../services/bulk-import.service';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

interface UiAsset {
  type: 'image' | 'video';
  url: string;
  name: string;
  mimeType: string;
  file?: File;
  originalAsset?: any;
}

@Component({
  selector: 'app-item-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent, FloatLabelModule, InputTextModule, InputNumberModule],
  template: `
    <div class="bg-indigo-50 p-3 md:p-6 max-w-7xl mx-auto min-h-full" [class.pb-28]="cartCount() > 0">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {{ auth.isAdmin() ? 'Product Master - Admin Summary' : 'Order Items' }}
          </h1>
          <p class="text-gray-500 text-sm mt-0.5">
            @if (auth.isAdmin()) {
            📊 View all products with aggregated quantities across all distributors
            } @else {
            Select items to create order
            }
          </p>
        </div>

        <!-- Admin Action Buttons -->
        @if (auth.isAdmin()) {
        <div class="flex flex-col sm:flex-row gap-2">
          <button (click)="downloadSample()" title="Download Sample Excel"
            class="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-lg transition-all active:scale-95 shadow-md shadow-green-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button (click)="openBulkImport()" title="Bulk Import"
            class="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-all active:scale-95 shadow-md shadow-blue-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button (click)="openModal()" title="Add New Product"
            class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="hidden sm:inline">Add Product</span>
          </button>
        </div>
        }
      </div>

      <!-- Search & Filters -->
      @if (auth.isAdmin()) {
      <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <!-- Search Name -->
          <div>
            <label class="text-xs font-semibold text-gray-600 mb-1.5 block">Search Product</label>
            <input type="text" [(ngModel)]="searchName" placeholder="Product name..." 
              (input)="loadItems()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm" />
          </div>

          <!-- Search Unit -->
          <div>
            <label class="text-xs font-semibold text-gray-600 mb-1.5 block">Search Unit</label>
            <input type="text" [(ngModel)]="searchUnit" placeholder="e.g. pcs, kg..."
              (input)="loadItems()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm" />
          </div>

          <!-- Category Filter -->
          <div>
            <label class="text-xs font-semibold text-gray-600 mb-1.5 block">Category</label>
            <select [(ngModel)]="selectedCategoryId" (change)="loadItems()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm">
              <option value="">All Categories</option>
              @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>

          <!-- Show Disabled Toggle -->
          <div class="flex items-end">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="showDisabled" (change)="loadItems()" class="w-4 h-4 rounded">
              <span class="text-sm text-gray-600 font-medium">Show Disabled</span>
            </label>
          </div>
        </div>
      </div>
      }

      <!-- Desktop Table View -->
      <div class="hidden lg:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">Product</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">Unit</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600">Price</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">Qty</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              @for (item of filteredItems(); track item.id) {
              <tr class="hover:bg-indigo-50/50 transition-colors" [class.opacity-50]="item.isDisabled">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ item.name }}</div>
                  <div class="text-xs text-gray-500">ID: {{ item.id }}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.unit }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.categoryName || '—' }}</td>
                <td class="px-4 py-3 text-sm font-medium text-right text-gray-900">₹{{ item.rate }}</td>
                <td class="px-4 py-3 text-center">
                  @if (auth.isAdmin()) {
                  <div class="flex flex-col items-center gap-1">
                    <span [class]="item.qty < 10 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'" 
                      class="px-2 py-1 rounded text-xs font-semibold">
                      {{ item.qty }}
                    </span>
                    <span class="text-xs text-gray-400">(Summary)</span>
                  </div>
                  } @else {
                  <div class="flex flex-col items-center gap-2">
                    @if (item.hasBoxPackaging) {
                    <div class="flex gap-1">
                      <button (click)="toggleBoxOrdering(item.id)"
                        [class.bg-indigo-600]="cart()[item.id]?.orderedByBox"
                        [class.text-white]="cart()[item.id]?.orderedByBox"
                        [class.border-indigo-600]="cart()[item.id]?.orderedByBox"
                        [class.bg-white]="!cart()[item.id]?.orderedByBox"
                        [class.text-gray-600]="!cart()[item.id]?.orderedByBox"
                        class="px-2 py-1 text-xs font-bold rounded border transition-all active:scale-90">
                        {{ cart()[item.id]?.orderedByBox ? '📦 Box' : 'Unit' }}
                      </button>
                    </div>
                    }
                    @if (cart()[item.id]?.orderedByBox) {
                    <div class="flex items-center gap-1">
                      <input type="number" min="1" [value]="cart()[item.id]?.boxCount || 1"
                        (change)="updateBoxCount(item.id, +$event.target.value)"
                        class="w-12 px-1.5 py-1 text-xs border border-gray-300 rounded text-center" />
                      <span class="text-xs text-gray-600">boxes</span>
                    </div>
                    <div class="text-xs text-gray-500">
                      ₹{{ item.boxRate }} | {{ item.unitsPerBox }} units/box
                    </div>
                    } @else {
                    <div class="flex items-center justify-center gap-1">
                      <button (click)="updateQuantity(item.id, (cart()[item.id]?.qty || 0) - 1)"
                        class="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-xs"
                        [disabled]="!cart()[item.id]?.qty">-</button>
                      <span class="w-6 text-center text-sm font-semibold">{{ cart()[item.id]?.qty || 0 }}</span>
                      <button (click)="updateQuantity(item.id, (cart()[item.id]?.qty || 0) + 1)"
                        class="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 text-xs">+</button>
                    </div>
                    }
                  </div>
                  }
                </td>
                <td class="px-4 py-3 text-center">
                  @if (auth.isAdmin()) {
                  <div class="flex items-center justify-center gap-1">
                    <button (click)="viewItem(item)" title="View"
                      class="text-blue-600 hover:bg-blue-100 p-2 rounded transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button (click)="editItem(item)" title="Edit"
                      class="text-indigo-600 hover:bg-indigo-100 p-2 rounded transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button (click)="toggleDisable(item)" title="{{ item.isDisabled ? 'Enable' : 'Disable' }}"
                      [class]="item.isDisabled ? 'text-emerald-600 hover:bg-emerald-100' : 'text-amber-600 hover:bg-amber-100'"
                      class="p-2 rounded transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button (click)="deleteItem(item.id)" title="Delete"
                      class="text-red-600 hover:bg-red-100 p-2 rounded transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  }
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile Card View -->
      <div class="lg:hidden space-y-3">
        @for (item of filteredItems(); track item.id) {
        <div class="bg-white rounded-lg border border-gray-200 p-4" [class.opacity-50]="item.isDisabled">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-bold text-gray-900">{{ item.name }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">{{ item.categoryName || 'No Category' }} • {{ item.unit }}</p>
            </div>
            @if (auth.isAdmin()) {
            <div class="flex gap-1">
              <button (click)="viewItem(item)" class="text-blue-600 bg-blue-50 p-2 rounded transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button (click)="editItem(item)" class="text-indigo-600 bg-indigo-50 p-2 rounded transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button (click)="deleteItem(item.id)" class="text-red-600 bg-red-50 p-2 rounded transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            }
          </div>
          <div class="flex justify-between items-end">
            <span class="font-bold text-indigo-600 text-lg">₹{{ item.rate }}</span>
            @if (auth.isAdmin()) {
            <div class="flex flex-col items-end gap-1">
              <span [class]="item.qty < 10 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'" 
                class="px-2 py-1 rounded text-xs font-semibold">Qty: {{ item.qty }}</span>
              <span class="text-xs text-gray-400">(All Distributors)</span>
            </div>
            } @else {
            <div class="flex flex-col items-end gap-2">
              @if (item.hasBoxPackaging) {
              <div class="flex gap-1">
                <button (click)="toggleBoxOrdering(item.id)"
                  [class.bg-indigo-600]="cart()[item.id]?.orderedByBox"
                  [class.text-white]="cart()[item.id]?.orderedByBox"
                  [class.border-indigo-600]="cart()[item.id]?.orderedByBox"
                  [class.bg-white]="!cart()[item.id]?.orderedByBox"
                  [class.text-gray-600]="!cart()[item.id]?.orderedByBox"
                  class="px-2 py-1 text-xs font-bold rounded border transition-all active:scale-90">
                  {{ cart()[item.id]?.orderedByBox ? '📦 Box' : 'Unit' }}
                </button>
              </div>
              }
              @if (cart()[item.id]?.orderedByBox) {
              <div class="flex items-center gap-1">
                <input type="number" min="1" [value]="cart()[item.id]?.boxCount || 1"
                  (change)="updateBoxCount(item.id, +$event.target.value)"
                  class="w-12 px-1.5 py-1 text-xs border border-gray-300 rounded text-center" />
                <span class="text-xs text-gray-600">boxes</span>
              </div>
              <div class="text-xs text-gray-500">
                ₹{{ item.boxRate }} | {{ item.unitsPerBox }} units/box
              </div>
              } @else {
              <div class="flex items-center gap-1">
                <button (click)="updateQuantity(item.id, (cart()[item.id]?.qty || 0) - 1)"
                  class="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 text-xs"
                  [disabled]="!cart()[item.id]?.qty">-</button>
                <span class="w-6 text-center text-sm font-semibold">{{ cart()[item.id]?.qty || 0 }}</span>
                <button (click)="updateQuantity(item.id, (cart()[item.id]?.qty || 0) + 1)"
                  class="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs">+</button>
              </div>
              }
            </div>
            }
          </div>
        </div>
        }
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
      <div class="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border border-gray-200">
        <div class="text-sm text-gray-600">
          Page {{ currentPage() }} of {{ totalPages() }} • Total: {{ totalCount() }} items
        </div>
        <div class="flex gap-2">
          <button (click)="previousPage()" [disabled]="currentPage() === 1"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all">← Previous</button>
          <button (click)="nextPage()" [disabled]="currentPage() >= totalPages()"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all">Next →</button>
        </div>
      </div>
      }

      <!-- Empty State -->
      @if (filteredItems().length === 0) {
      <div class="text-center p-12 bg-white rounded-lg border border-dashed border-gray-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p class="text-gray-500 font-medium">No products found</p>
        <p class="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
      </div>
      }

      <!-- Checkout Footer -->
      @if (!auth.isAdmin() && cartCount() > 0) {
      <div class="fixed bottom-0 right-0 left-0 md:left-72 z-40 bg-white border-t border-gray-200 shadow-2xl p-3 md:p-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 font-bold uppercase">{{ cartCount() }} Items</p>
            <p class="text-xl md:text-2xl font-bold text-gray-900">₹{{ cartTotal() }}</p>
          </div>
          <button (click)="placeOrder()"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2">
            <span>Place Order</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      }

      <!-- View Product Modal -->
      <app-modal [isOpen]="isViewOpen()" [title]="'View Product Details'" (close)="isViewOpen.set(false)">
        @if (viewingItem()) {
        <div class="space-y-5">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label class="text-xs font-bold text-gray-600">Product Name</label>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ viewingItem()!.name }}</p></div>
            <div><label class="text-xs font-bold text-gray-600">Unit</label>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ viewingItem()!.unit }}</p></div>
            <div><label class="text-xs font-bold text-gray-600">Rate (₹)</label>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ viewingItem()!.rate }}</p></div>
            <div><label class="text-xs font-bold text-gray-600">Quantity</label>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ viewingItem()!.qty }}</p></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-bold text-gray-600">Category</label>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ viewingItem()!.categoryName || 'N/A' }}</p></div>
            <div><label class="text-xs font-bold text-gray-600">Status</label>
              <p class="text-sm font-medium mt-1" [class]="viewingItem()!.isDisabled ? 'text-red-600' : 'text-green-600'">
                {{ viewingItem()!.isDisabled ? 'Disabled' : 'Active' }}
              </p></div>
          </div>
          @if (viewingItem()!.assets && viewingItem()!.assets.length > 0) {
          <div><label class="text-xs font-bold text-gray-600 block mb-2">Images & Videos</label>
            <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
              @for (asset of viewingItem()!.assets; track asset) {
              <div class="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                @if (asset.includes('image') || asset.includes('jpg') || asset.includes('png') || asset.includes('gif')) {
                <img [src]="asset" class="w-full h-full object-cover" alt="Product image" />
                } @else {
                <video [src]="asset" class="w-full h-full object-cover"></video>
                <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                }
              </div>
              }
            </div>
          </div>
          }
          <div class="pt-4 border-t border-gray-100 flex justify-end">
            <button type="button" (click)="isViewOpen.set(false)" class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all">
              Close
            </button>
          </div>
        </div>
        }
      </app-modal>

      <!-- Modals -->
      <app-modal [isOpen]="isModalOpen()" [title]="editingId() ? 'Edit Product' : 'New Product'" (close)="closeModal()">
        <form [formGroup]="itemForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <div><label class="text-sm font-semibold text-gray-700">Product Name</label>
            <input type="text" formControlName="name" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. Copper Wire" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="text-sm font-semibold text-gray-700">Rate (₹)</label>
              <div class="relative"><span class="absolute left-3 top-2.5 text-gray-500">₹</span>
                <input type="number" formControlName="rate" step="0.01" class="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div></div>
            <div><label class="text-sm font-semibold text-gray-700">Unit</label>
              <select formControlName="unit" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="">Select Unit</option>
                <optgroup label="Count">
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="nos">Number (nos)</option>
                  <option value="set">Set</option>
                  <option value="pair">Pair</option>
                  <option value="dozen">Dozen</option>
                </optgroup>
                <optgroup label="Weight">
                  <option value="kg">Kilogram (kg)</option>
                  <option value="gm">Gram (gm)</option>
                  <option value="mg">Milligram (mg)</option>
                  <option value="tonne">Tonne</option>
                  <option value="quintal">Quintal</option>
                </optgroup>
                <optgroup label="Volume">
                  <option value="ltr">Liter (ltr)</option>
                  <option value="ml">Milliliter (ml)</option>
                  <option value="cbm">Cubic Meter (cbm)</option>
                </optgroup>
                <optgroup label="Length">
                  <option value="mtr">Meter (mtr)</option>
                  <option value="cm">Centimeter (cm)</option>
                  <option value="mm">Millimeter (mm)</option>
                  <option value="km">Kilometer (km)</option>
                </optgroup>
              </select></div></div>
          
          <div class="grid grid-cols-2 gap-4">
            <div><label class="text-sm font-semibold text-gray-700">Quantity</label>
              <input type="number" formControlName="qty" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label class="text-sm font-semibold text-gray-700">Alt Qty</label>
              <input type="number" formControlName="alterQty" step="0.01" placeholder="Alternative quantity" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div></div>

          <div class="grid grid-cols-2 gap-4">
            <div><label class="text-sm font-semibold text-gray-700">Category</label>
              <select formControlName="categoryId" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="">Select Category</option>
                @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
                }</select></div>
            <div><label class="text-sm font-semibold text-gray-700">SKU</label>
              <input type="text" formControlName="sku" placeholder="Stock Keeping Unit" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div></div>

          <div class="grid grid-cols-2 gap-4">
            <div><label class="text-sm font-semibold text-gray-700">HSN Code</label>
              <input type="text" formControlName="hsn" placeholder="Harmonized System of Nomenclature" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label class="text-sm font-semibold text-gray-700">SAC Code</label>
              <input type="text" formControlName="sac" placeholder="Service Accounting Code" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div></div>

          <div class="grid grid-cols-2 gap-4">
            <div><label class="text-sm font-semibold text-gray-700">GST Rate (%)</label>
              <input type="number" formControlName="gstRate" min="0" max="100" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label class="text-sm font-semibold text-gray-700">Description</label>
              <input type="text" formControlName="description" placeholder="Product description" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div></div>

          <!-- Batch & Serial Configuration -->
          <div class="border-t pt-4">
            <label class="text-sm font-semibold text-gray-700 mb-3 block">📦 Inventory Tracking Configuration</label>
            <div class="grid grid-cols-3 gap-4">
              <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 cursor-pointer">
                <input type="checkbox" formControlName="hasBatchTracking" class="w-5 h-5 text-indigo-600 rounded" />
                <span class="text-sm font-medium text-gray-700">📦 Batch Number</span>
              </label>
              <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 cursor-pointer">
                <input type="checkbox" formControlName="hasSerialTracking" class="w-5 h-5 text-indigo-600 rounded" />
                <span class="text-sm font-medium text-gray-700">🔢 Serial Number</span>
              </label>
              <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 cursor-pointer">
                <input type="checkbox" formControlName="hasExpiryDate" class="w-5 h-5 text-indigo-600 rounded" />
                <span class="text-sm font-medium text-gray-700">📅 Expiry Date</span>
              </label>
            </div>
            <p class="text-xs text-gray-500 mt-2">Enable tracking options that apply to this product</p>
          </div>

          <!-- Image & Video Upload -->
          <div>
            <label class="text-sm font-semibold text-gray-700 mb-2 block">Images & Videos</label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
              (click)="fileUploadInput.click()">
              <input #fileUploadInput type="file" multiple accept="image/*,video/*" (change)="onFileUpload($event)" class="hidden" />
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              <p class="text-sm text-gray-600">Click to upload images or videos</p>
              <p class="text-xs text-gray-500 mt-1">Maximum 5 files, 10MB each</p>
            </div>
            
            <!-- Uploaded Assets Preview -->
            @if (assets().length > 0) {
            <div class="mt-3 grid grid-cols-3 md:grid-cols-5 gap-2">
              @for (asset of assets(); track asset.name) {
              <div class="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                @if (asset.type === 'image') {
                <img [src]="asset.url" class="w-full h-full object-cover" alt="{{ asset.name }}" />
                } @else {
                <video [src]="asset.url" class="w-full h-full object-cover"></video>
                <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                }
                <button type="button" (click)="removeAsset($index)"
                  class="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              }
            </div>
            }
          </div>
          <div class="flex justify-end pt-4 border-t border-gray-100">
            <button type="submit" [disabled]="itemForm.invalid"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-8 py-2.5 rounded-lg font-medium transition-all">
              {{ editingId() ? 'Update' : 'Save' }}
            </button>
          </div>
        </form>
      </app-modal>

      <app-modal [isOpen]="isBulkImportOpen()" title="Bulk Import Products" (close)="isBulkImportOpen.set(false)">
        <div class="space-y-4">
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500" (click)="fileInput.click()">
            <input #fileInput type="file" accept=".xlsx,.xls,.csv" (change)="onFileSelected($event)" class="hidden" />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            <p class="text-sm text-gray-600">Click to upload Excel file</p></div>
          @if (selectedFile()) {
          <div class="bg-green-50 border border-green-200 rounded-lg p-3">
            <p class="text-sm font-medium text-green-900">Selected: {{ selectedFile()?.name }}</p></div>
          }
          <div class="flex justify-end gap-2 pt-4 border-t">
            <button type="button" (click)="isBulkImportOpen.set(false)" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="button" (click)="processBulkImport()" [disabled]="!selectedFile() || isImporting()"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-gray-400">
              {{ isImporting() ? 'Importing...' : 'Import' }}</button></div></div>
      </app-modal>
    </div>
  `,
})
export class ItemMasterComponent implements OnInit {
  itemService = inject(ItemService);
  categoryService = inject(CategoryService);
  orderService = inject(OrderService);
  auth = inject(AuthService);
  fb = inject(FormBuilder);
  excelService = inject(ExcelService);
  bulkImportService = inject(BulkImportService);

  // Data
  items = signal<ApiItem[]>([]);
  categories = signal<Category[]>([]);
  totalCount = signal(0);
  
  // UI State
  isModalOpen = signal(false);
  isBulkImportOpen = signal(false);
  isViewOpen = signal(false);
  editingId = signal<number | null>(null);
  selectedFile = signal<File | null>(null);
  isImporting = signal(false);
  uploadError = signal<string | null>(null);
  cart = signal<Record<number, { qty: number; orderedByBox: boolean; boxCount: number }>>({});
  viewingItem = signal<ApiItem | null>(null);
  selectedBoxItems = signal<Set<number>>(new Set());

  // Search & Filter
  searchName = '';
  searchUnit = '';
  selectedCategoryId = '';
  showDisabled = false;
  currentPage = signal(1);
  pageSize = 10;

  // Assets
  assets = signal<UiAsset[]>([]);

  itemForm = this.fb.group({
    name: ['', Validators.required],
    rate: [0, [Validators.required, Validators.min(0)]],
    qty: [0, [Validators.required, Validators.min(0)]],
    alterQty: [0, [Validators.min(0)]],
    unit: ['', Validators.required],
    categoryId: [''],
    hsn: [''],
    sac: [''],
    gstRate: [0, [Validators.min(0), Validators.max(100)]],
    sku: [''],
    description: [''],
    hasBatchTracking: [false],
    hasSerialTracking: [false],
    hasExpiryDate: [false],
  });

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize));
  
  filteredItems = computed(() => {
    let filtered = this.items();
    if (!this.showDisabled) {
      filtered = filtered.filter(i => !i.isDisabled);
    }
    return filtered;
  });

  cartItems = computed(() => {
    const currentCart = this.cart();
    return this.items()
      .filter((i) => (currentCart[i.id]?.qty || 0) > 0)
      .map((i) => ({
        item: i,
        quantity: currentCart[i.id].qty,
        orderedByBox: currentCart[i.id].orderedByBox,
        boxCount: currentCart[i.id].boxCount,
      }));
  });

  cartTotal = computed(() => {
    return this.cartItems().reduce((sum, line) => {
      if (line.orderedByBox && line.boxCount > 0) {
        return sum + (line.item.boxRate || 0) * line.boxCount;
      }
      return sum + line.item.rate * line.quantity;
    }, 0);
  });

  cartCount = computed(() => {
    return this.cartItems().reduce((sum, line) => sum + line.quantity, 0);
  });

  ngOnInit() {
    this.loadItems();
    this.loadCategories();
  }

  loadItems() {
    this.currentPage.set(1);
    this.fetchItems();
  }

  fetchItems() {
    this.itemService.getItems(
      this.searchName || undefined,
      this.searchUnit || undefined,
      this.selectedCategoryId ? +this.selectedCategoryId : undefined,
      this.currentPage(),
      this.pageSize
    ).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.totalCount.set(res.totalCount);
      },
      error: (err) => console.error('Error loading items:', err),
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res) => this.categories.set(res.data),
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.fetchItems();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.fetchItems();
    }
  }

  openModal() {
    this.editingId.set(null);
    this.itemForm.reset();
    this.assets.set([]);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.assets.set([]);
  }

  viewItem(item: ApiItem) {
    this.itemService.getItemById(item.id.toString()).subscribe({
      next: (res) => {
        this.viewingItem.set(res.data);
        this.isViewOpen.set(true);
      },
      error: (err) => console.error('Error loading item details:', err),
    });
  }

  editItem(item: ApiItem) {
    this.itemService.getItemById(item.id.toString()).subscribe({
      next: (res) => {
        const itemData = res.data;
        this.editingId.set(itemData.id);
        this.itemForm.patchValue({
          name: itemData.name,
          rate: itemData.rate,
          qty: itemData.qty,
          alterQty: itemData.alterQty || 0,
          unit: itemData.unit,
          categoryId: itemData.categoryId,
          hsn: itemData.hsn || '',
          sac: itemData.sac || '',
          gstRate: itemData.gstRate || 0,
          sku: itemData.sku || '',
          description: itemData.description || '',
          hasBatchTracking: itemData.hasBatchTracking || false,
          hasSerialTracking: itemData.hasSerialTracking || false,
          hasExpiryDate: itemData.hasExpiryDate || false,
        });
        if (itemData.assets && itemData.assets.length > 0) {
          const loadedAssets: UiAsset[] = itemData.assets.map((asset: any) => ({
            type: asset.includes('image') || asset.includes('jpg') || asset.includes('png') ? 'image' : 'video',
            url: asset,
            name: asset.split('/').pop() || 'asset',
            mimeType: asset.includes('image') ? 'image/*' : 'video/*',
            originalAsset: asset,
          }));
          this.assets.set(loadedAssets);
        }
        this.isModalOpen.set(true);
      },
      error: (err) => console.error('Error loading item details:', err),
    });
  }

  onSubmit() {
    if (!this.itemForm.valid) return;

    const formData = new FormData();
    const formValue = this.itemForm.value;
    
    // Add form fields
    Object.keys(formValue).forEach((key) => {
      const value = (formValue as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    // Add new file uploads only (not existing assets)
    this.assets().forEach((asset) => {
      if (asset.file) {
        formData.append('files', asset.file);
      }
    });

    const action = this.editingId()
      ? this.itemService.updateItem(this.editingId()!.toString(), formData)
      : this.itemService.createItem(formData);

    action.subscribe({
      next: () => {
        this.loadItems();
        this.closeModal();
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Error saving product: ' + (err.error?.message || err.message));
      },
    });
  }

  onFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files) return;

    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 10MB)`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const url = e.target.result;
        const type = file.type.startsWith('image') ? 'image' : 'video';
        this.assets.set([
          ...this.assets(),
          {
            type,
            url,
            name: file.name,
            mimeType: file.type,
            file,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  }

  removeAsset(index: number) {
    const updated = [...this.assets()];
    updated.splice(index, 1);
    this.assets.set(updated);
  }

  deleteItem(id: number) {
    const item = this.items().find(i => i.id === id);
    const itemName = item?.name || 'this product';
    
    const confirmed = confirm(
      `⚠️ DELETE PRODUCT\n\n` +
      `Are you sure you want to permanently delete "${itemName}"?\n\n` +
      `This action cannot be undone and will remove:\n` +
      `• Product details\n` +
      `• Associated inventory records\n` +
      `• Historical data\n\n` +
      `Click OK to confirm deletion.`
    );
    
    if (confirmed) {
      this.itemService.deleteItem(id.toString()).subscribe({
        next: () => {
          this.loadItems();
          alert(`✅ Product "${itemName}" has been deleted successfully.`);
        },
        error: (err) => {
          console.error('Error:', err);
          alert(`❌ Failed to delete product: ${err.error?.message || 'Unknown error'}`);
        },
      });
    }
  }

  toggleDisable(item: ApiItem) {
    const action = item.isDisabled ? 'enable' : 'disable';
    const actionUpper = item.isDisabled ? 'ENABLE' : 'DISABLE';
    
    const confirmed = confirm(
      `${item.isDisabled ? '✅' : '⚠️'} ${actionUpper} PRODUCT\n\n` +
      `Are you sure you want to ${action} "${item.name}"?\n\n` +
      (item.isDisabled 
        ? `This will make the product visible and available for orders.`
        : `This will hide the product from:\n` +
          `• Order creation screens\n` +
          `• Product listings\n` +
          `• Distributor views\n\n` +
          `The product can be re-enabled later.`) +
      `\n\nClick OK to confirm.`
    );
    
    if (confirmed) {
      this.itemService.disableItem(item.id, !item.isDisabled).subscribe({
        next: () => {
          this.loadItems();
          alert(`✅ Product "${item.name}" has been ${item.isDisabled ? 'enabled' : 'disabled'} successfully.`);
        },
        error: (err) => {
          console.error('Error:', err);
          alert(`❌ Failed to ${action} product: ${err.error?.message || 'Unknown error'}`);
        },
      });
    }
  }

  updateQuantity(id: number, qty: number) {
    if (qty <= 0) {
      const newCart = { ...this.cart() };
      delete newCart[id];
      this.cart.set(newCart);
    } else {
      const existing = this.cart()[id] || { orderedByBox: false, boxCount: 0 };
      this.cart.set({ ...this.cart(), [id]: { ...existing, qty } });
    }
  }

  toggleBoxOrdering(id: number) {
    const existing = this.cart()[id];
    if (!existing) return;
    this.cart.set({
      ...this.cart(),
      [id]: { ...existing, orderedByBox: !existing.orderedByBox },
    });
  }

  updateBoxCount(id: number, boxCount: number) {
    const existing = this.cart()[id];
    if (!existing) return;
    const item = this.items().find((i) => i.id === id);
    const unitsPerBox = item?.unitsPerBox || 1;
    const finalQty = boxCount * unitsPerBox;
    this.cart.set({
      ...this.cart(),
      [id]: { ...existing, boxCount, qty: finalQty },
    });
  }

  placeOrder() {
    const items = this.cartItems().map((ci) => ({
      itemId: ci.item.id,
      qty: ci.quantity,
      orderedByBox: ci.orderedByBox,
      boxCount: ci.orderedByBox ? ci.boxCount : undefined,
    }));
    this.orderService.createOrder({ items } as any).subscribe({
      next: () => {
        alert('Order placed successfully!');
        this.cart.set({});
      },
      error: (err) => {
        alert('Error placing order: ' + (err.error?.message || 'Unknown error'));
        console.error('Error:', err);
      },
    });
  }

  downloadSample() {
    this.excelService.downloadSampleExcel('items');
  }

  openBulkImport() {
    this.isBulkImportOpen.set(true);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files?.[0]) {
      this.selectedFile.set(target.files[0]);
    }
  }

  processBulkImport() {
    const file = this.selectedFile();
    if (!file) return;

    this.isImporting.set(true);
    this.excelService.parseExcel(file).then((result) => {
      if (!result.success) {
        this.uploadError.set(result.errors[0]);
        this.isImporting.set(false);
        return;
      }

      this.bulkImportService.importItems(result.data).subscribe({
        next: () => {
          this.loadItems();
          this.isBulkImportOpen.set(false);
          this.selectedFile.set(null);
          this.isImporting.set(false);
        },
        error: (err) => {
          this.uploadError.set(err.error?.message || 'Import failed');
          this.isImporting.set(false);
        },
      });
    });
  }
}
