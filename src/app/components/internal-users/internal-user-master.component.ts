import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import {
  InternalUserService,
  ApiInternalUser,
  CreateInternalUserPayload,
} from '../../services/internal-user.service';
import { UserService, ApiUser } from '../../services/user.service';
import { ModalComponent } from '../shared/ui/modal.component';

@Component({
  selector: 'app-internal-user-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent],
  template: `
    <div class="bg-indigo-50 p-4 md:p-6 max-w-7xl mx-auto">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4"
      >
        <div>
          <h1
            class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight"
          >
            User Management
          </h1>
          <p class="text-gray-500 text-sm mt-1">
            Manage internal users and access control
          </p>
        </div>
        <button
          (click)="openModal()"
          class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 font-medium flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add User
        </button>
      </div>

      <!-- Desktop Table View -->
      <div
        class="hidden md:block bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden ring-1 ring-gray-950/5"
      >
        <table class="w-full text-left">
          <thead class="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th
                class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                User Profile
              </th>
              <th
                class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Mobile
              </th>
              <th
                class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Assigned Distributors
              </th>
              <th
                class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (user of users(); track user.id) {
            <tr class="hover:bg-indigo-50/30 transition-colors">
              <td class="px-6 py-4 flex items-center gap-4">
                <div
                  class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200"
                >
                  {{ user.firstName.charAt(0).toUpperCase() }}{{ user.lastName.charAt(0).toUpperCase() }}
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
                  [ngClass]="
                    user.role === 'super_admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  "
                >
                  {{ user.role === 'super_admin' ? 'Super Admin' : 'Manager' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">
                @if (user.role === 'manager' && user.distributorIds && user.distributorIds.length > 0) {
                  <span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {{ user.distributorIds.length }} distributor(s)
                  </span>
                } @else {
                  <span class="text-gray-400">-</span>
                }
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  (click)="deleteUser(user.id)"
                  class="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </td>
            </tr>
            } @if (users().length === 0) {
            <tr>
              <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                No users found
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-4">
        @for (user of users(); track user.id) {
        <div
          class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-[0.99] transition-transform"
        >
          <div
            class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 flex-shrink-0"
          >
            {{ user.firstName.charAt(0).toUpperCase() }}{{ user.lastName.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-900 truncate">{{ user.firstName }} {{ user.lastName }}</h3>
            <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
            <p class="text-xs text-gray-500 truncate mb-1.5">
              {{ user.mobileNo }}
            </p>
            <span
              class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border"
              [ngClass]="
                user.role === 'super_admin'
                  ? 'bg-purple-50 text-purple-700 border-purple-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              "
            >
              {{ user.role === 'super_admin' ? 'Super Admin' : 'Manager' }}
            </span>
          </div>
          <button
            (click)="deleteUser(user.id)"
            class="p-2 text-red-500 bg-red-50 rounded-lg active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
        }
      </div>

      <app-modal
        [isOpen]="isModalOpen()"
        title="Create New User"
        (close)="isModalOpen.set(false)"
      >
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">First Name</label>
              <input
                type="text"
                formControlName="firstName"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="John"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">Last Name</label>
              <input
                type="text"
                formControlName="lastName"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Doe"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700"
                >Email Address</label
              >
              <input
                type="email"
                formControlName="email"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="john@example.com"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-bold text-gray-700">Mobile No</label>
              <input
                type="text"
                formControlName="mobileNo"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-bold text-gray-700">Password</label>
            <input
              type="password"
              formControlName="password"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-bold text-gray-700">Role</label>
            <div class="relative">
              <select
                formControlName="role"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none"
              >
                <option value="">Select Role</option>
                <option value="super_admin">Super Admin</option>
                <option value="manager">Manager</option>
              </select>
              <div
                class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          @if (userForm.get('role')?.value === 'manager') {
          <div class="space-y-1.5">
            <label class="text-sm font-bold text-gray-700">Assign Distributors</label>
            <input
              type="text"
              [(ngModel)]="distributorSearchText"
              (ngModelChange)="filterDistributors($event)"
              placeholder="Search distributors..."
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-2"
            />
            <div class="border border-gray-300 rounded-xl p-3 max-h-48 overflow-y-auto">
              @if (filteredDistributors().length === 0) {
                <p class="text-sm text-gray-500 text-center py-2">No distributors available</p>
              } @else {
                @for (distributor of filteredDistributors(); track distributor.id) {
                  <label class="flex items-center gap-2 py-2 hover:bg-gray-50 rounded px-2 cursor-pointer">
                    <input
                      type="checkbox"
                      [checked]="selectedDistributors().includes(distributor.id)"
                      (change)="toggleDistributor(distributor.id)"
                      class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span class="text-sm text-gray-700">{{ distributor.firstName }} {{ distributor.lastName }}</span>
                  </label>
                }
              }
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ selectedDistributors().length }} distributor(s) selected
            </p>
          </div>
          }

          <div class="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              [disabled]="userForm.invalid"
              class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl disabled:bg-indigo-300 shadow-lg shadow-indigo-200 transition-all"
            >
              Create User
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
})
export class InternalUserMasterComponent implements OnInit {
  internalUserService = inject(InternalUserService);
  userService = inject(UserService);
  fb = inject(FormBuilder);

  users = signal<ApiInternalUser[]>([]);
  distributors = signal<ApiUser[]>([]);
  filteredDistributors = signal<ApiUser[]>([]);
  selectedDistributors = signal<number[]>([]);
  isModalOpen = signal(false);
  distributorSearchText = '';

  userForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobileNo: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['', Validators.required],
  });

  ngOnInit() {
    this.fetchUsers();
    this.fetchDistributors();
  }

  fetchUsers() {
    this.internalUserService.getInternalUsers().subscribe({
      next: (response) => {
        if (response.data) {
          this.users.set(response.data);
        }
      },
      error: (err) => console.error('Failed to fetch users', err),
    });
  }

  fetchDistributors() {
    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response.data) {
          this.distributors.set(response.data);
          this.filteredDistributors.set(response.data);
        }
      },
      error: (err) => console.error('Failed to fetch distributors', err),
    });
  }

  filterDistributors(searchText: string) {
    if (!searchText) {
      this.filteredDistributors.set(this.distributors());
      return;
    }

    const filtered = this.distributors().filter(
      (dist) =>
        `${dist.firstName} ${dist.lastName}`
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
        dist.email.toLowerCase().includes(searchText.toLowerCase())
    );
    this.filteredDistributors.set(filtered);
  }

  toggleDistributor(distributorId: number) {
    this.selectedDistributors.update((selected) => {
      if (selected.includes(distributorId)) {
        return selected.filter(id => id !== distributorId);
      } else {
        return [...selected, distributorId];
      }
    });
  }

  openModal() {
    this.userForm.reset({ role: '' });
    this.selectedDistributors.set([]);
    this.isModalOpen.set(true);
  }

  onSubmit() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;

      const payload: CreateInternalUserPayload = {
        firstName: formValue.firstName!,
        lastName: formValue.lastName!,
        email: formValue.email!,
        mobileNo: formValue.mobileNo!,
        password: formValue.password!,
        role: formValue.role as 'super_admin' | 'manager',
      };

      if (formValue.role === 'manager' && this.selectedDistributors().length > 0) {
        payload.distributorIds = this.selectedDistributors();
      }

      this.internalUserService.createInternalUser(payload).subscribe({
        next: () => {
          this.fetchUsers();
          this.isModalOpen.set(false);
        },
        error: (err) => alert('Failed to create user'),
      });
    }
  }

  deleteUser(id: number) {
    if (confirm('Remove this user?')) {
      this.internalUserService.deleteInternalUser(id.toString()).subscribe({
        next: () => this.fetchUsers(),
        error: (err) => alert('Failed to delete user'),
      });
    }
  }
}
