import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6"
    >
      <div
        class="bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-md text-center border border-white/50 animate-in fade-in zoom-in duration-300"
      >
        <div class="mb-6 flex justify-center">
          <img
            src="/logo.png"
            alt="Re-Invent Invoicing"
            class="h-20 w-20 object-contain drop-shadow-lg"
          />
        </div>

        <h1
          class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-amber-600 bg-clip-text text-transparent mb-3 tracking-tight"
        >
          Re-Invent Invoicing
        </h1>
        <p class="text-gray-500 mb-8 text-sm sm:text-base">
          Sign in to your account
        </p>

        <form
          [formGroup]="loginForm"
          (ngSubmit)="onSubmit()"
          class="space-y-4 text-left"
        >
          <div class="space-y-1.5">
            <label class="text-sm font-bold text-gray-700 ml-1"
              >Email or Mobile</label
            >
            <input
              type="text"
              formControlName="emailOrMobile"
              class="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
              placeholder="admin@example.com"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-bold text-gray-700 ml-1">Password</label>
            <input
              type="password"
              formControlName="password"
              class="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
              placeholder="••••••••"
            />
          </div>

          @if (error()) {
          <div
            class="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ error() }}
          </div>
          }

          <button
            type="submit"
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            @if (isLoading()) {
            <svg
              class="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Signing in... } @else { Sign In
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
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            }
          </button>
        </form>

        <p class="mt-8 text-xs text-gray-400">Powered by Re-Invent Invoicing</p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isLoading = signal(false);
  error = signal<string | null>(null);

  loginForm = this.fb.group({
    emailOrMobile: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.error.set(null);

      const { emailOrMobile, password } = this.loginForm.value;

      this.auth
        .login({ emailOrMobile: emailOrMobile!, password: password! })
        .subscribe({
          next: () => {
            // Redirect to role-specific dashboard
            const role = this.auth.getCurrentUserRole();
            let dashboardRoute = '/items'; // default for customer

            if (role === 'SUPER_ADMIN') {
              dashboardRoute = '/dashboard';
            } else if (role === 'MANAGER') {
              dashboardRoute = '/payment-tracking';
            } else if (role === 'DISTRIBUTOR') {
              dashboardRoute = '/distributor-dashboard';
            }

            this.router.navigate([dashboardRoute]);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error(err);
            this.isLoading.set(false);
            this.error.set('Invalid credentials or server error');
          },
        });
    }
  }
}
