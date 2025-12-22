import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalSearchService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.APIUrl}/billings`;

  searchCustomersByBatchSerial(batchOrSerialNo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customers-by-batch-serial`, {
      params: { batchOrSerialNo },
      headers: this.auth.getAuthHeaders(),
    });
  }

  searchBillings(searchQuery: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}`, {
      params: { search: searchQuery },
      headers: this.auth.getAuthHeaders(),
    });
  }
}
