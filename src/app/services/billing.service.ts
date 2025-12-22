import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Customer } from './customer.service';
import { AuthService } from './auth.service';

export interface BatchSerialEntry {
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
}

export interface BillingItem {
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  rate: number;
  discount: number;
  discountType: 'percentage' | 'amount';
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  totalAmount: number;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  expiryStatus?: 'not_tracked' | 'expired' | 'expiring_soon' | 'valid';
  daysToExpiry?: number | null;
  batchSerialEntries?: BatchSerialEntry[];
  orderedByBox?: boolean;
  boxCount?: number;
  boxRate?: number;
  unitsPerBox?: number;
  inventoryId?: number;
}

export interface Billing {
  _id?: string;
  id?: number;
  billNo?: string;
  billDate: string;
  customerId: string | number;
  customer?: Customer;
  items?: BillingItem[];
  billingItems?: BillingItem[];
  subtotal: number;
  overallDiscount: number;
  overallDiscountType: 'percentage' | 'amount';
  totalAfterDiscount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  roundOff: number;
  finalAmount: number | string;
  notes?: string;
  status: 'draft' | 'approved' | 'completed';
  approvalStatus?: 'draft' | 'approved';
  paymentType?: 'cash' | 'online' | 'credit';
  paymentStatus?: 'pending' | 'partial' | 'completed';
  amountPaid?: number | string;
  amountDue?: number | string;
  cropName?: string;
  cropDiseases?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillingResponse {
  statusCode: number;
  data: Billing[];
  totalCount?: number;
  message?: string;
}

export interface SingleBillingResponse {
  statusCode: number;
  data: Billing;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.APIUrl}/billings`;

  getBillings(search?: string): Observable<BillingResponse> {
    const params = search ? { search } : undefined;
    return this.http.get<BillingResponse>(this.apiUrl, {
      headers: this.auth.getAuthHeaders(),
      ...(params ? { params } : {})
    });
  }

  downloadBillPDF(id: number | string): Observable<Blob> {
    return this.downloadPDF(id);
  }

  createBilling(billing: Partial<Billing>): Observable<SingleBillingResponse> {
    return this.http.post<SingleBillingResponse>(this.apiUrl, billing, {
      headers: this.auth.getAuthHeaders()
    });
  }

  updateBilling(id: string | number, billing: Partial<Billing>): Observable<SingleBillingResponse> {
    return this.http.patch<SingleBillingResponse>(`${this.apiUrl}/${id}`, billing, {
      headers: this.auth.getAuthHeaders()
    });
  }

  deleteBilling(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  completeBilling(id: string | number): Observable<SingleBillingResponse> {
    return this.http.patch<SingleBillingResponse>(
      `${this.apiUrl}/${id}/complete`,
      {},
      {
        headers: this.auth.getAuthHeaders()
      }
    );
  }

  downloadPDF(id: string | number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download-pdf`, {
      headers: this.auth.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  updateBillingStatus(id: string | number, status: string): Observable<SingleBillingResponse> {
    return this.http.patch<SingleBillingResponse>(
      `${this.apiUrl}/${id}`,
      { status },
      {
        headers: this.auth.getAuthHeaders()
      }
    );
  }

  searchItemsByBatchSerial(batchOrSerialNo: string): Observable<{ statusCode: number; data: any[]; message: string }> {
    return this.http.get<{ statusCode: number; data: any[]; message: string }>(`${this.apiUrl}/items-by-batch-serial`, {
      headers: this.auth.getAuthHeaders(),
      params: { batchOrSerialNo }
    });
  }

  recordPayment(id: number | string, amount: number, paymentMethod: string = 'cash', referenceNo?: string, notes?: string): Observable<SingleBillingResponse> {
    return this.http.post<SingleBillingResponse>(`${this.apiUrl}/${id}/record-payment`, { amount, paymentMethod, referenceNo, notes }, { headers: this.auth.getAuthHeaders() });
  }
}
