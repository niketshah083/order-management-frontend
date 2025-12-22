import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReportResponse {
  data: any;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.APIUrl}/reports`;

  constructor(private http: HttpClient) {}

  getManagerWiseSales(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/manager-wise-sales`, { params });
  }

  getAreaWiseSales(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/area-wise-sales`, { params });
  }

  getItemWiseSales(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/item-wise-sales`, { params });
  }

  getPendingPaymentByDistributor(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/pending-payment-distributor`, { params });
  }

  getTopCustomerSales(fromDate: string, toDate: string, limit = 20, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate, limit: limit.toString() };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/top-customers`, { params });
  }

  getPaymentStatusSummary(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/payment-status-summary`, { params });
  }

  getGSTAnalysis(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/gst-analysis`, { params });
  }

  getSalesByDistributor(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/sales-by-distributor`, { params });
  }

  getOrderApprovalAnalytics(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/order-approval-analytics`, { params });
  }

  getStateCityWiseSales(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/state-city-wise-sales`, { params });
  }

  getCategoryWiseSales(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/category-wise-sales`, { params });
  }

  getTopItemsByQuantity(fromDate: string, toDate: string, limit = 20, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate, limit: limit.toString() };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/top-items-by-quantity`, { params });
  }

  getCreditLimitUtilization(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/credit-limit-utilization`, { params });
  }

  getReturnsRefundsSummary(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/returns-refunds-summary`, { params });
  }

  getPaymentRecoveryRate(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/payment-recovery-rate`, { params });
  }

  getCropWiseSales(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/crop-wise-sales`, { params });
  }

  getDiseaseWiseSales(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/disease-wise-sales`, { params });
  }

  getCropDiseaseSales(fromDate: string, toDate: string, distributorId?: number): Observable<ReportResponse> {
    const params: any = { fromDate, toDate };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<ReportResponse>(`${this.apiUrl}/crop-disease-sales`, { params });
  }

  // New Dashboard Reports
  getExpiringItems(days: number = 30, distributorId?: number, limit: number = 5): Observable<any> {
    const params: any = { days: days.toString(), limit: limit.toString() };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<any>(`${this.apiUrl}/expiring-items`, { params });
  }

  getDailySalesTrend(days: number = 7, distributorId?: number): Observable<any> {
    const params: any = { days: days.toString() };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<any>(`${this.apiUrl}/daily-sales-trend`, { params });
  }

  getWeeklySalesSummary(distributorId?: number): Observable<any> {
    const params: any = {};
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<any>(`${this.apiUrl}/weekly-summary`, { params });
  }

  getMonthlySalesSummary(distributorId?: number): Observable<any> {
    const params: any = {};
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<any>(`${this.apiUrl}/monthly-summary`, { params });
  }

  getTopCustomers(period: string = 'monthly', distributorId?: number, limit: number = 10): Observable<any> {
    const params: any = { period, limit: limit.toString() };
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<any>(`${this.apiUrl}/top-customers`, { params });
  }

  getPOSummary(distributorId?: number): Observable<any> {
    const params: any = {};
    if (distributorId) params.distributorId = distributorId.toString();
    return this.http.get<any>(`${this.apiUrl}/po-summary`, { params });
  }
}
