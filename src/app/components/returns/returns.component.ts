import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemService } from '../../services/item.service';
import { ReturnsService } from '../../services/returns.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 p-6 max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Sales & Purchase Returns</h1>
      
      <!-- Tabs -->
      <div class="flex gap-4 mb-6 border-b border-gray-200">
        <button
          (click)="activeTab.set('sales')"
          [class.text-blue-600]="activeTab() === 'sales'"
          [class.border-b-2]="activeTab() === 'sales'"
          [class.border-blue-600]="activeTab() === 'sales'"
          class="pb-3 px-4 font-semibold transition"
        >
          Sales Returns (From Customer)
        </button>
        <button
          (click)="activeTab.set('purchase')"
          [class.text-blue-600]="activeTab() === 'purchase'"
          [class.border-b-2]="activeTab() === 'purchase'"
          [class.border-blue-600]="activeTab() === 'purchase'"
          class="pb-3 px-4 font-semibold transition"
        >
          Purchase Returns (From Distributor)
        </button>
      </div>

      <!-- Sales Returns Tab -->
      <div *ngIf="activeTab() === 'sales'" class="bg-white rounded-lg border border-gray-200">
        <div class="p-6">
          <h2 class="text-xl font-bold mb-4">Sales Returns (Items from Customers)</h2>
          
          <!-- Returns List -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="px-4 py-3 text-left">Return No</th>
                  <th class="px-4 py-3 text-left">Return Date</th>
                  <th class="px-4 py-3 text-left">Customer</th>
                  <th class="px-4 py-3 text-left">Item (with Image)</th>
                  <th class="px-4 py-3 text-right">Quantity</th>
                  <th class="px-4 py-3 text-right">Rate (₹)</th>
                  <th class="px-4 py-3 text-right">Total (₹)</th>
                  <th class="px-4 py-3 text-left">Reason</th>
                  <th class="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ret of filteredSalesReturns()" class="border-b hover:bg-gray-50">
                  <td class="px-4 py-3 font-mono text-xs">{{ ret.returnNo }}</td>
                  <td class="px-4 py-3">{{ ret.returnDate | date: 'dd MMM yyyy' }}</td>
                  <td class="px-4 py-3">
                    <div class="font-semibold">{{ ret.customer?.name || 'N/A' }}</div>
                    <div class="text-xs text-gray-500">{{ ret.customer?.email || '' }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <img 
                        *ngIf="ret.item?.image" 
                        [src]="ret.item.image" 
                        class="w-8 h-8 rounded object-cover"
                        [title]="ret.item?.name"
                      />
                      <span *ngIf="!ret.item?.image" class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">—</span>
                      <span>{{ ret.item?.name || 'N/A' }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">{{ ret.quantity }}</td>
                  <td class="px-4 py-3 text-right">{{ ret.rate | number: '1.2-2' }}</td>
                  <td class="px-4 py-3 text-right font-semibold">₹{{ (ret.quantity * ret.rate) | number: '1.2-2' }}</td>
                  <td class="px-4 py-3 text-sm">{{ ret.reason }}</td>
                  <td class="px-4 py-3">
                    <span [ngClass]="{
                      'bg-yellow-100 text-yellow-800': ret.status === 'pending',
                      'bg-green-100 text-green-800': ret.status === 'approved',
                      'bg-red-100 text-red-800': ret.status === 'rejected'
                    }" class="px-3 py-1 rounded-full text-xs font-semibold">
                      {{ ret.status | titlecase }}
                    </span>
                  </td>
                </tr>
                <tr *ngIf="filteredSalesReturns().length === 0">
                  <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                    No sales returns found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Purchase Returns Tab -->
      <div *ngIf="activeTab() === 'purchase'" class="bg-white rounded-lg border border-gray-200">
        <div class="p-6">
          <h2 class="text-xl font-bold mb-4">Purchase Returns (Items from Distributors)</h2>
          
          <!-- Returns List -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="px-4 py-3 text-left">Return No</th>
                  <th class="px-4 py-3 text-left">Return Date</th>
                  <th class="px-4 py-3 text-left">Distributor</th>
                  <th class="px-4 py-3 text-left">Item (with Image)</th>
                  <th class="px-4 py-3 text-right">Quantity</th>
                  <th class="px-4 py-3 text-right">Rate (₹)</th>
                  <th class="px-4 py-3 text-right">Total (₹)</th>
                  <th class="px-4 py-3 text-left">Reason</th>
                  <th class="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ret of filteredPurchaseReturns()" class="border-b hover:bg-gray-50">
                  <td class="px-4 py-3 font-mono text-xs">{{ ret.returnNo }}</td>
                  <td class="px-4 py-3">{{ ret.returnDate | date: 'dd MMM yyyy' }}</td>
                  <td class="px-4 py-3">
                    <div class="font-semibold">{{ ret.distributor?.name || 'N/A' }}</div>
                    <div class="text-xs text-gray-500">{{ ret.distributor?.email || '' }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <img 
                        *ngIf="ret.item?.image" 
                        [src]="ret.item.image" 
                        class="w-8 h-8 rounded object-cover"
                        [title]="ret.item?.name"
                      />
                      <span *ngIf="!ret.item?.image" class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">—</span>
                      <span>{{ ret.item?.name || 'N/A' }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">{{ ret.quantity }}</td>
                  <td class="px-4 py-3 text-right">{{ ret.rate | number: '1.2-2' }}</td>
                  <td class="px-4 py-3 text-right font-semibold">₹{{ (ret.quantity * ret.rate) | number: '1.2-2' }}</td>
                  <td class="px-4 py-3 text-sm">{{ ret.reason }}</td>
                  <td class="px-4 py-3">
                    <span [ngClass]="{
                      'bg-yellow-100 text-yellow-800': ret.status === 'pending',
                      'bg-green-100 text-green-800': ret.status === 'approved',
                      'bg-red-100 text-red-800': ret.status === 'rejected'
                    }" class="px-3 py-1 rounded-full text-xs font-semibold">
                      {{ ret.status | titlecase }}
                    </span>
                  </td>
                </tr>
                <tr *ngIf="filteredPurchaseReturns().length === 0">
                  <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                    No purchase returns found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReturnsComponent implements OnInit {
  private itemService = inject(ItemService);
  private returnsService = inject(ReturnsService);
  private auth = inject(AuthService);

  activeTab = signal<'sales' | 'purchase'>('sales');
  salesReturns = signal<any[]>([]);
  purchaseReturns = signal<any[]>([]);

  // Sales Returns - all users can view all
  filteredSalesReturns = computed(() => {
    return this.salesReturns();
  });

  // Purchase Returns - only distributor who created it, their manager, and admins
  // Backend filters based on role, so frontend just displays filtered data
  filteredPurchaseReturns = computed(() => {
    const userRole = this.auth.getCurrentUserRole();
    
    if (userRole === 'SUPER_ADMIN' || userRole === 'MANAGER') {
      // Admin and Manager see all
      return this.purchaseReturns();
    } else if (userRole === 'DISTRIBUTOR') {
      // Distributor - backend returns only their own
      return this.purchaseReturns();
    }
    return [];
  });

  ngOnInit() {
    this.loadReturns();
  }

  loadReturns() {
    this.returnsService.getSalesReturns().subscribe({
      next: (response) => {
        this.salesReturns.set(response.data || []);
      },
      error: (err) => console.error('Failed to load sales returns:', err),
    });

    this.returnsService.getPurchaseReturns().subscribe({
      next: (response) => {
        this.purchaseReturns.set(response.data || []);
      },
      error: (err) => console.error('Failed to load purchase returns:', err),
    });
  }
}
