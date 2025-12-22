import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, ApiUser, CreateUserPayload } from '../../services/user.service';
import { SearchableSelectComponent } from '../shared/ui/searchable-select.component';
import { ModalComponent } from '../shared/ui/modal.component';
import { ExcelService } from '../../services/excel.service';
import { BulkImportService } from '../../services/bulk-import.service';

@Component({
  selector: 'app-user-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent],
  template: `
    <div class="p-4 md:p-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {{ isDistributorMode() ? 'Distributors' : 'Users' }}
          </h1>
          <p class="text-gray-500 text-sm mt-1">
            {{ isDistributorMode() ? 'Manage distributors and their information' : 'Manage all system users' }}
          </p>
        </div>
        <div class="flex gap-2 flex-wrap">
          @if (isDistributorMode()) {
            <button
              (click)="downloadSample()"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 font-medium text-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Sample Excel
            </button>
            <button
              (click)="openBulkImport()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 font-medium text-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Bulk Import
            </button>
          }
          <button
            (click)="openModal()"
            class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 font-medium flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ isDistributorMode() ? 'Add Distributor' : 'Add User' }}
          </button>
        </div>
      </div>

      <!-- Desktop Table View -->
      <div class="hidden md:block bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden ring-1 ring-gray-950/5">
        <table class="w-full text-left">
          <thead class="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Distributor Profile</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (user of users(); track user.id) {
              <tr class="hover:bg-indigo-50/30 transition-colors">
                <td class="px-6 py-4 flex items-center gap-4">
                  <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                    {{ (user.firstName || 'U').charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-semibold text-gray-900">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="text-xs text-gray-500">{{ user.email }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ user.mobileNo }}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="px-3 py-1 rounded-full text-xs font-semibold border"
                    [ngClass]="user.role === 'super_admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'"
                  >
                    {{ user.role === 'super_admin' ? 'Super Admin' : 'Distributor' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right space-x-2 flex justify-end">
                  <button (click)="editUser(user)" class="text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button
                    (click)="toggleUserDisable(user)"
                    [class.text-yellow-600]="true"
                    [class.text-green-600]="false"
                    [class.hover:bg-yellow-50]="true"
                    [class.hover:bg-green-50]="false"
                    class="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:text-gray-700"
                  >
                    {{ false ? '✓ Enable' : '⊗ Disable' }}
                  </button>
                  <button (click)="deleteUser(user.id)" class="text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                    Remove
                  </button>
                </td>
              </tr>
            }
            @if (users().length === 0) {
              <tr>
                <td colspan="4" class="px-6 py-8 text-center text-gray-500">No distributors found</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-4">
        @for (user of users(); track user.id) {
          <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-[0.99] transition-transform">
            <div class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 flex-shrink-0">
              {{ (user.firstName || 'U').charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-gray-900 truncate">{{ user.firstName }} {{ user.lastName }}</h3>
              <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
              <p class="text-xs text-gray-500 truncate mb-1.5">
                {{ user.mobileNo }}
              </p>
              <span
                class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border"
                [ngClass]="user.role === 'super_admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'"
              >
                {{ user.role === 'super_admin' ? 'Super Admin' : 'Distributor' }}
              </span>
            </div>
            <div class="flex gap-1">
              <button (click)="editUser(user)" class="p-2 text-blue-500 bg-blue-50 rounded-lg active:scale-95" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                (click)="toggleUserDisable(user)"
                [class.text-yellow-500]="!false"
                [class.text-green-500]="false"
                [class.bg-yellow-50]="!false"
                [class.bg-green-50]="false"
                class="p-2 rounded-lg active:scale-95"
                [title]="false ? 'Enable' : 'Disable'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </button>
              <button (click)="deleteUser(user.id)" class="p-2 text-red-500 bg-red-50 rounded-lg active:scale-95" title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Add/Edit Distributor Modal -->
      <app-modal [isOpen]="isModalOpen()" [title]="getModalTitle()" (close)="isModalOpen.set(false)">
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <!-- Role Selection (Users Mode Only) -->
          @if (!isDistributorMode()) {
            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">Role*</label>
              <select formControlName="role" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                <option value="super_admin">Super Admin</option>
                <option value="distributor">Distributor</option>
                <option value="manager">Manager</option>
              </select>
              @if (userForm.get('role')?.invalid && userForm.get('role')?.touched) {
                <p class="text-xs text-red-600 mt-1">Role is required</p>
              }
            </div>
          }

          <!-- GSTIN (Distributor Mode Only) -->
          @if (isDistributorMode() || userForm.get('role')?.value === 'distributor') {
            <!-- GSTIN -->
            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">GSTIN</label>
              <input
                type="text"
                formControlName="gstin"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="12AABCT1234H1Z0"
              />
            </div>

            <!-- Business Name -->
            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">Business Name</label>
              <input
                type="text"
                formControlName="businessName"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Your Business Name"
              />
            </div>
          }

          <!-- Owner Name -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">Owner First Name*</label>
              <input
                type="text"
                formControlName="firstName"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="John"
              />
              @if (userForm.get('firstName')?.invalid && userForm.get('firstName')?.touched) {
                <p class="text-xs text-red-600 mt-1">First name is required</p>
              }
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">Owner Last Name*</label>
              <input
                type="text"
                formControlName="lastName"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Doe"
              />
              @if (userForm.get('lastName')?.invalid && userForm.get('lastName')?.touched) {
                <p class="text-xs text-red-600 mt-1">Last name is required</p>
              }
            </div>
          </div>

          <!-- Email & Mobile -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">Email Address*</label>
              <input
                type="email"
                formControlName="email"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="john@example.com"
              />
              @if (userForm.get('email')?.invalid && userForm.get('email')?.touched) {
                <p class="text-xs text-red-600 mt-1">Valid email is required</p>
              }
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">Mobile No*</label>
              <input
                type="text"
                formControlName="mobileNo"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="9876543210"
              />
              @if (userForm.get('mobileNo')?.invalid && userForm.get('mobileNo')?.touched) {
                <p class="text-xs text-red-600 mt-1">10-digit mobile number required</p>
              }
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label class="text-sm font-bold text-gray-700">
              Password
              @if (!editingUserId) {
                <span class="text-red-500">*</span>
              } @else {
                <span class="text-gray-500 text-xs">(not required to edit)</span>
              }
            </label>
            <input
              type="password"
              formControlName="password"
              [disabled]="editingUserId !== null"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              [placeholder]="editingUserId ? '(Not changed)' : '••••••••'"
            />
            @if (userForm.get('password')?.invalid && userForm.get('password')?.touched && !editingUserId) {
              <p class="text-xs text-red-600 mt-1">Password must be at least 6 characters</p>
            }
            @if (editingUserId) {
              <p class="text-xs text-gray-500 mt-1">Password field is disabled in edit mode. Leave blank to keep current password.</p>
            }
          </div>

          <!-- Credit Limits Section (Distributor Only) -->
          @if (isDistributorMode() || userForm.get('role')?.value === 'distributor') {
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
              <h3 class="text-sm font-semibold text-blue-900">Credit Limits</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-sm font-bold text-gray-700">Credit Limit (Days)</label>
                  <input
                    type="number"
                    formControlName="creditLimitDays"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="30"
                    min="0"
                  />
                  <p class="text-xs text-gray-500 mt-1">Number of payment days</p>
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-bold text-gray-700">Credit Limit (₹ Amount)</label>
                  <input
                    type="number"
                    formControlName="creditLimitAmount"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="100000"
                    min="0"
                  />
                  <p class="text-xs text-gray-500 mt-1">Maximum credit amount in rupees</p>
                </div>
              </div>
            </div>
          }

          <!-- Address Section (Distributor Only) -->
          @if (isDistributorMode() || userForm.get('role')?.value === 'distributor') {
            <div class="pt-4 border-t border-gray-200">
              <h3 class="text-sm font-semibold text-gray-700 mb-4">Address Information</h3>
            </div>

            <!-- Address Line 1 & 2 -->
            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">Address Line 1</label>
              <input
                type="text"
                formControlName="addressLine1"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Street address"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">Address Line 2</label>
              <input
                type="text"
                formControlName="addressLine2"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Apartment, suite, etc."
              />
            </div>

            <!-- City, State, Pincode -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="text-sm font-bold text-gray-700">City</label>
                <input
                  type="text"
                  formControlName="city"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Mumbai"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-sm font-bold text-gray-700">State</label>
                <input
                  type="text"
                  formControlName="state"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Maharashtra"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-sm font-bold text-gray-700">Pincode</label>
                <input
                  type="text"
                  formControlName="pincode"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="400001"
                />
              </div>
            </div>
          }

          <!-- Submit Button -->
          <div class="pt-4 border-t border-gray-100 flex justify-end gap-2">
            <button type="button" (click)="isModalOpen.set(false)" class="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium">Cancel</button>
            <button
              type="submit"
              [disabled]="userForm.invalid"
              class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:bg-indigo-300 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all font-medium"
            >
              {{ getSubmitButtonText() }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Bulk Import Modal -->
      <app-modal [isOpen]="isBulkImportOpen()" title="Bulk Import Distributors" (close)="isBulkImportOpen.set(false)">
        <div class="space-y-4">
          <div class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer" (click)="fileInput.click()">
            <input #fileInput type="file" accept=".xlsx,.xls,.csv" (change)="onFileSelected($event)" class="hidden" />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <p class="text-sm text-gray-600">Click to upload or drag and drop</p>
            <p class="text-xs text-gray-500 mt-1">Supported formats: XLSX, XLS, CSV</p>
          </div>

          @if (selectedFile()) {
            <div class="bg-green-50 border border-green-200 rounded-lg p-3">
              <p class="text-sm font-medium text-green-900">Selected: {{ selectedFile()?.name }}</p>
            </div>
          }

          @if (importError()) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm font-medium text-red-900">
                {{ importError() }}
              </p>
            </div>
          }

          <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" (click)="isBulkImportOpen.set(false)" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button
              type="button"
              (click)="processBulkImport()"
              [disabled]="!selectedFile() || isImporting()"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-gray-400 transition-colors"
            >
              {{ isImporting() ? 'Importing...' : 'Import' }}
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `
})
export class UserMasterComponent implements OnInit {
  userService = inject(UserService);
  fb = inject(FormBuilder);
  excelService = inject(ExcelService);
  bulkImportService = inject(BulkImportService);
  router = inject(Router);

