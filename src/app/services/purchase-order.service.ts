import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface PurchaseOrderItem {
  itemId: number;
  quantity: number;
}

export interface CreatePurchaseOrderPayload {
  items: PurchaseOrderItem[];
  distributorId?: number; // For admin creating PO on behalf of distributor
}

export interface ApiPurchaseOrder {
  id: number;
  poNo: string;
  totalAmount: number;
  status: string;
  approvalStatus?: string;
  createdAt: string;
  updatedAt: string;
  distributorId?: number;
  distributor: { name: string };
  items: Array<{ item: { name: string; rate: number }; quantity: number }>;
}

export interface PurchaseOrderResponse {
  statusCode: number;
  data: ApiPurchaseOrder[];
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private http = inject(HttpClient) as HttpClient;
  private auth = inject(AuthService);
  private readonly API_URL = environment.APIUrl;

  getPurchaseOrders(
    search?: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string,
    distributorId?: number,
  ): Observable<any> {
    const params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;
    params.page = page;
    params.limit = limit;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (distributorId) params.distributorId = distributorId;

    return this.http.get<any>(`${this.API_URL}/purchase-orders`, {
      headers: this.auth.getAuthHeaders(),
      params,
    });
  }

  createPurchaseOrder(payload: CreatePurchaseOrderPayload): Observable<any> {
    return this.http.post(`${this.API_URL}/purchase-orders`, payload, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getPurchaseOrderById(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}/purchase-orders/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  updatePurchaseOrderStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.API_URL}/purchase-orders/${id}`, { status }, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  uploadInvoice(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.API_URL}/purchase-orders/${id}/upload-invoice`, formData, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  createPaymentRequest(orderId: number, distributorId: number, amount: number, reason?: string): Observable<any> {
    return this.http.post(
      `${this.API_URL}/payment-requests/purchase-order/${orderId}`,
      { distributorId, amount, reason },
      { headers: this.auth.getAuthHeaders() },
    );
  }

  markAsDelivered(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}/purchase-orders/${id}/mark-delivered`, {}, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  updatePurchaseOrder(id: number, items: Array<{itemId: number; quantity: number}>): Observable<any> {
    return this.http.put(`${this.API_URL}/purchase-orders/${id}/edit`, { items }, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  deletePurchaseOrder(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/purchase-orders/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  approvePurchaseOrder(id: number): Observable<any> {
    return this.http.put(`${this.API_URL}/purchase-orders/${id}/approve`, {}, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  rejectPurchaseOrder(id: number, reason: string): Observable<any> {
    return this.http.put(`${this.API_URL}/purchase-orders/${id}/reject`, { reason }, {
      headers: this.auth.getAuthHeaders(),
    });
  }
}

// Billing Service
export interface ApiBilling {
  id: number;
  billNo: string;
  billDate: string;
  customerId: number;
  distributorId: number;
  totalAmount: number;
  finalAmount: number;
  status: 'draft' | 'approved' | 'completed';
  approvalStatus: 'draft' | 'approved';
  approvedAt?: Date;
  approvedBy?: number;
  invoiceNo?: string;
  paymentStatus: 'pending' | 'partial' | 'completed';
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly API_URL = environment.APIUrl;

  getBillings(search?: string, status?: string): Observable<any> {
    const params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;

    return this.http.get<any>(`${this.API_URL}/billings`, {
      headers: this.auth.getAuthHeaders(),
      params,
    });
  }

  getBillingById(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}/billings/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  updateBilling(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.API_URL}/billings/${id}`, data, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  approveBilling(id: number): Observable<any> {
    return this.http.patch(`${this.API_URL}/billings/${id}/approve`, {}, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  completeBilling(id: number): Observable<any> {
    return this.http.patch(`${this.API_URL}/billings/${id}/complete`, {}, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  deleteBilling(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/billings/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  printInvoice(id: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/billings/${id}/download-pdf`, {
      headers: this.auth.getAuthHeaders(),
      responseType: 'blob',
    });
  }
}
