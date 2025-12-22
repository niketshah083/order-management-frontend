import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Category {
  id: number;
  name: string;
  description?: string;
  parentCategoryId?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: Category[];
}

interface CategoriesResponse {
  statusCode: number;
  data: Category[];
  message: string;
}

interface SingleCategoryResponse {
  statusCode: number;
  data: Category;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.APIUrl}/categories`;

  getCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(this.apiUrl, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getCategoriesFlat(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(`${this.apiUrl}/all`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getCategoryById(id: number): Observable<SingleCategoryResponse> {
    return this.http.get<SingleCategoryResponse>(`${this.apiUrl}/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  createCategory(data: Partial<Category>): Observable<SingleCategoryResponse> {
    return this.http.post<SingleCategoryResponse>(this.apiUrl, data, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  updateCategory(id: number, data: Partial<Category>): Observable<SingleCategoryResponse> {
    return this.http.patch<SingleCategoryResponse>(`${this.apiUrl}/${id}`, data, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  bulkImportCategories(data: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk-import`, { data }, {
      headers: this.auth.getAuthHeaders(),
    });
  }
}
