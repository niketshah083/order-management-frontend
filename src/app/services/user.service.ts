import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ApiUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  role: 'super_admin' | 'customer' | 'manager' | 'distributor';
  gstin?: string;
  businessName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  creditLimitDays?: number;
  creditLimitAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  statusCode: number;
  data: ApiUser[];
  totalCount?: number;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  password: string;
  role: 'super_admin' | 'customer' | 'manager' | 'distributor';
  gstin?: string;
  businessName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  creditLimitDays?: number;
  creditLimitAmount?: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient) as HttpClient;
  private auth = inject(AuthService);
  private readonly API_URL = environment.APIUrl;

  getUsers(): Observable<UserResponse> {
    return this.http.get<UserResponse>(this.API_URL + '/users', {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getDistributors(): Observable<any> {
    return this.http.get(this.API_URL + '/users/distributors', {
      headers: this.auth.getAuthHeaders(),
    });
  }

  createUser(payload: CreateUserPayload): Observable<any> {
    return this.http.post(this.API_URL + '/users', payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  updateUser(id: string, payload: Partial<CreateUserPayload>): Observable<any> {
    return this.http.put(`${this.API_URL}/users/${id}`, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/users/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getDistributorById(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}/users/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  updateDistributor(id: number, data: any): Observable<any> {
    return this.http.put(`${this.API_URL}/users/${id}`, data, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  disableDistributor(id: number): Observable<any> {
    return this.http.put(`${this.API_URL}/users/${id}`, { isActive: false }, {
      headers: this.auth.getAuthHeaders(),
    });
  }
}
