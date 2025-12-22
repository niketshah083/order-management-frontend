import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentRequestService {
  private apiUrl = `${environment.APIUrl}/payment-requests`;

  constructor(private http: HttpClient) { }

  // Create payment request
  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Get all payment requests
  getAll(status?: string): Observable<any> {
    let url = this.apiUrl;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get(url);
  }

  // Get payment requests (legacy method)
  getPaymentRequests(status?: string): Observable<any> {
    return this.getAll(status);
  }

  // Get by distributor
  getByDistributor(distributorId: number, status?: string): Observable<any> {
    let url = `${this.apiUrl}/distributor/${distributorId}`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get(url);
  }

  // Get past due by distributor
  getPastDueByDistributor(distributorId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/distributor/${distributorId}/past-due`);
  }

  // Get single payment request
  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Update status
  updateStatus(id: number, status: string, reason?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status, reason });
  }

  // Record manual payment
  recordManualPayment(
    id: number,
    amountPaid: number,
    referenceNo: string,
    paymentDate?: string,
    isOfflinePayment?: boolean
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/record-manual-payment`, {
      amountPaid,
      referenceNo,
      paymentDate,
      isOfflinePayment
    });
  }

  // Create from purchase order
  createFromPO(poId: number, distributorId: number, amount: number, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/purchase-order/${poId}`, {
      distributorId,
      amount,
      reason
    });
  }

  // Create Razorpay link
  createRazorpayLink(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/create-razorpay-link`, {});
  }
}
