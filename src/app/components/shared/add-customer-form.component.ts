import { Component, inject, signal, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CustomerService, Customer } from '../../services/customer.service';
import { PincodeService } from '../../services/pincode.service';

interface LocationData {
  city: string;
  state: string;
  country?: string;
}

@Component({
  selector: 'app-add-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="customerForm" (ngSubmit)="onSubmit()" class="space-y-4">
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
            <label class="text-sm font-semibold text-gray-700">Pincode <span class="text-red-500">*</span></label>
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
            @if (pincodeError()) {
              <p class="text-red-600 text-xs mt-1">{{ pincodeError() }}</p>
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
        <button type="button" (click)="onCancel()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
        <button type="submit" [disabled]="customerForm.invalid" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-gray-400 transition-colors">
          {{ isEditing ? 'Update Customer' : 'Save Customer' }}
        </button>
      </div>
    </form>
  `
})
export class AddCustomerFormComponent implements OnInit {
  @Input() isEditing = false;
  @Input() initialData: Partial<Customer> | null = null;
  @Output() submitted = new EventEmitter<Partial<Customer>>();
  @Output() cancelled = new EventEmitter<void>();

  private customerService = inject(CustomerService);
  private pincodesService = inject(PincodeService);
  private fb = inject(FormBuilder);

  pincodeLoading = signal(false);
  pincodeError = signal('');
  errorMessage = signal('');
  successMessage = signal('');
  formSubmitAttempted = false;

  // mobileNo, firstname, and pincode are required
  customerForm = this.fb.group({
    mobileNo: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    firstname: ['', Validators.required],
    lastname: [''],
    emailId: ['', Validators.email],
    addressLine1: [''],
    addressLine2: [''],
    city: [''],
    state: [''],
    pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
  });

  ngOnInit() {
    if (this.initialData) {
      this.customerForm.patchValue(this.initialData);
    }

    this.customerForm
      .get('pincode')
      ?.valueChanges.pipe()
      .subscribe(() => {
        this.onPincodeChange();
      });
  }

  getFieldError(fieldName: string): string {
    const field = this.customerForm.get(fieldName);
    if (!field || !field.errors) {
      return '';
    }

    if (!field.touched && !this.formSubmitAttempted) {
      return '';
    }

    if (field.errors['required']) {
      if (fieldName === 'mobileNo') return 'Mobile number is required';
      if (fieldName === 'firstname') return 'First name is required';
      if (fieldName === 'pincode') return 'Pincode is required';
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

  onPincodeChange() {
    const pincode = this.customerForm.get('pincode')?.value;
    this.pincodeError.set('');

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
          this.pincodeError.set('');
        } else {
          this.pincodeError.set('Pincode not found');
          this.customerForm.patchValue(
            {
              city: '',
              state: ''
            },
            { emitEvent: false }
          );
        }
        this.pincodeLoading.set(false);
      },
      error: () => {
        this.pincodeError.set('Error fetching location data');
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

    this.submitted.emit(customerData);
  }

  onCancel() {
    this.cancelled.emit();
  }
}
