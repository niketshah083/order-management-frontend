import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Customer {
  id: string;
  firstname: string;
  lastname: string;
  mobileNo: string;
  emailId?: string;
  gstin?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerResponse {
  statusCode: number;
  data: Customer[];
  totalCount?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  message?: string;
}

export interface SingleCustomerResponse {
  statusCode: number;
  data: Customer;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.APIUrl}/customers`;

  getCustomers(
    search?: string,
    page: number = 1,
    limit: number = 10,
  ): Observable<CustomerResponse> {
    let params: any = { page: page.toString(), limit: limit.toString() };
    if (search) {
      params.search = search;
    }
    return this.http.get<CustomerResponse>(this.apiUrl, {
      headers: this.auth.getAuthHeaders(),
      params,
    });
  }

  createCustomer(
    customer: Partial<Customer>,
  ): Observable<SingleCustomerResponse> {
    return this.http.post<SingleCustomerResponse>(this.apiUrl, customer, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  updateCustomer(
    id: string,
    customer: Partial<Customer>,
  ): Observable<SingleCustomerResponse> {
    return this.http.patch<SingleCustomerResponse>(
      `${this.apiUrl}/${id}`,
      customer,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  deleteCustomer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }
}
