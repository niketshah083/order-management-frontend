import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { BarcodeScannerComponent } from '../shared/barcode-scanner/barcode-scanner.component';

interface GrnInfo {
  grnNo: string;
  createdAt: Date;
  approvedAt: Date | null;
  approvedByUser: string | null;
  status: string;
}

interface BillingInfo {
  billNo: string;
  customerId: number;
  customerName: string;
  customerCity: string;
  quantitySold?: number;
  distributorId?: number;
  distributorName?: string;
  amount: number;
  date: string;
  status: string;
}

interface TraceResult {
  batchNumber?: string;
  itemId: string;
  itemName: string;
  quantity?: number;
  expiryDate?: string;
  createdAt?: Date;
  status: 'SOLD' | 'PENDING';
  grnInfo: GrnInfo | null;
  billings: BillingInfo[];
  pendingQuantity?: number;
  totalQuantity?: number;
  soldQuantity?: number;
  batches?: any[];
}

interface TraceResponse {
  data: TraceResult[];
  message: string;
}

@Component({
  selector: 'app-product-trace',
  standalone: true,
  imports: [CommonModule, FormsModule, BarcodeScannerComponent],
  templateUrl: './product-trace.component.html',
  styleUrls: ['./product-trace.component.scss']
})
export class ProductTraceComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly API_URL = environment.APIUrl;

  searchType: 'batch' | 'item' = 'batch';
  searchQuery = '';
  traceResults: any[] = [];
  loading = false;
  error = '';
  returnLoading = false;
  returnModalOpen = false;
  returnData: any = null;
  selectedBillingId: number | null = null;

  ngOnInit() {}

  search() {
    if (!this.searchQuery.trim()) {
      this.error = 'Please enter a search value';
      return;
    }

    this.loading = true;
    this.error = '';
    this.traceResults = [];

    let httpParams = new HttpParams();
    if (this.searchType === 'batch') {
      httpParams = httpParams.set('batchCode', this.searchQuery);
    } else {
      httpParams = httpParams.set('itemCode', this.searchQuery);
    }

    this.http
      .get<TraceResponse>(`${this.API_URL}/product-trace/trace`, {
        params: httpParams,
        headers: this.auth.getAuthHeaders()
      })
      .subscribe({
        next: (res) => {
          this.traceResults = res.data || [];
          this.loading = false;
          if (this.traceResults.length === 0) {
            this.error = 'No products found matching your search';
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Error searching product trace';
          this.loading = false;
        }
      });
  }

  getStatusClass(status: string): string {
    return status === 'SOLD' ? 'text-green-600 font-bold' : 'text-orange-600 font-bold';
  }

  getStatusBadgeClass(status: string): string {
    return status === 'SOLD' ? 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold' : 'bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold';
  }

  openSalesReturn(bill: any) {
    if (!bill.billNo) {
      this.error = 'Invalid billing record';
      return;
    }

    this.returnLoading = true;
    this.error = '';

    // Use bill number to fetch prefill data
    const billNo = bill.billNo;

    this.http
      .get<any>(`${this.API_URL}/returns/sales/prefill/${billNo}`, {
        headers: this.auth.getAuthHeaders()
      })
      .subscribe({
        next: (res) => {
          this.returnData = res.data;
          this.selectedBillingId = billNo;
          this.returnModalOpen = true;
          this.returnLoading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load return data. Please try again.';
          this.returnLoading = false;
        }
      });
  }

  closeReturnModal() {
    this.returnModalOpen = false;
    this.returnData = null;
    this.selectedBillingId = null;
  }

  submitSalesReturn() {
    if (!this.returnData || !this.returnData.items || this.returnData.items.length === 0) {
      this.error = 'No items to return';
      return;
    }

    this.returnLoading = true;
    const payload = {
      customerId: this.returnData.customerId,
      reason: 'Customer Return from Product Trace',
      items: this.returnData.items
    };

    this.http
      .post<any>(`${this.API_URL}/returns/sales`, payload, {
        headers: this.auth.getAuthHeaders()
      })
      .subscribe({
        next: (res) => {
          this.error = '';
          this.closeReturnModal();
          alert('✅ Sales return created successfully');
          this.returnLoading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create sales return';
          this.returnLoading = false;
        }
      });
  }

  // Barcode scanner handler
  onBarcodeScanned(code: string) {
    // Set the scanned code to the search query
    this.searchQuery = code;

    // Auto-detect if it looks like a batch number or item code
    // Batch numbers typically have specific patterns
    this.searchType = 'batch';

    // Trigger search automatically
    this.search();
  }
}
