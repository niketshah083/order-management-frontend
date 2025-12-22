import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GrnService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.APIUrl}/grn`;

  createGrn(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, dto, {
      headers: this.auth.getAuthHeaders()
    });
  }

  getGrnDetail(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  getGrnsByPo(poId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/po/${poId}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  listGrnsForDistributor(distributorId: number, search?: string): Observable<any> {
    let url = `${this.apiUrl}/distributor/list/${distributorId}`;
    if (search) {
      url += `?search=${search}`;
    }
    return this.http.get(url, {
      headers: this.auth.getAuthHeaders()
    });
  }

  approveGrn(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/approve`, {}, {
      headers: this.auth.getAuthHeaders()
    });
  }

  updateGrnQuantities(id: number, updates: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/quantities`, updates, {
      headers: this.auth.getAuthHeaders()
    });
  }

  closePo(poId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/po/${poId}/close`, {}, {
      headers: this.auth.getAuthHeaders()
    });
  }

  splitPo(poId: number, items: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/po/${poId}/split`, { items }, {
      headers: this.auth.getAuthHeaders()
    });
  }

  listGrns(search?: string): Observable<any> {
    let url = `${this.apiUrl}/list`;
    if (search) {
      url += `?search=${search}`;
    }
    return this.http.get(url, {
      headers: this.auth.getAuthHeaders()
    });
  }
}
