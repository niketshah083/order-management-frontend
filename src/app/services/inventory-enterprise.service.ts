import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Interfaces
export interface Warehouse {
  id: number;
  code: string;
  name: string;
  type: 'MAIN' | 'TRANSIT' | 'RETURNS' | 'QUARANTINE';
  distributorId: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactPerson?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface InventoryLot {
  id: number;
  lotNumber: string;
  itemId: number;
  item?: { id: number; name: string; sku?: string; unit?: string };
  manufactureDate?: string;
  expiryDate?: string;
  receivedDate?: string;
  supplierId?: number;
  supplierBatchNo?: string;
  purchaseOrderId?: number;
  grnId?: number;
  unitCost?: number;
  landedCost?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'BLOCKED' | 'CONSUMED';
  qualityStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'QUARANTINE';
  distributorId?: number;
  warehouseId?: number;
  createdAt: string;
}

export interface InventorySerial {
  id: number;
  serialNumber: string;
  itemId: number;
  item?: { id: number; name: string; sku?: string; unit?: string };
  lotId?: number;
  lot?: InventoryLot;
  currentWarehouseId?: number;
  currentWarehouse?: Warehouse;
  currentOwnerType: 'COMPANY' | 'DISTRIBUTOR' | 'CUSTOMER';
  currentOwnerId?: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RETURNED' | 'DAMAGED' | 'SCRAPPED';
  qualityStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'QUARANTINE';
  receivedDate?: string;
  soldDate?: string;
  unitCost?: number;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  distributorId?: number;
  createdAt: string;
}

export interface StockBalance {
  itemId: number;
  itemName: string;
  warehouseId: number;
  warehouseName: string;
  lotId?: number;
  lotNumber?: string;
  expiryDate?: string;
  onHand: number;
  reserved: number;
  available: number;
  avgCost?: number;
}

export interface AvailableLot {
  lotId: number;
  lotNumber: string;
  expiryDate?: string;
  unitCost: number;
  availableQuantity: number;
}

export interface InventoryTransaction {
  id: number;
  transactionNo: string;
  transactionDate: string;
  transactionType: string;
  movementType: 'IN' | 'OUT' | 'RESERVE' | 'RELEASE' | 'ADJUST';
  itemId: number;
  item?: { id: number; name: string; sku?: string };
  lotId?: number;
  lot?: InventoryLot;
  serialId?: number;
  serial?: InventorySerial;
  quantity: number;
  warehouseId: number;
  warehouse?: Warehouse;
  referenceType?: string;
  referenceNo?: string;
  unitCost?: number;
  totalCost?: number;
  runningBalance?: number;
  remarks?: string;
  createdAt: string;
}

export interface ExpiringLot {
  lot: InventoryLot;
  availableQuantity: number;
  daysToExpiry: number;
}

// Response interfaces
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  totalCount?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryEnterpriseService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.APIUrl}/inventory-v2`;

  // ═══════════════════════════════════════════════════════════════
  // WAREHOUSE METHODS
  // ═══════════════════════════════════════════════════════════════

  getWarehouses(): Observable<ApiResponse<Warehouse[]>> {
    return this.http.get<ApiResponse<Warehouse[]>>(`${this.apiUrl}/warehouses`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  createWarehouse(data: Partial<Warehouse>): Observable<ApiResponse<Warehouse>> {
    return this.http.post<ApiResponse<Warehouse>>(`${this.apiUrl}/warehouses`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // STOCK BALANCE METHODS
  // ═══════════════════════════════════════════════════════════════

  getStockBalance(itemId?: number, warehouseId?: number): Observable<ApiResponse<StockBalance[]>> {
    let params: any = {};
    if (itemId) params.itemId = itemId;
    if (warehouseId) params.warehouseId = warehouseId;

    return this.http.get<ApiResponse<StockBalance[]>>(`${this.apiUrl}/stock-balance`, {
      headers: this.auth.getAuthHeaders(),
      params
    });
  }

  getAvailableLots(itemId: number, warehouseId: number, strategy: 'FIFO' | 'FEFO' = 'FEFO'): Observable<ApiResponse<AvailableLot[]>> {
    return this.http.get<ApiResponse<AvailableLot[]>>(`${this.apiUrl}/available-lots/${itemId}`, {
      headers: this.auth.getAuthHeaders(),
      params: { warehouseId, strategy }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // LOT METHODS
  // ═══════════════════════════════════════════════════════════════

  getLots(itemId: number): Observable<ApiResponse<InventoryLot[]>> {
    return this.http.get<ApiResponse<InventoryLot[]>>(`${this.apiUrl}/lots`, {
      headers: this.auth.getAuthHeaders(),
      params: { itemId }
    });
  }

  getLotById(id: number): Observable<ApiResponse<InventoryLot>> {
    return this.http.get<ApiResponse<InventoryLot>>(`${this.apiUrl}/lots/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  createLot(data: Partial<InventoryLot>): Observable<ApiResponse<InventoryLot>> {
    return this.http.post<ApiResponse<InventoryLot>>(`${this.apiUrl}/lots`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SERIAL METHODS
  // ═══════════════════════════════════════════════════════════════

  getSerials(itemId: number, warehouseId?: number): Observable<ApiResponse<InventorySerial[]>> {
    let params: any = { itemId };
    if (warehouseId) params.warehouseId = warehouseId;

    return this.http.get<ApiResponse<InventorySerial[]>>(`${this.apiUrl}/serials`, {
      headers: this.auth.getAuthHeaders(),
      params
    });
  }

  lookupSerial(serialNumber: string): Observable<ApiResponse<InventorySerial>> {
    return this.http.get<ApiResponse<InventorySerial>>(`${this.apiUrl}/serials/lookup/${serialNumber}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  createSerial(data: Partial<InventorySerial>): Observable<ApiResponse<InventorySerial>> {
    return this.http.post<ApiResponse<InventorySerial>>(`${this.apiUrl}/serials`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // TRANSACTION METHODS
  // ═══════════════════════════════════════════════════════════════

  getTransactions(params: { itemId?: number; lotId?: number; serialId?: number; warehouseId?: number; limit?: number }): Observable<ApiResponse<InventoryTransaction[]>> {
    return this.http.get<ApiResponse<InventoryTransaction[]>>(`${this.apiUrl}/transactions`, {
      headers: this.auth.getAuthHeaders(),
      params: params as any
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPIRY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  getExpiringLots(days: number = 30): Observable<ApiResponse<ExpiringLot[]>> {
    return this.http.get<ApiResponse<ExpiringLot[]>>(`${this.apiUrl}/expiring-lots`, {
      headers: this.auth.getAuthHeaders(),
      params: { days }
    });
  }
}
