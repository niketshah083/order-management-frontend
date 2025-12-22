import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface BatchDetail {
  id?: number;
  batchNumber: string;
  quantity: number;
  expiryDate?: string;
}

export interface SerialDetail {
  id?: number;
  serialNumber: string;
  expiryDate?: string;
}

@Injectable({ providedIn: 'root' })
export class BatchSerialService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly API_URL = environment.APIUrl;

  // Batch Operations
  createBatches(inventoryId: number, batches: BatchDetail[]): Observable<any> {
    return this.http.post(
      `${this.API_URL}/inventory/${inventoryId}/batches`,
      { itemId: 0, batches },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getBatchDetails(inventoryId: number): Observable<any> {
    return this.http.get(
      `${this.API_URL}/inventory/${inventoryId}/batches`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  uploadBatchExcel(inventoryId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.API_URL}/inventory/${inventoryId}/batches/upload-excel`,
      formData,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  // Serial Operations
  createSerials(inventoryId: number, serials: SerialDetail[]): Observable<any> {
    return this.http.post(
      `${this.API_URL}/inventory/${inventoryId}/serials`,
      { itemId: 0, serials },
      { headers: this.auth.getAuthHeaders() }
    );
  }

  getSerialDetails(inventoryId: number): Observable<any> {
    return this.http.get(
      `${this.API_URL}/inventory/${inventoryId}/serials`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  uploadSerialExcel(inventoryId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.API_URL}/inventory/${inventoryId}/serials/upload-excel`,
      formData,
      { headers: this.auth.getAuthHeaders() }
    );
  }
}
