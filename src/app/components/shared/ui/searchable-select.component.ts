import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative">
      <input
        type="text"
        [(ngModel)]="searchText"
        (ngModelChange)="onSearch($event)"
        placeholder="{{ placeholder }}"
        class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
      />
      @if (isOpen && filteredOptions().length > 0) {
        <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          @for (option of filteredOptions(); track option.id) {
            <div
              (click)="selectOption(option)"
              class="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              {{ option.label }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SearchableSelectComponent {
  @Input() options: { id: number; label: string }[] = [];
  @Input() placeholder = 'Search...';
  @Output() selected = new EventEmitter<number>();

  searchText = '';
  isOpen = false;
  filteredOptions = signal<{ id: number; label: string }[]>([]);

  onSearch(value: string) {
    this.isOpen = value.length > 0;
    if (value.length === 0) {
      this.filteredOptions.set([]);
      return;
    }

    const filtered = this.options.filter((opt) =>
      opt.label.toLowerCase().includes(value.toLowerCase())
    );
    this.filteredOptions.set(filtered);
  }

  selectOption(option: { id: number; label: string }) {
    this.selected.emit(option.id);
    this.searchText = '';
    this.isOpen = false;
    this.filteredOptions.set([]);
  }
}
