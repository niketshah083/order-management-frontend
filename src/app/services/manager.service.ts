import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ManagerService {
  private http = inject(HttpClient);
  private apiUrl = environment.APIUrl;

  // Payment Requests
  getPaymentRequests(status?: string): Observable<any> {
    const params = status ? { status } : undefined;
    return this.http.get(`${this.apiUrl}/payment-requests`, {
      params,
    });
  }

  updatePaymentStatus(
    id: string,
    status: string,
    reason?: string,
  ): Observable<any> {
    return this.http.patch(`${this.apiUrl}/payment-requests/${id}/status`, {
      status,
      reason,
    });
  }

  // Order Approval/Rejection
  approveOrder(orderId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/orders/${orderId}/approve`, {});
  }

  rejectOrder(orderId: string, reason: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/orders/${orderId}/reject`, {
      reason,
    });
  }

  // Order Summary
  getOrderSummary(month?: string): Observable<any> {
    const params = month ? { month } : undefined;
    return this.http.get(`${this.apiUrl}/orders/summary`, {
      params,
    });
  }
}