  users = signal<ApiUser[]>([]);
  isModalOpen = signal(false);
  isBulkImportOpen = signal(false);
  selectedFile = signal<File | null>(null);
  isImporting = signal(false);
  importError = signal('');
  editingUserId: number | null = null;

  // Detect if we're in distributor mode or users mode
  isDistributorMode = signal(false);

  userForm = this.fb.group({
    role: ['distributor', Validators.required],
    gstin: [''],
    businessName: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobileNo: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    creditLimitDays: [0, [Validators.min(0)]],
    creditLimitAmount: [0, [Validators.min(0)]],
    addressLine1: [''],
    addressLine2: [''],
    city: [''],
    state: [''],
    pincode: ['']
  });

  ngOnInit() {
    // Detect route to determine mode
    const currentUrl = this.router.url;
    this.isDistributorMode.set(currentUrl.includes('/distributors'));

    this.fetchUsers();
  }

  getModalTitle(): string {
    if (this.editingUserId) {
      return this.isDistributorMode() ? 'Edit Distributor' : 'Edit User';
    }
    return this.isDistributorMode() ? 'Create New Distributor' : 'Create New User';
  }

  getSubmitButtonText(): string {
    if (this.editingUserId) {
      return this.isDistributorMode() ? 'Save Distributor' : 'Save User';
    }
    return this.isDistributorMode() ? 'Create Distributor' : 'Create User';
  }

