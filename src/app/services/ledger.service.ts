import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class LedgerService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.APIUrl;

  // Get distributor ledger
  getDistributorLedger(distributorId: number, limit?: number, offset?: number): Observable<any> {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    
    return this.http.get(`${this.apiUrl}/ledger/distributor/${distributorId}`, {
      params,
      headers: this.auth.getAuthHeaders(),
    });
  }

  // Get ledger summary
  getLedgerSummary(distributorId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/ledger/distributor/${distributorId}/summary`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  // Export ledger as PDF
  exportLedgerPDF(distributorId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/ledger/distributor/${distributorId}/export-pdf`, {
      headers: this.auth.getAuthHeaders(),
      responseType: 'blob',
    });
  }

  // Export ledger as CSV
  exportLedgerCSV(distributorId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/ledger/distributor/${distributorId}/export-csv`, {
      headers: this.auth.getAuthHeaders(),
      responseType: 'blob',
    });
  }

  // Download ledger file
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Create ledger entry
  createEntry(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ledger`, data, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  // Delete ledger entry
  deleteEntry(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/ledger/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }
}
