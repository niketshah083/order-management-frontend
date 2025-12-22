import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BulkImportService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.APIUrl;

  importCustomers(data: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/bulk-import-distributors`, { data });
  }

  importDistributors(data: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/bulk-import-distributors`, { data });
  }

  importItems(data: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/items/bulk-import`, { data: data }, {
      
    });
  }

  importCategories(data: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories/bulk-import`, { data }, {
      
    });
  }

  importSubCategories(data: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories/bulk-import`, { data }, {
      
    });
  }
}
