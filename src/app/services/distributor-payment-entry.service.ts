import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface DistributorPaymentEntry {
  id: number;
  distributorId: number;
  paymentDate: string;
  paymentMode: string;
  amount: number;
  chequeNo?: string;
  attachmentUrl?: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminRemarks?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DistributorPaymentEntryService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly API_URL = environment.APIUrl;

  createPaymentEntry(formData: FormData): Observable<any> {
    return this.http.post(`${this.API_URL}/distributor-payment-entries`, formData, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getMyPaymentEntries(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.API_URL}/distributor-payment-entries/my-entries`, {
      headers: this.auth.getAuthHeaders(),
      params: { page: page.toString(), limit: limit.toString() },
    });
  }

  getAllPaymentEntries(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.API_URL}/distributor-payment-entries`, {
      headers: this.auth.getAuthHeaders(),
      params: { page: page.toString(), limit: limit.toString() },
    });
  }

  getPaymentEntryById(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}/distributor-payment-entries/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  approvePaymentEntry(id: number, dto: any): Observable<any> {
    return this.http.patch(`${this.API_URL}/distributor-payment-entries/${id}/status`, dto, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getPendingPaymentEntries(): Observable<any> {
    return this.http.get(`${this.API_URL}/distributor-payment-entries/pending/all`, {
      headers: this.auth.getAuthHeaders(),
    });
  }
}
