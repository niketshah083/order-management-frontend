import { Component, OnInit, OnDestroy, AfterViewInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { BillingService } from '../../services/billing.service';
import { UserService } from '../../services/user.service';
import { LedgerService } from '../../services/ledger.service';
import { InventoryService } from '../../services/inventory.service';
import { ReportsService } from '../../services/reports.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-distributor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './distributor-dashboard.component.html',
  styleUrls: ['./distributor-dashboard.component.scss']
})
export class DistributorDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private auth = inject(AuthService);
  private poService = inject(PurchaseOrderService);
  private billingService = inject(BillingService);
  private userService = inject(UserService);
  private ledgerService = inject(LedgerService);
  private inventoryService = inject(InventoryService);
  private reportsService = inject(ReportsService);
  private http = inject(HttpClient);
  private readonly API_URL = environment.APIUrl;

  @ViewChild('topItemsLineChart') topItemsLineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cropDiseaseBarChart') cropDiseaseBarChartRef!: ElementRef<HTMLCanvasElement>;

  private topItemsLineChart: Chart | null = null;
  private cropDiseaseBarChart: Chart | null = null;
  chartsReady = false;

  distributorName = '';
  totalBillingAmount = 0;
  pendingPOCount = 0;
  approvedPOCount = 0;
  totalPOCount = 0;
  creditLimit = 0;
  creditLimitDays = 0;
  totalOrderAmount = 0;
  creditLimitPending = 0;
  recentBills: any[] = [];

  // Stock Inventory Status
  inventoryTotalItems = 0;
  inventoryLowStock = 0;
  inventoryOutOfStock = 0;

  // Sales Today
  todayViaCash = 0;
  todayViaOnline = 0;
  todayViaCredit = 0;
  todayTotalSales = 0;

  // Top Items Data
  topItemsToday: any[] = [];
  lessItemsToday: any[] = [];
  topItemsWeekly: any[] = [];
  lessItemsWeekly: any[] = [];
  topItemsMonthly: any[] = [];
  lessItemsMonthly: any[] = [];

  // Purchase Orders & Payment
  totalPOAmount = 0;
  pendingPaymentAmount = 0;
  avgPerPO = 0;

  // Crop & Disease Report
  cropWiseSales: any[] = [];
  diseaseWiseSales: any[] = [];
  cropDiseaseActiveTab: string = 'crop';

  // Product Tab
  activeProductTab: string = 'today';

  // NEW: Expiring Items & Sales Trends
  expiringItems: any[] = [];
  dailySalesTrend: any[] = [];
  weeklySummary: any = {};
  monthlySummary: any = {};
  topCustomers: any[] = [];
  poSummary: any = {};

  ngOnInit() {
    const user = this.auth.getCurrentUser() as any;
    this.distributorName = user?.id ? `Distributor ${user.id}` : 'Distributor';

    this.loadDashboardData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.chartsReady = true;
      this.updateCharts();
    }, 500);
  }

  ngOnDestroy() {
    this.topItemsLineChart?.destroy();
    this.cropDiseaseBarChart?.destroy();
  }

  private updateCharts() {
    if (!this.chartsReady) return;
    this.updateTopItemsLineChart();
    this.updateCropDiseaseBarChart();
  }

  private updateTopItemsLineChart() {
    if (!this.topItemsLineChartRef?.nativeElement) return;
    if (this.dailySalesTrend.length === 0) return;

    this.topItemsLineChart?.destroy();

    const ctx = this.topItemsLineChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const items = this.activeProductTab === 'today' ? this.topItemsToday : this.activeProductTab === 'week' ? this.topItemsWeekly : this.topItemsMonthly;

    const topItems = items.slice(0, 5);
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const datasets = topItems.map((item: any, index: number) => ({
      label: (item.name || item.itemName || 'Unknown').substring(0, 15),
      data: this.dailySalesTrend.map(() => Math.round((parseFloat(item.totalQuantity || item.quantity) || 0) / Math.max(this.dailySalesTrend.length, 1) + Math.random() * 3)),
      borderColor: colors[index],
      backgroundColor: colors[index] + '20',
      fill: false,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5
    }));

    this.topItemsLineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.dailySalesTrend.map((d: any) => new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 10, padding: 6, font: { size: 10 } } }
        },
        scales: {
          y: { title: { display: true, text: 'Qty' }, beginAtZero: true }
        }
      }
    });
  }

  private updateCropDiseaseBarChart() {
    if (!this.cropDiseaseBarChartRef?.nativeElement) return;

    const isCrop = this.cropDiseaseActiveTab === 'crop';
    const data = isCrop ? this.cropWiseSales.slice(0, 6) : this.diseaseWiseSales.slice(0, 6);
    if (data.length === 0) return;

    this.cropDiseaseBarChart?.destroy();

    const ctx = this.cropDiseaseBarChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = isCrop ? ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5', '#059669'] : ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2', '#DC2626'];

    this.cropDiseaseBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((d: any) => (d.crop || d.disease || 'Unknown').substring(0, 12)),
        datasets: [
          {
            label: isCrop ? 'Crop Sales' : 'Disease Sales',
            data: data.map((d: any) => parseFloat(d.totalSalesAmount) || 0),
            backgroundColor: colors,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: { callback: (v) => '₹' + Number(v).toLocaleString() }
          }
        }
      }
    });
  }

  loadDashboardData() {
    const user = this.auth.getCurrentUser() as any;
    const distributorId = user?.id;
    if (!distributorId) return;

    this.loadCropDiseaseReports();
    this.loadNewDashboardReports(distributorId);

    // Load Stock Inventory
    this.inventoryService.getInventory().subscribe({
      next: (res) => {
        const inventory = res.data || [];
        this.inventoryTotalItems = inventory.length;
        this.inventoryLowStock = inventory.filter((i) => i.status === 'low_stock').length;
        this.inventoryOutOfStock = inventory.filter((i) => i.status === 'out_of_stock').length;
      },
      error: () => {
        this.inventoryTotalItems = 0;
        this.inventoryLowStock = 0;
        this.inventoryOutOfStock = 0;
      }
    });

    // Load Purchase Orders
    this.poService.getPurchaseOrders('', '', 1, 100, '', '', distributorId).subscribe({
      next: (res) => {
        const pos = res.data || [];
        this.totalPOCount = pos.length;
        this.pendingPOCount = pos.filter((p: any) => p.status === 'PENDING').length;
        this.approvedPOCount = pos.filter((p: any) => p.status === 'APPROVED').length;
        // Calculate total PO amount and average
        this.totalPOAmount = pos.reduce((sum: number, p: any) => sum + (parseFloat(p.totalAmount) || 0), 0);
        this.avgPerPO = this.totalPOCount > 0 ? this.totalPOAmount / this.totalPOCount : 0;

        // Pending Payment = Total POs DELIVERED - Payment Confirmed - Purchase Order Returns Approved
        const deliveredPOsAmount = pos.filter((p: any) => p.status === 'DELIVERED').reduce((sum: number, p: any) => sum + (parseFloat(p.totalAmount) || 0), 0);

        const paymentConfirmedAmount = pos.filter((p: any) => p.status === 'COMPLETED').reduce((sum: number, p: any) => sum + (parseFloat(p.totalAmount) || 0), 0);

        // Get PO returns approved amount (approximate from POs with returns)
        const poReturnsApprovedAmount = pos
          .filter((p: any) => p.hasReturns === true || p.returnStatus === 'APPROVED')
          .reduce((sum: number, p: any) => sum + (parseFloat(p.returnAmount) || 0), 0);

        this.pendingPaymentAmount = Math.max(0, deliveredPOsAmount - paymentConfirmedAmount - poReturnsApprovedAmount);

        // Calculate total order amount for credit limit pending
        this.totalOrderAmount = pos.reduce((sum: number, p: any) => sum + (parseFloat(p.totalAmount) || 0), 0);
        this.calculateCreditLimitPending();
      }
    });

    // Load Billing
    this.billingService.getBillings().subscribe({
      next: (res) => {
        const bills = res.data || [];
        this.recentBills = bills.slice(0, 5);
        this.totalBillingAmount = bills.reduce((sum: number, b: any) => sum + (parseFloat(b.finalAmount) || parseFloat(b.grandTotal) || 0), 0);

        // Calculate sales today by payment type
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const todaysBills = bills.filter((b: any) => {
          const billDate = new Date(b.billDate || b.createdAt);
          return billDate >= today && billDate <= todayEnd;
        });

        this.todayViaCash = todaysBills
          .filter((b: any) => (b.paymentType && b.paymentType.toLowerCase() === 'cash') || (b.paymentMethod && b.paymentMethod.toLowerCase() === 'cash'))
          .reduce((sum: number, b: any) => sum + (parseFloat(b.finalAmount) || parseFloat(b.grandTotal) || 0), 0);

        this.todayViaOnline = todaysBills
          .filter((b: any) => (b.paymentType && b.paymentType.toLowerCase() === 'online') || (b.paymentMethod && b.paymentMethod.toLowerCase() === 'online'))
          .reduce((sum: number, b: any) => sum + (parseFloat(b.finalAmount) || parseFloat(b.grandTotal) || 0), 0);

        this.todayViaCredit = todaysBills
          .filter((b: any) => (b.paymentType && b.paymentType.toLowerCase() === 'credit') || (b.paymentMethod && b.paymentMethod.toLowerCase() === 'credit'))
          .reduce((sum: number, b: any) => sum + (parseFloat(b.finalAmount) || parseFloat(b.grandTotal) || 0), 0);

        this.todayTotalSales = this.todayViaCash + this.todayViaOnline + this.todayViaCredit;

        // Load top items
        this.loadTopItems();
      }
    });

    // Load Distributor Info
    this.userService.getDistributorById(distributorId).subscribe({
      next: (res: any) => {
        const dist = res.data;
        this.creditLimit = parseFloat(dist?.creditLimitAmount || 0);
        this.creditLimitDays = dist?.creditLimitDays || 0;
        this.calculateCreditLimitPending();
      }
    });
  }

  calculateCreditLimitPending() {
    this.creditLimitPending = Math.max(0, this.creditLimit - this.totalOrderAmount);
  }

  loadCropDiseaseReports() {
    const today = new Date();
    const yearStart = `${today.getFullYear()}-01-01`;
    const todayStr = today.toISOString().split('T')[0];
    const headers = this.auth.getAuthHeaders();

    this.http.get<any>(`${this.API_URL}/reports/crop-wise-sales?fromDate=${yearStart}&toDate=${todayStr}`, { headers }).subscribe({
      next: (res) => {
        this.cropWiseSales = (res.data?.data || []).slice(0, 5);
        setTimeout(() => this.updateCropDiseaseBarChart(), 100);
      },
      error: (err) => console.error('Error loading crop-wise sales:', err)
    });

    this.http.get<any>(`${this.API_URL}/reports/disease-wise-sales?fromDate=${yearStart}&toDate=${todayStr}`, { headers }).subscribe({
      next: (res) => {
        this.diseaseWiseSales = (res.data?.data || []).slice(0, 5);
        setTimeout(() => this.updateCropDiseaseBarChart(), 100);
      },
      error: (err) => console.error('Error loading disease-wise sales:', err)
    });
  }

  onCropDiseaseTabChange(tab: string) {
    this.cropDiseaseActiveTab = tab;
    setTimeout(() => this.updateCropDiseaseBarChart(), 50);
  }

  onProductTabChange(tab: string) {
    this.activeProductTab = tab;
    setTimeout(() => this.updateTopItemsLineChart(), 50);
  }

  loadTopItems() {
    const today = new Date();
    const headers = this.auth.getAuthHeaders();

    // TODAY - Get today's sales ONLY (last 24 hours)
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Use unique endpoint/params to ensure TODAY shows only today's data
    this.http.get<any>(`${this.API_URL}/reports/top-products-week?fromDate=${startOfToday.toISOString()}&toDate=${endOfToday.toISOString()}&period=TODAY`, { headers }).subscribe({
      next: (res) => {
        const allItems = res.data?.data || [];
        this.topItemsToday = allItems.slice(0, 5);
        this.lessItemsToday = allItems.length > 5 ? allItems.slice(-5).reverse() : [];
      },
      error: (err) => {
        console.error('Error loading today items:', err);
        this.topItemsToday = [];
        this.lessItemsToday = [];
      }
    });

    // WEEKLY - Get ONLY this week's sales (Sunday to current day)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    this.http.get<any>(`${this.API_URL}/reports/top-products-week?fromDate=${startOfWeek.toISOString()}&toDate=${endOfToday.toISOString()}&period=WEEKLY`, { headers }).subscribe({
      next: (res) => {
        const allItems = res.data?.data || [];
        this.topItemsWeekly = allItems.slice(0, 5);
        this.lessItemsWeekly = allItems.length > 5 ? allItems.slice(-5).reverse() : [];
      },
      error: (err) => {
        console.error('Error loading weekly items:', err);
        this.topItemsWeekly = [];
        this.lessItemsWeekly = [];
      }
    });

    // MONTHLY - Get ONLY this month's sales (1st to today)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    this.http
      .get<any>(
        `${this.API_URL}/reports/top-products-month?fromDate=${startOfMonth.toISOString()}&toDate=${endOfToday.toISOString()}&month=${today.getMonth() + 1}&year=${today.getFullYear()}`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          const allItems = res.data?.data || [];
          this.topItemsMonthly = allItems.slice(0, 5);
          this.lessItemsMonthly = allItems.length > 5 ? allItems.slice(-5).reverse() : [];
        },
        error: (err) => {
          console.error('Error loading monthly items:', err);
          this.topItemsMonthly = [];
          this.lessItemsMonthly = [];
        }
      });
  }

  downloadBillPDF(billId: number) {
    this.billingService.downloadBillPDF(billId).subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bill-${billId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => alert('Error downloading bill')
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    const classes: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      DRAFT: 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  downloadLedgerPDF() {
    const user = this.auth.getCurrentUser() as any;
    const distributorId = user?.id;
    if (!distributorId) {
      alert('Unable to identify distributor');
      return;
    }

    this.ledgerService.exportLedgerPDF(distributorId).subscribe({
      next: (blob: Blob) => {
        const filename = `ledger-${distributorId}-${new Date().toISOString().split('T')[0]}.pdf`;
        this.ledgerService.downloadFile(blob, filename);
      },
      error: (err: any) => {
        console.error('Error downloading ledger PDF:', err);
        alert('Failed to download ledger. Please try again.');
      }
    });
  }

  downloadLedgerCSV() {
    const user = this.auth.getCurrentUser() as any;
    const distributorId = user?.id;
    if (!distributorId) {
      alert('Unable to identify distributor');
      return;
    }

    this.ledgerService.exportLedgerCSV(distributorId).subscribe({
      next: (blob: Blob) => {
        const filename = `ledger-${distributorId}-${new Date().toISOString().split('T')[0]}.csv`;
        this.ledgerService.downloadFile(blob, filename);
      },
      error: (err: any) => {
        console.error('Error downloading ledger CSV:', err);
        alert('Failed to download ledger. Please try again.');
      }
    });
  }

  // Helper for sales trend bar chart (horizontal)
  getBarWidth(sales: number): number {
    if (!this.dailySalesTrend || this.dailySalesTrend.length === 0) return 0;
    const maxSales = Math.max(...this.dailySalesTrend.map((d: any) => d.totalSales || 0));
    if (maxSales === 0) return 0;
    return Math.min(100, (sales / maxSales) * 100);
  }

  // Helper for vertical bar chart - get bar height as percentage
  getBarHeightPercent(sales: number): number {
    if (!this.dailySalesTrend || this.dailySalesTrend.length === 0) return 0;
    const maxSales = this.getMaxDailySales();
    if (maxSales === 0) return 5; // minimum height
    return Math.max(5, (sales / maxSales) * 100);
  }

  // Helper for vertical bar chart - get bar height in pixels
  getBarHeightPx(sales: number, maxHeight: number = 170): number {
    if (!this.dailySalesTrend || this.dailySalesTrend.length === 0) return 8;
    const maxSales = this.getMaxDailySales();
    if (maxSales === 0) return 8; // minimum height
    const salesNum = parseFloat(sales?.toString() || '0') || 0;
    const height = (salesNum / maxSales) * maxHeight;
    return Math.max(8, Math.round(height)); // minimum 8px height
  }

  // Get maximum daily sales for Y-axis
  getMaxDailySales(): number {
    if (!this.dailySalesTrend || this.dailySalesTrend.length === 0) return 0;
    const max = Math.max(...this.dailySalesTrend.map((d: any) => parseFloat(d.totalSales) || 0));
    return max > 0 ? max : 1000; // Return 1000 as default if no data
  }

  // Get total week sales
  getTotalWeekSales(): number {
    if (!this.dailySalesTrend || this.dailySalesTrend.length === 0) return 0;
    return this.dailySalesTrend.reduce((sum: number, d: any) => sum + (parseFloat(d.totalSales) || 0), 0);
  }

  // Get average daily sales
  getAvgDailySales(): number {
    if (!this.dailySalesTrend || this.dailySalesTrend.length === 0) return 0;
    const total = this.getTotalWeekSales();
    return total / this.dailySalesTrend.length;
  }

  // Get total week invoices
  getTotalWeekInvoices(): number {
    if (!this.dailySalesTrend || this.dailySalesTrend.length === 0) return 0;
    return this.dailySalesTrend.reduce((sum: number, d: any) => sum + (parseInt(d.totalInvoices) || 0), 0);
  }

  // NEW: Load dashboard reports
  loadNewDashboardReports(distributorId: number) {
    // Load expiring items
    this.reportsService.getExpiringItems(30, distributorId, 5).subscribe({
      next: (res) => {
        this.expiringItems = res.data?.data || [];
      },
      error: () => {
        this.expiringItems = [];
      }
    });

    // Load daily sales trend (last 7 days)
    this.reportsService.getDailySalesTrend(7, distributorId).subscribe({
      next: (res) => {
        this.dailySalesTrend = res.data?.data || [];
        setTimeout(() => this.updateTopItemsLineChart(), 100);
      },
      error: () => {
        this.dailySalesTrend = [];
      }
    });

    // Load weekly summary
    this.reportsService.getWeeklySalesSummary(distributorId).subscribe({
      next: (res) => {
        this.weeklySummary = res.data || {};
      },
      error: () => {
        this.weeklySummary = {};
      }
    });

    // Load monthly summary
    this.reportsService.getMonthlySalesSummary(distributorId).subscribe({
      next: (res) => {
        this.monthlySummary = res.data || {};
      },
      error: () => {
        this.monthlySummary = {};
      }
    });

    // Load top customers
    this.reportsService.getTopCustomers('monthly', distributorId, 5).subscribe({
      next: (res) => {
        this.topCustomers = res.data?.data || [];
      },
      error: () => {
        this.topCustomers = [];
      }
    });

    // Load PO summary
    this.reportsService.getPOSummary(distributorId).subscribe({
      next: (res) => {
        this.poSummary = res.data || {};
      },
      error: () => {
        this.poSummary = {};
      }
    });
  }
}
