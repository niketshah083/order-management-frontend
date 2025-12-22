import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GlobalSearchService } from '../../services/global-search.service';
import { debounceTime, Subject, Subscription } from 'rxjs';

interface SearchResult {
  type: 'customer' | 'item' | 'bill';
  id: number;
  label: string;
  description?: string;
  data?: any;
}

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full md:w-80">
      <div class="relative">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch($event)"
          (keydown)="onKeyDown($event)"
          placeholder="Search batch/serial, items, bills..."
          class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
        />
      </div>

      <!-- Search Results Dropdown -->
      @if (showResults() && (results().length > 0 || searchQuery.trim() !== '')) {
      <div
        class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
      >
        @if (results().length > 0) {
        <div class="divide-y">
          @for (result of results(); track result.id) {
          <button
            (click)="selectResult(result)"
            class="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-start justify-between"
          >
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ result.label }}</div>
              @if (result.description) {
              <div class="text-xs text-gray-500 mt-0.5">{{ result.description }}</div>
              }
            </div>
            <span
              class="ml-2 px-2 py-1 text-xs font-medium rounded-full"
              [ngClass]="{
                'bg-blue-100 text-blue-700': result.type === 'customer',
                'bg-green-100 text-green-700': result.type === 'item',
                'bg-purple-100 text-purple-700': result.type === 'bill'
              }"
            >
              {{ result.type }}
            </span>
          </button>
          }
        </div>
        } @else {
        <div class="px-4 py-6 text-center text-gray-500 text-sm">
          No results found for "{{ searchQuery }}"
        </div>
        }
      </div>
      }
    </div>
  `,
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
  private searchService = inject(GlobalSearchService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  searchQuery = '';
  results = signal<SearchResult[]>([]);
  showResults = signal(false);

  ngOnInit() {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300))
      .subscribe((query: string) => {
        if (query.trim().length > 2) {
          this.performSearch(query);
        } else {
          this.results.set([]);
          this.showResults.set(false);
        }
      });

    document.addEventListener('click', (e: Event) => {
      if (!(e.target as HTMLElement).closest('.relative')) {
        this.showResults.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.showResults.set(true);
    this.searchSubject.next(query);
  }

  private performSearch(query: string) {
    const userRole = this.auth.currentUser()?.role;

    if (userRole === 'DISTRIBUTOR') {
      // For distributors: search batch/serial customers first
      this.searchService.searchCustomersByBatchSerial(query).subscribe({
        next: (response: any) => {
          if (response?.data && Array.isArray(response.data)) {
            const customerResults: SearchResult[] = response.data.map((c: any) => ({
              type: 'customer',
              id: c.id,
              label: `${c.firstname} ${c.lastname}`,
              description: `${c.city}, ${c.state}`,
              data: c,
            }));
            this.results.set(customerResults);
          }
        },
        error: () => this.results.set([]),
      });
    } else {
      // For admin/manager: search billings
      this.searchService.searchBillings(query).subscribe({
        next: (response: any) => {
          if (response?.data && Array.isArray(response.data)) {
            const billResults: SearchResult[] = response.data.map((b: any) => ({
              type: 'bill',
              id: b.id,
              label: `Bill #${b.billNo}`,
              description: b.customer ? `${b.customer.firstname} ${b.customer.lastname}` : 'Unknown Customer',
              data: b,
            }));
            this.results.set(billResults);
          }
        },
        error: () => this.results.set([]),
      });
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.showResults.set(false);
      this.searchQuery = '';
    }
  }

  selectResult(result: SearchResult) {
    if (result.type === 'customer') {
      this.router.navigate(['/customers']);
    } else if (result.type === 'bill') {
      this.router.navigate(['/billing-history']);
    }
    this.showResults.set(false);
    this.searchQuery = '';
    this.results.set([]);
  }
}
