import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ReturnsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.APIUrl;

  // Purchase Returns
  createPurchaseReturn(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/returns/purchase`, data, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getPurchaseReturns(distributorId?: string): Observable<any> {
    const params = distributorId ? { distributorId } : undefined;
    return this.http.get(`${this.apiUrl}/returns/purchase`, {
      params,
      headers: this.auth.getAuthHeaders(),
    });
  }

  approvePurchaseReturn(id: number, status: 'approved' | 'rejected', adminComments?: string, rejectionReason?: string): Observable<any> {
    const body: any = { status };
    if (adminComments) body.adminComments = adminComments;
    if (rejectionReason) body.rejectionReason = rejectionReason;
    return this.http.patch(`${this.apiUrl}/returns/purchase/${id}/approve`, body, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  // Sales Returns
  createSalesReturn(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/returns/sales`, data, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getSalesReturns(distributorId?: string): Observable<any> {
    const params = distributorId ? { distributorId } : undefined;
    return this.http.get(`${this.apiUrl}/returns/sales`, {
      params,
      headers: this.auth.getAuthHeaders(),
    });
  }
}
