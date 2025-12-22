import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../services/customer.service';
import { ModalComponent } from '../shared/ui/modal.component';
import { AuthService } from '../../services/auth.service';
import { PincodeService, LocationData } from '../../services/pincode.service';

@Component({
  selector: 'app-customer-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent],
  template: `
    <div class="bg-indigo-50 p-3 md:p-6 max-w-7xl mx-auto min-h-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p class="text-gray-500 text-sm mt-0.5">Manage your customer database</p>
        </div>

        <button
          (click)="openModal()"
          class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      <!-- Search and Filter Section -->
      <div class="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div class="flex flex-col sm:flex-row gap-2 items-end">
          <div class="flex-1">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by name, mobile, email, city or state..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          <button (click)="performSearch()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm whitespace-nowrap">
            Search
          </button>
          <button (click)="clearSearch()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors font-medium text-sm whitespace-nowrap">
            Clear
          </button>
          <select
            [ngModel]="pageSize()"
            (change)="pageSize.set($any($event).target.value); currentPage.set(1); fetchCustomers()"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white text-sm"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      <!-- Table View -->
      <div class="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-950/5">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">State</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (customer of customers(); track customer.id) {
                <tr class="hover:bg-indigo-50/30 transition-colors">
                  <td class="px-6 py-4 font-semibold text-gray-900">{{ customer.mobileNo }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ customer.firstname }} {{ customer.lastname || '' }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ customer.emailId || '-' }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ customer.city || '-' }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ customer.state || '-' }}</td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex gap-2 justify-end">
                      <button
                        (click)="editCustomer(customer)"
                        class="text-blue-500 hover:text-blue-700 text-sm font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        (click)="toggleActive(customer)"
                        [class]="customer.isActive === false ? 'text-yellow-500 hover:text-yellow-700' : 'text-green-500 hover:text-green-700'"
                        class="text-sm font-medium hover:bg-yellow-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {{ customer.isActive === false ? 'Activate' : 'Inactivate' }}
                      </button>
                      <button
                        (click)="deleteCustomer(customer.id)"
                        class="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @if (customers().length === 0) {
                <tr>
                  <td colspan="6" class="px-6 py-8 text-center text-gray-500">No customers found</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Showing {{ (currentPage() - 1) * pageSize() + 1 }} to {{ Math.min(currentPage() * pageSize(), totalCount()) }} of {{ totalCount() }} customers
          </div>
          <div class="flex gap-2">
            <button
              (click)="previousPage()"
              [disabled]="currentPage() === 1"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Previous
            </button>
            <div class="flex items-center gap-2 px-2">
              <span class="text-sm font-medium">Page {{ currentPage() }} of {{ totalPages() }}</span>
            </div>
            <button
              (click)="nextPage()"
              [disabled]="currentPage() === totalPages()"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <app-modal [isOpen]="isModalOpen()" [title]="editingCustomer ? 'Edit Customer' : 'Add New Customer'" (close)="closeModal()">
        <div>
          <!-- Error Message Display -->
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

          <!-- Success Message Display -->
          @if (successMessage()) {
            <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-green-800 text-sm font-medium">Success</p>
                <p class="text-green-700 text-sm">{{ successMessage() }}</p>
              </div>
            </div>
          }
        </div>
        <form [formGroup]="customerForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Mobile Number - First and Required -->
          <div>
            <label class="text-sm font-semibold text-gray-700">Mobile Number <span class="text-red-500">*</span></label>
            <input
              type="tel"
              formControlName="mobileNo"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="10 digit mobile number"
            />
            @if (getFieldError('mobileNo')) {
              <p class="text-red-600 text-xs mt-1">{{ getFieldError('mobileNo') }}</p>
            }
          </div>

          <!-- Name Fields -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold text-gray-700">First Name <span class="text-red-500">*</span></label>
              <input
                type="text"
                formControlName="firstname"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="First Name"
              />
              @if (getFieldError('firstname')) {
                <p class="text-red-600 text-xs mt-1">{{ getFieldError('firstname') }}</p>
              }
            </div>
            <div>
              <label class="text-sm font-semibold text-gray-700">Last Name</label>
              <input
                type="text"
                formControlName="lastname"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Last Name (Optional)"
              />
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              formControlName="emailId"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="email@example.com (Optional)"
            />
            @if (getFieldError('emailId')) {
              <p class="text-red-600 text-xs mt-1">{{ getFieldError('emailId') }}</p>
            }
          </div>

          <!-- Address Section -->
          <div class="border-t border-gray-200 pt-4 mt-4">
            <p class="text-sm font-semibold text-gray-500 mb-3">Address (Optional)</p>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold text-gray-700">Address Line 1</label>
                <input
                  type="text"
                  formControlName="addressLine1"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Address (Optional)"
                />
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-700">Pincode</label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    formControlName="pincode"
                    maxlength="6"
                    class="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="6-digit pincode"
                  />
                  @if (pincodeLoading()) {
                    <div class="flex items-center px-3 text-indigo-600">
                      <span class="text-sm">Loading...</span>
                    </div>
                  }
                </div>
                @if (getFieldError('pincode')) {
                  <p class="text-red-600 text-xs mt-1">{{ getFieldError('pincode') }}</p>
                }
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label class="text-sm font-semibold text-gray-700">City</label>
                <input
                  type="text"
                  formControlName="city"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50"
                  placeholder="Auto-filled from pincode"
                  readonly
                />
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-700">State</label>
                <input
                  type="text"
                  formControlName="state"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50"
                  placeholder="Auto-filled from pincode"
                  readonly
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" (click)="closeModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button
              type="submit"
              [disabled]="customerForm.invalid"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-gray-400 transition-colors"
            >
              {{ editingCustomer ? 'Update Customer' : 'Save Customer' }}
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `
})
export class CustomerMasterComponent implements OnInit {
  customerService = inject(CustomerService);
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  pincodesService = inject(PincodeService);

