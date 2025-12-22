import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'CUSTOMER' | 'DISTRIBUTOR' | 'MANAGER';
  avatar: string;
}

interface LoginResponse {
  statusCode: number;
  data: {
    accessToken: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient) as HttpClient;
  private router = inject(Router);

  private readonly API_URL = environment.APIUrl;
  private readonly TOKEN_KEY = 'omni_access_token';

  private _currentUser = signal<User | null>(this.getUserFromStorage());
  readonly currentUser = this._currentUser.asReadonly();

  login(credentials: { emailOrMobile: string; password: string }) {
    return this.http
      .post<LoginResponse>(this.API_URL + '/auth/login', credentials)
      .pipe(
        tap((response: LoginResponse) => {
          if (response.statusCode === 200 && response.data.accessToken) {
            this.setSession(response.data.accessToken);
          }
        })
      );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this._currentUser();
  }

  isAdmin(): boolean {
    return this._currentUser()?.role === 'SUPER_ADMIN';
  }

  isDistributor(): boolean {
    return this._currentUser()?.role === 'DISTRIBUTOR';
  }

  isManager(): boolean {
    return this._currentUser()?.role === 'MANAGER';
  }

  isCustomer(): boolean {
    return this._currentUser()?.role === 'CUSTOMER';
  }

  getCurrentUserRole(): string {
    return this._currentUser()?.role || '';
  }

  getCurrentUser(): any {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  getCurrentUserId(): string {
    return this._currentUser()?.id || '';
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      return new HttpHeaders();
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private setSession(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    const user = this.decodeToken(token);
    this._currentUser.set(user);
  }

  private getUserFromStorage(): User | null {
    const token = this.getToken();
    if (token) {
      return this.decodeToken(token);
    }
    return null;
  }

  private decodeToken(token: string): User {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token structure');

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );

      const decoded = JSON.parse(jsonPayload);

      let role: 'SUPER_ADMIN' | 'CUSTOMER' | 'DISTRIBUTOR' | 'MANAGER' = 'CUSTOMER';
      let name = 'User';

      if (decoded.role === 'super_admin') {
        role = 'SUPER_ADMIN';
        name = 'Super Admin';
      } else if (decoded.role === 'distributor') {
        role = 'DISTRIBUTOR';
        name = 'Distributor';
      } else if (decoded.role === 'manager') {
        role = 'MANAGER';
        name = 'Manager';
      } else if (decoded.role === 'customer') {
        role = 'CUSTOMER';
        name = 'Customer';
      }

      return {
        id: decoded.id?.toString() || '0',
        name: name,
        email: decoded.email || 'user@omni.com',
        role: role,
        avatar: `https://i.pravatar.cc/150?u=${decoded.id || 'default'}`,
      };
    } catch (e) {
      console.error('Error decoding token', e);
      return {
        id: '0',
        name: 'Guest',
        email: '',
        role: 'CUSTOMER' as const,
        avatar: '',
      };
    }
  }
}
