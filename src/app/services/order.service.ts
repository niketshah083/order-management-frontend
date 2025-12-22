import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ApiOrder {
  id: number;
  orderNo: string;
  totalAmount: string;
  deliveryWindow: string;
  createdAt: string;
  updatedAt: string;
  status?: string;
  createdByUser: { name: string };
  updatedByUser: { name: string };
  customer: { name: string };
}

export interface OrderResponse {
  statusCode: number;
  data: ApiOrder[];
  totalCount: number;
}

export interface CreateOrderItem {
  itemId: number;
  qty: number;
  orderedByBox?: boolean;
  boxCount?: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItem[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient) as HttpClient;
  private auth = inject(AuthService);
  private readonly API_URL = environment.APIUrl;

  getOrders(search?: string): Observable<OrderResponse> {
    const params = search ? { search } : undefined;
    return this.http.get<OrderResponse>(`${this.API_URL}/orders`, {
      headers: this.auth.getAuthHeaders(),
      ...(params ? { params } : {}),
    });
  }

  createOrder(payload: CreateOrderPayload): Observable<any> {
    return this.http.post(`${this.API_URL}/orders`, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  completeOrders(ids: number[]): Observable<any> {
    return this.http.put(
      `${this.API_URL}/orders/completeOrders`,
      { ids },
      {
        headers: this.auth.getAuthHeaders(),
      }
    );
  }
}
