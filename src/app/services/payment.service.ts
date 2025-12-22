import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const API_URL = (environment as any).APIUrl || (environment as any).apiUrl;

export interface RazorpayOrder {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentId: number;
  billing: {
    id: number;
    billNo: string;
    finalAmount: number;
    customerName: string;
    customerEmail?: string;
    customerContact?: string;
  };
}

export interface PaymentVerification {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface Payment {
  id: number;
  billingId: number;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  paymentMethod?: string;
  createdAt: string;
  billing?: any;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${API_URL}/payments`;

  // Load Razorpay script dynamically
  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Get Razorpay config (key ID)
  getConfig(): Observable<{ keyId: string }> {
    return this.http.get<{ keyId: string }>(`${this.apiUrl}/config`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // Create Razorpay order
  createOrder(billingId: number, amount: number, email?: string, contact?: string): Observable<RazorpayOrder> {
    return this.http.post<any>(`${this.apiUrl}/create-order`, { billingId, amount, email, contact }, { headers: this.auth.getAuthHeaders() }).pipe(
      map((response) => {
        // Handle wrapped response { statusCode, data } or direct response
        return response.data || response;
      })
    );
  }

  // Verify payment
  verifyPayment(verification: PaymentVerification): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify`, verification, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // Handle payment failure
  handleFailure(razorpayOrderId: string, errorCode: string, errorDescription: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/failure`, { razorpayOrderId, errorCode, errorDescription }, { headers: this.auth.getAuthHeaders() });
  }

  // Refund payment
  refundPayment(paymentId: number, amount?: number, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/refund`, { paymentId, amount, reason }, { headers: this.auth.getAuthHeaders() });
  }

  // Get all payments
  getPayments(distributorId?: number, status?: string): Observable<Payment[]> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (distributorId) params.push(`distributorId=${distributorId}`);
    if (status) params.push(`status=${status}`);
    if (params.length) url += '?' + params.join('&');

    return this.http.get<Payment[]>(url, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // Get payments for a billing
  getPaymentsByBilling(billingId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/billing/${billingId}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // Get payment by ID
  getPayment(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // Open Razorpay checkout
  async openCheckout(
    billingId: number,
    amount: number,
    options?: {
      email?: string;
      contact?: string;
      name?: string;
      description?: string;
    }
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    // Load Razorpay script
    const scriptLoaded = await this.loadRazorpayScript();
    if (!scriptLoaded) {
      return { success: false, error: 'Failed to load Razorpay SDK' };
    }

    return new Promise((resolve) => {
      // Create order first
      this.createOrder(billingId, amount, options?.email, options?.contact).subscribe({
        next: (orderResponse) => {
          const razorpayOptions = {
            key: orderResponse.keyId,
            amount: orderResponse.amount,
            currency: orderResponse.currency,
            name: options?.name || 'Order Management System',
            description: options?.description || `Payment for Invoice #${orderResponse.billing.billNo}`,
            order_id: orderResponse.orderId,
            prefill: {
              name: orderResponse.billing.customerName,
              email: orderResponse.billing.customerEmail || options?.email || '',
              contact: orderResponse.billing.customerContact || options?.contact || ''
            },
            theme: {
              color: '#4F46E5'
            },
            handler: (response: any) => {
              // Verify payment on success
              this.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              }).subscribe({
                next: () => {
                  resolve({ success: true, paymentId: response.razorpay_payment_id });
                },
                error: (err) => {
                  resolve({ success: false, error: err?.error?.message || 'Payment verification failed' });
                }
              });
            },
            modal: {
              ondismiss: () => {
                resolve({ success: false, error: 'Payment cancelled by user' });
              }
            }
          };

          const razorpay = new window.Razorpay(razorpayOptions);

          razorpay.on('payment.failed', (response: any) => {
            this.handleFailure(orderResponse.orderId, response.error.code, response.error.description).subscribe();
            resolve({
              success: false,
              error: response.error.description || 'Payment failed'
            });
          });

          razorpay.open();
        },
        error: (err) => {
          resolve({
            success: false,
            error: err?.error?.message || 'Failed to create payment order'
          });
        }
      });
    });
  }
}