  fetchUsers() {
    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response.data && Array.isArray(response.data)) {
          // Filter based on mode
          if (this.isDistributorMode()) {
            // Show only distributors
            const distributors = response.data.filter((user) => user.role === 'distributor');
            this.users.set(distributors);
          } else {
            // Show all users
            this.users.set(response.data);
          }
        } else {
          this.users.set([]);
        }
      },
      error: (err) => {
        console.error('Failed to fetch users', err);
        this.users.set([]);
      }
    });
  }

  openModal() {
    this.editingUserId = null;
    this.userForm.reset();

    // Set default role based on mode
    if (this.isDistributorMode()) {
      this.userForm.patchValue({ role: 'distributor' });
    } else {
      this.userForm.patchValue({ role: 'super_admin' });
    }

    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.enable();
    this.userForm.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  openBulkImport() {
    this.selectedFile.set(null);
    this.importError.set('');
    this.isBulkImportOpen.set(true);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.selectedFile.set(files[0]);
      this.importError.set('');
    }
  }

  async processBulkImport() {
    const file = this.selectedFile();
    if (!file) return;

    this.isImporting.set(true);
    try {
      const result = await this.excelService.parseExcel(file);
      if (!result.success) {
        this.importError.set(result.errors[0] || 'Failed to parse Excel');
        this.isImporting.set(false);
        return;
      }

      this.bulkImportService.importDistributors(result.data).subscribe({
        next: () => {
          this.fetchUsers();
          this.isBulkImportOpen.set(false);
          this.selectedFile.set(null);
          alert('Bulk import successful!');
          this.isImporting.set(false);
        },
        error: (err) => {
          this.importError.set(err.error?.message || 'Failed to import distributors');
          this.isImporting.set(false);
        }
      });
    } catch (error: any) {
      this.importError.set(error.message || 'Error processing file');
      this.isImporting.set(false);
    }
  }

  downloadSample() {
    this.excelService.downloadSampleExcel('distributors');
  }

  onSubmit() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;

      const payload: CreateUserPayload = {
        firstName: formValue.firstName!,
        lastName: formValue.lastName!,
        email: formValue.email!,
        mobileNo: formValue.mobileNo!,
        password: formValue.password || 'no-change',
        role: (formValue.role as any) || 'distributor',
        gstin: formValue.gstin || undefined,
        addressLine1: formValue.addressLine1 || undefined,
        addressLine2: formValue.addressLine2 || undefined,
        city: formValue.city || undefined,
        state: formValue.state || undefined,
        pincode: formValue.pincode || undefined,
        businessName: formValue.businessName || undefined,
        creditLimitDays: formValue.creditLimitDays || 0,
        creditLimitAmount: formValue.creditLimitAmount || 0
      };

      if (this.editingUserId) {
        // Update existing user
        this.userService.updateUser(this.editingUserId.toString(), payload).subscribe({
          next: () => {
            this.fetchUsers();
            this.isModalOpen.set(false);
            this.editingUserId = null;
            alert('Distributor updated successfully!');
          },
          error: (err) => alert('Failed to update distributor')
        });
      } else {
        // Create new user
        this.userService.createUser(payload).subscribe({
          next: () => {
            this.fetchUsers();
            this.isModalOpen.set(false);
            alert('Distributor created successfully!');
          },
          error: (err) => alert('Failed to create distributor')
        });
      }
    }
  }

  editUser(user: ApiUser) {
    this.editingUserId = user.id;
    this.userForm.patchValue({
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobileNo: user.mobileNo,
      gstin: user.gstin,
      businessName: user.businessName,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      creditLimitDays: user.creditLimitDays || 0,
      creditLimitAmount: user.creditLimitAmount || 0,
      password: ''
    });
    // Disable password field in edit mode
    this.userForm.get('password')?.setValidators([]);
    this.userForm.get('password')?.disable();
    this.userForm.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  toggleUserDisable(user: ApiUser) {
    if (confirm('Update this distributor?')) {
      this.userService
        .updateUser(user.id.toString(), {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobileNo: user.mobileNo
        })
        .subscribe({
          next: () => {
            this.fetchUsers();
          },
          error: (err) => alert('Failed to update distributor')
        });
    }
  }

  deleteUser(id: number) {
    if (confirm('Remove this distributor?')) {
      this.userService.deleteUser(id.toString()).subscribe({
        next: () => this.fetchUsers(),
        error: (err) => alert('Failed to delete distributor')
      });
    }
  }
}
