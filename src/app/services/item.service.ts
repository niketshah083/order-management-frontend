import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ApiItem {
  id: number;
  name: string;
  unit: string;
  rate: number;
  qty: number;
  alterQty?: number;
  gstRate?: number;
  categoryId?: string | number;
  categoryName?: string;
  subCategoryId?: string | number;
  assets: any[];
  assetsUrls?: string[]; // Signed URLs returned by API
  isDisabled?: boolean;
  hasBatchTracking?: boolean;
  hasSerialTracking?: boolean;
  hasExpiryDate?: boolean;
  hasBoxPackaging?: boolean;
  boxRate?: number;
  unitsPerBox?: number;
  stockQuantity?: number;
  inStock?: boolean;
}

export interface ItemResponse {
  statusCode: number;
  data: ApiItem[];
  message: string;
  totalCount: number;
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  private http = inject(HttpClient) as HttpClient;
  private auth = inject(AuthService);
  private readonly API_URL = environment.APIUrl;

  getItems(searchName?: string, searchUnit?: string, categoryId?: number, page?: number, limit?: number, sortBy?: string, sortOrder?: 'ASC' | 'DESC'): Observable<ItemResponse> {
    let params = new HttpParams();
    if (searchName) {
      params = params.set('searchName', searchName);
    }
    if (searchUnit) {
      params = params.set('searchUnit', searchUnit);
    }
    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }
    if (page) {
      params = params.set('page', page.toString());
    }
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    if (sortBy) {
      params = params.set('sortBy', sortBy);
    }
    if (sortOrder) {
      params = params.set('sortOrder', sortOrder);
    }

    return this.http.get<ItemResponse>(this.API_URL + '/items', {
      headers: this.auth.getAuthHeaders(),
      params
    });
  }

  disableItem(id: number, isDisabled: boolean): Observable<any> {
    return this.http.put(`${this.API_URL}/items/${id}/toggle-disable`, { isDisabled }, { headers: this.auth.getAuthHeaders() });
  }

  createItem(formData: FormData): Observable<any> {
    // Angular automatically sets Content-Type: multipart/form-data with boundary
    return this.http.post(this.API_URL + '/items', formData, {
      headers: this.auth.getAuthHeaders()
    });
  }

  updateItem(id: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.API_URL}/items/${id}`, formData, {
      headers: this.auth.getAuthHeaders()
    });
  }

  getItemById(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/items/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  deleteItem(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/items/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  bulkImportItems(data: any[]): Observable<any> {
    return this.http.post(
      `${this.API_URL}/items/bulk-import`,
      { items: data },
      {
        headers: this.auth.getAuthHeaders()
      }
    );
  }

  getItemsWithStockStatus(): Observable<ItemResponse> {
    return this.http.get<ItemResponse>(`${this.API_URL}/items/with-stock-status`, {
      headers: this.auth.getAuthHeaders()
    });
  }
}
