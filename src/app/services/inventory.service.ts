import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface InventoryItem {
  id: string;
  itemId: string;
  quantity: number;
  reorderLevel: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  expiryStatus?: 'not_tracked' | 'expired' | 'expiring_soon' | 'valid';
  isExpired?: boolean;
  daysToExpiry?: number | null;
  item?: {
    id: number;
    name: string;
    unit: string;
    sku?: string;
  };
}

export interface InventoryResponse {
  statusCode: number;
  data: InventoryItem[];
  totalCount?: number;
  message?: string;
}

export interface SingleInventoryResponse {
  statusCode: number;
  data: InventoryItem;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.APIUrl}/inventory`;

  getInventory(search?: string): Observable<InventoryResponse> {
    let params: any = {};
    if (search) {
      params.search = search;
    }
    return this.http.get<InventoryResponse>(this.apiUrl, {
      headers: this.auth.getAuthHeaders(),
      params,
    });
  }

  getInventoryItem(id: string): Observable<SingleInventoryResponse> {
    return this.http.get<SingleInventoryResponse>(`${this.apiUrl}/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  addInventoryItem(
    itemId: string | number,
    quantity: number,
    reorderLevel?: number,
    notes?: string,
    batchNumber?: string,
    serialNumber?: string,
    expiryDate?: string,
  ): Observable<SingleInventoryResponse> {
    const data: any = {
      itemId: Number(itemId),
      quantity,
      reorderLevel: reorderLevel || 10,
    };
    if (notes) data.notes = notes;
    if (batchNumber) data.batchNumber = batchNumber;
    if (serialNumber) data.serialNumber = serialNumber;
    if (expiryDate) data.expiryDate = expiryDate;
    return this.http.post<SingleInventoryResponse>(this.apiUrl, data, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  addInventoryWithBatchSerials(
    itemId: number,
    quantity: number,
    reorderLevel?: number,
    notes?: string,
    batchDetails?: any[],
    serialDetails?: any[],
  ): Observable<SingleInventoryResponse> {
    const data: any = {
      itemId,
      quantity,
      reorderLevel: reorderLevel || 10,
    };
    if (notes) data.notes = notes;
    if (batchDetails && batchDetails.length > 0) data.batchDetails = batchDetails;
    if (serialDetails && serialDetails.length > 0) data.serialDetails = serialDetails;
    return this.http.post<SingleInventoryResponse>(this.apiUrl, data, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getBatchDetails(inventoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${inventoryId}/batches`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getSerialDetails(inventoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${inventoryId}/serials`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  updateInventoryItem(
    id: string,
    quantity?: number,
    reorderLevel?: number,
    notes?: string,
    batchNumber?: string,
    serialNumber?: string,
    expiryDate?: string,
  ): Observable<SingleInventoryResponse> {
    const data: any = {};
    if (quantity !== undefined) data.quantity = quantity;
    if (reorderLevel !== undefined) data.reorderLevel = reorderLevel;
    if (notes !== undefined) data.notes = notes;
    if (batchNumber !== undefined) data.batchNumber = batchNumber;
    if (serialNumber !== undefined) data.serialNumber = serialNumber;
    if (expiryDate !== undefined) data.expiryDate = expiryDate;

    return this.http.patch<SingleInventoryResponse>(`${this.apiUrl}/${id}`, data, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  adjustQuantity(id: string, quantityChange: number): Observable<SingleInventoryResponse> {
    return this.http.patch<SingleInventoryResponse>(
      `${this.apiUrl}/${id}/adjust`,
      { quantityChange },
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  getLowStockItems(): Observable<InventoryResponse> {
    return this.http.get<InventoryResponse>(`${this.apiUrl}/low-stock`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getOutOfStockItems(): Observable<InventoryResponse> {
    return this.http.get<InventoryResponse>(`${this.apiUrl}/out-of-stock`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  deleteInventoryItem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  downloadSampleInventory(): void {
    const url = `${this.apiUrl}/download/sample-inventory`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.setAttribute('style', 'display: none;');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  bulkImportInventory(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/bulk-import`, formData, {
      headers: this.auth.getAuthHeaders(),
    });
  }

  getAvailableForBilling(itemId?: number): Observable<InventoryResponse> {
    let params: any = {};
    if (itemId) {
      params.itemId = itemId;
    }
    return this.http.get<InventoryResponse>(`${this.apiUrl}/available-for-billing/all`, {
      headers: this.auth.getAuthHeaders(),
      params,
    });
  }
}
