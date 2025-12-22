import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../services/reports.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private userService = inject(UserService);

  fromDate = this.getTodayDate();
  toDate = this.getTodayDate();
  activeTab = signal('item-wise');
  loading = signal(false);

  // Distributor filter
  distributors = signal<any[]>([]);
  selectedDistributorId: number | null = null;

  // For daily trend chart
  maxDailySales = 0;

  // Report signals
  itemWiseSalesReport = signal<any>(null);
  distributorWiseSalesReport = signal<any>(null);
  stateCityWiseSalesReport = signal<any>(null);
  categoryWiseSalesReport = signal<any>(null);
  topItemsReport = signal<any>(null);
  creditLimitReport = signal<any>(null);
  returnsReport = signal<any>(null);
  paymentRecoveryReport = signal<any>(null);
  managerSalesReport = signal<any>(null);
  areaWiseSalesReport = signal<any>(null);
  pendingPaymentReport = signal<any>(null);
  topCustomersReport = signal<any>(null);
  paymentStatusReport = signal<any>(null);
  dailySalesTrendReport = signal<any>(null);
  gstAnalysisReport = signal<any>(null);
  approvalAnalyticsReport = signal<any>(null);

  reportTabs = [
    { id: 'item-wise', label: '📦 Item-Wise' },
    { id: 'distributor-wise', label: '🚚 Distributor' },
    { id: 'state-city-wise', label: '🗺️ State/City' },
    { id: 'category-wise', label: '🏷️ Category' },
    { id: 'top-items', label: '⭐ Top Items' },
    { id: 'credit-utilization', label: '💳 Credit' },
    { id: 'returns-summary', label: '↩️ Returns' },
    { id: 'payment-recovery', label: '💰 Recovery' },
    { id: 'manager-sales', label: '👔 Manager' },
    { id: 'area-sales', label: '📍 Area' },
    { id: 'pending-payments', label: '⏰ Pending' },
    { id: 'top-customers', label: '🌟 Customers' },
    { id: 'payment-status', label: '✅ Payment' },
    { id: 'daily-trend', label: '📈 Trend' },
    { id: 'gst-analysis', label: '📋 GST' },
    { id: 'approval-analytics', label: '✔️ Approvals' }
  ];

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getDateBefore(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.setMonthRange();
    this.loadDistributors();
    this.loadReport();

    // Auto-load report when tab changes
    effect(() => {
      this.activeTab();
      this.loadReport();
    });
  }

  loadDistributors() {
    this.userService.getDistributors().subscribe({
      next: (res: any) => {
        this.distributors.set(res.data || []);
      },
      error: () => {
        this.distributors.set([]);
      }
    });
  }

  onDateChange() {
    this.loadReport();
  }

  setTodayRange() {
    this.fromDate = this.getTodayDate();
    this.toDate = this.getTodayDate();
    this.loadReport();
  }

  setWeekRange() {
    this.fromDate = this.getDateBefore(7);
    this.toDate = this.getTodayDate();
    this.loadReport();
  }

  setMonthRange() {
    this.fromDate = this.getDateBefore(30);
    this.toDate = this.getTodayDate();
    this.loadReport();
  }

  loadReport() {
    this.loading.set(true);
    const tab = this.activeTab();
    const distId = this.selectedDistributorId || undefined;

    switch (tab) {
      case 'item-wise':
        this.reportsService.getItemWiseSales(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.itemWiseSalesReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'distributor-wise':
        this.reportsService.getSalesByDistributor(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.distributorWiseSalesReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'state-city-wise':
        this.reportsService.getStateCityWiseSales(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.stateCityWiseSalesReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'category-wise':
        this.reportsService.getCategoryWiseSales(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.categoryWiseSalesReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'top-items':
        this.reportsService.getTopItemsByQuantity(this.fromDate, this.toDate, 20, distId).subscribe({
          next: (res) => {
            this.topItemsReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'credit-utilization':
        this.reportsService.getCreditLimitUtilization(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.creditLimitReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'returns-summary':
        this.reportsService.getReturnsRefundsSummary(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.returnsReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'payment-recovery':
        this.reportsService.getPaymentRecoveryRate(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.paymentRecoveryReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'manager-sales':
        this.reportsService.getManagerWiseSales(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.managerSalesReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'area-sales':
        this.reportsService.getAreaWiseSales(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.areaWiseSalesReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'pending-payments':
        this.reportsService.getPendingPaymentByDistributor(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.pendingPaymentReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'top-customers':
        this.reportsService.getTopCustomerSales(this.fromDate, this.toDate, 20, distId).subscribe({
          next: (res) => {
            this.topCustomersReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'payment-status':
        this.reportsService.getPaymentStatusSummary(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.paymentStatusReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'daily-trend':
        // Calculate days between dates
        const daysDiff = Math.ceil((new Date(this.toDate).getTime() - new Date(this.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        this.reportsService.getDailySalesTrend(Math.min(daysDiff, 30), distId).subscribe({
          next: (res) => {
            const data = res.data || {};
            this.dailySalesTrendReport.set(data);
            if (data.data && data.data.length > 0) {
              this.maxDailySales = Math.max(...data.data.map((d: any) => parseFloat(d.totalSales) || 0));
            } else {
              this.maxDailySales = 0;
            }
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Daily trend error:', err);
            this.loading.set(false);
          }
        });
        break;
      case 'gst-analysis':
        this.reportsService.getGSTAnalysis(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.gstAnalysisReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'approval-analytics':
        this.reportsService.getOrderApprovalAnalytics(this.fromDate, this.toDate, distId).subscribe({
          next: (res) => {
            this.approvalAnalyticsReport.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
    }
  }

  currentReportData() {
    switch (this.activeTab()) {
      case 'item-wise':
        return this.itemWiseSalesReport();
      case 'distributor-wise':
        return this.distributorWiseSalesReport();
      case 'state-city-wise':
        return this.stateCityWiseSalesReport();
      case 'category-wise':
        return this.categoryWiseSalesReport();
      case 'top-items':
        return this.topItemsReport();
      case 'credit-utilization':
        return this.creditLimitReport();
      case 'returns-summary':
        return this.returnsReport();
      case 'payment-recovery':
        return this.paymentRecoveryReport();
      case 'manager-sales':
        return this.managerSalesReport();
      case 'area-sales':
        return this.areaWiseSalesReport();
      case 'pending-payments':
        return this.pendingPaymentReport();
      case 'top-customers':
        return this.topCustomersReport();
      case 'payment-status':
        return this.paymentStatusReport();
      case 'daily-trend':
        return this.dailySalesTrendReport();
      case 'gst-analysis':
        return this.gstAnalysisReport();
      case 'approval-analytics':
        return this.approvalAnalyticsReport();
      default:
        return null;
    }
  }

  getTableColumns(): string[] {
    const tab = this.activeTab();
    const dataObj = this.currentReportData();
    if (!dataObj?.data?.[0]) return [];
    return Object.keys(dataObj.data[0]);
  }

  getReportSummaryItems() {
    const summary = this.currentReportData()?.summary || {};
    const items = [];

    for (const [key, value] of Object.entries(summary)) {
      let label = key.replace(/([A-Z])/g, ' $1').trim();
      label = label.charAt(0).toUpperCase() + label.slice(1);

      let cardClass = 'from-indigo-50 to-indigo-100 border-indigo-600 text-indigo-600';
      let valueClass = 'text-indigo-600';

      if (key.includes('Total') || key.includes('Grand')) {
        cardClass = 'from-green-50 to-green-100 border-green-600 text-green-600';
        valueClass = 'text-green-600';
      } else if (key.includes('Count') || key.includes('Number')) {
        cardClass = 'from-blue-50 to-blue-100 border-blue-600 text-blue-600';
        valueClass = 'text-blue-600';
      } else if (key.includes('Critical') || key.includes('High')) {
        cardClass = 'from-red-50 to-red-100 border-red-600 text-red-600';
        valueClass = 'text-red-600';
      }

      items.push({
        label,
        value: this.formatValue(value),
        cardClass,
        valueClass
      });
    }
    return items;
  }

  formatCell(row: any, column: string): string {
    const value = row[column];

    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (
        column.toLowerCase().includes('amount') ||
        column.toLowerCase().includes('total') ||
        column.toLowerCase().includes('sales') ||
        column.toLowerCase().includes('credit') ||
        column.toLowerCase().includes('percent')
      ) {
        return '₹' + value.toFixed(2);
      }
      if (column.toLowerCase().includes('percent') || column.toLowerCase().includes('rate')) {
        return value.toFixed(2) + '%';
      }
      return value.toFixed(2);
    }
    // Check for ISO date format (e.g., 2024-12-16T10:30:00) or date-only format (2024-12-16)
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    return String(value);
  }

  formatValue(value: any): string {
    if (typeof value === 'number') {
      if (value % 1 === 0) return value.toLocaleString();
      return value.toFixed(2).toLocaleString();
    }
    return String(value || '-');
  }

  getCellClass(column: string, row: any): string {
    const value = row[column];
    if (typeof value !== 'number') return 'text-gray-600';

    if (column.toLowerCase().includes('amount') || column.toLowerCase().includes('total') || column.toLowerCase().includes('sales')) {
      return 'text-green-600 font-semibold';
    }
    if (column.toLowerCase().includes('critical') || column.toLowerCase().includes('high') || column.toLowerCase().includes('outstanding')) {
      return 'text-red-600 font-semibold';
    }
    return 'text-gray-600';
  }

  // Download CSV
  downloadCSV() {
    const data = this.currentReportData()?.data;
    if (!data || data.length === 0) {
      alert('No data to download');
      return;
    }

    const columns = this.getTableColumns();
    const csvRows = [];

    // Header row
    csvRows.push(columns.map((c) => this.formatColumnHeader(c)).join(','));

    // Data rows
    for (const row of data) {
      const values = columns.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.activeTab()}-report-${this.fromDate}-to-${this.toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Get bar width for chart (horizontal)
  getBarWidth(sales: number): number {
    if (this.maxDailySales === 0) return 0;
    return Math.min(100, (sales / this.maxDailySales) * 100);
  }

  // Get bar height for vertical chart (percentage)
  getBarHeight(sales: number): number {
    if (this.maxDailySales === 0) return 5;
    return Math.max(5, Math.min(100, (sales / this.maxDailySales) * 100));
  }

  // Get bar height in pixels (max height 280px for h-72 container)
  getBarHeightPx(sales: number): number {
    const maxHeight = 280; // h-72 = 18rem = 288px, leaving some padding
    if (this.maxDailySales === 0) return sales > 0 ? 20 : 4;
    if (sales === 0) return 4; // Minimum height for zero values
    return Math.max(8, Math.round((sales / this.maxDailySales) * maxHeight));
  }

  // Format date for chart x-axis
  formatChartDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  // Get total sales from trend data
  getTotalSales(): number {
    const data = this.dailySalesTrendReport()?.data || [];
    return data.reduce((sum: number, d: any) => sum + (parseFloat(d.totalSales) || 0), 0);
  }

  // Get total invoices from trend data
  getTotalInvoices(): number {
    const data = this.dailySalesTrendReport()?.data || [];
    return data.reduce((sum: number, d: any) => sum + (parseInt(d.totalInvoices) || 0), 0);
  }

  // Get average daily sales
  getAvgDailySales(): number {
    const data = this.dailySalesTrendReport()?.data || [];
    if (data.length === 0) return 0;
    return this.getTotalSales() / data.length;
  }

  // Get best performing day
  getBestDay(): string {
    const data = this.dailySalesTrendReport()?.data || [];
    if (data.length === 0) return '-';
    const best = data.reduce((max: any, d: any) => ((parseFloat(d.totalSales) || 0) > (parseFloat(max.totalSales) || 0) ? d : max), data[0]);
    return this.formatChartDate(best.date);
  }

  // Format column header
  formatColumnHeader(col: string): string {
    return col
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