  customers = signal<Customer[]>([]);
  isModalOpen = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);
  searchQuery = '';
  Math = Math;
  editingCustomer: Customer | null = null;
  errorMessage = signal('');
  successMessage = signal('');

  // Only firstname and mobileNo are required
  customerForm = this.fb.group({
    mobileNo: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    firstname: ['', Validators.required],
    lastname: [''],
    emailId: ['', Validators.email],
    addressLine1: [''],
    addressLine2: [''],
    city: [''],
    state: [''],
    pincode: ['', Validators.pattern('^[0-9]{6}$')]
  });

  pincodeLoading = signal(false);

  ngOnInit() {
    this.fetchCustomers();
    // Watch for pincode changes and auto-fill
    this.customerForm
      .get('pincode')
      ?.valueChanges.pipe()
      .subscribe(() => {
        this.onPincodeChange();
      });
  }

  fetchCustomers() {
    this.customerService.getCustomers(this.searchQuery || undefined, this.currentPage(), this.pageSize()).subscribe({
      next: (res) => {
        this.customers.set(res.data || []);
        this.totalCount.set(res.totalCount || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: (err) => console.error('Failed to fetch customers', err)
    });
  }

  performSearch() {
    this.currentPage.set(1);
    this.fetchCustomers();
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage.set(1);
    this.fetchCustomers();
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
      this.fetchCustomers();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((page) => page + 1);
      this.fetchCustomers();
    }
  }

  openModal() {
    this.customerForm.reset();
    this.editingCustomer = null;
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isModalOpen.set(true);
  }

  editCustomer(customer: Customer) {
    this.editingCustomer = customer;
    this.customerForm.patchValue(customer);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingCustomer = null;
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  getFieldError(fieldName: string): string {
    const field = this.customerForm.get(fieldName);
    if (!field || !field.errors) {
      return '';
    }

    // Only show errors if field is touched OR form was submitted
    if (!field.touched && !this.formSubmitAttempted) {
      return '';
    }

    if (field.errors['required']) {
      if (fieldName === 'mobileNo') return 'Mobile number is required';
      if (fieldName === 'firstname') return 'First name is required';
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['pattern']) {
      if (fieldName === 'mobileNo') {
        return 'Mobile number must be exactly 10 digits';
      }
      if (fieldName === 'pincode') {
        return 'Pincode must be exactly 6 digits';
      }
      return 'Invalid format';
    }

    return '';
  }

  formSubmitAttempted = false;

  onPincodeChange() {
    const pincode = this.customerForm.get('pincode')?.value;
    if (!pincode || pincode.length !== 6) {
      return;
    }

    this.pincodeLoading.set(true);
    this.pincodesService.getLocationByPincode(pincode).subscribe({
      next: (location: LocationData | null) => {
        if (location) {
          this.customerForm.patchValue(
            {
              city: location.city,
              state: location.state
            },
            { emitEvent: false }
          );
        }
        this.pincodeLoading.set(false);
      },
      error: () => {
        this.pincodeLoading.set(false);
      }
    });
  }

  onSubmit() {
    this.formSubmitAttempted = true;
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.customerForm.invalid) {
      this.errorMessage.set('Please fill in all required fields correctly');
      return;
    }

    const formValue = this.customerForm.value;
    const customerData: Partial<Customer> = {
      mobileNo: formValue.mobileNo ?? '',
      firstname: formValue.firstname ?? '',
      lastname: formValue.lastname || undefined,
      emailId: formValue.emailId || undefined,
      addressLine1: formValue.addressLine1 || undefined,
      addressLine2: formValue.addressLine2 || undefined,
      city: formValue.city || undefined,
      state: formValue.state || undefined,
      pincode: formValue.pincode || undefined
    };

    if (this.editingCustomer) {
      // Update existing customer
      this.customerService.updateCustomer(this.editingCustomer.id, customerData).subscribe({
        next: () => {
          this.successMessage.set('Customer updated successfully');
          setTimeout(() => {
            this.fetchCustomers();
            this.closeModal();
          }, 1000);
        },
        error: (err) => {
          const errorMsg = err.error?.error || err.error?.message || 'Failed to update customer';
          this.errorMessage.set(errorMsg);
        }
      });
    } else {
      // Create new customer
      this.customerService.createCustomer(customerData).subscribe({
        next: () => {
          this.successMessage.set('Customer created successfully');
          setTimeout(() => {
            this.currentPage.set(1);
            this.searchQuery = '';
            this.fetchCustomers();
            this.closeModal();
          }, 1000);
        },
        error: (err) => {
          const errorMsg = err.error?.error || err.error?.message || 'Failed to create customer';
          this.errorMessage.set(errorMsg);
        }
      });
    }
  }

  toggleActive(customer: Customer) {
    const newStatus = customer.isActive === false;
    const message = newStatus ? 'Activate' : 'Inactivate';
    if (confirm(`Are you sure you want to ${message.toLowerCase()} this customer?`)) {
      this.customerService.updateCustomer(customer.id, { isActive: newStatus }).subscribe({
        next: () => this.fetchCustomers(),
        error: () => alert(`Failed to ${message.toLowerCase()} customer`)
      });
    }
  }

  deleteCustomer(id: string) {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => this.fetchCustomers(),
        error: () => alert('Failed to delete customer')
      });
    }
  }
}
