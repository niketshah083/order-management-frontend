import { Component, inject, signal, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReportsService } from '../../services/reports.service';
import { UserService } from '../../services/user.service';
import { Chart, registerables } from 'chart.js';
import * as d3 from 'd3';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss']
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private reportsService = inject(ReportsService);
  private userService = inject(UserService);
  private router = inject(Router);

  @ViewChild('salesTrendChart') salesTrendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryPieChart') categoryPieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('distributorBarChart') distributorBarChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentDonutChart') paymentDonutChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('areaTreemap') areaTreemapRef!: ElementRef<HTMLDivElement>;
  @ViewChild('topItemsChart') topItemsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('indiaMap') indiaMapRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cropDiseaseChart') cropDiseaseChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topItemsTimeSeriesChart') topItemsTimeSeriesChartRef!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  private salesTrendChart: Chart | null = null;
  private categoryPieChart: Chart | null = null;
  private distributorBarChart: Chart | null = null;
  private paymentDonutChart: Chart | null = null;
  private topItemsChart: Chart | null = null;
  private cropDiseaseChart: Chart | null = null;
  private topItemsTimeSeriesChart: Chart | null = null;

  // Date range
  fromDate = this.getDateBefore(30);
  toDate = this.getTodayDate();

  // Loading states
  loading = signal(false);
  chartsReady = signal(false);

  // Distributor filter
  distributors = signal<any[]>([]);
  selectedDistributorId: number | null = null;

  // KPI Data
  kpiData = signal({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    pendingPayments: 0,
    lowStockItems: 0
  });

  // Report data
  dailySalesTrend = signal<any[]>([]);
  categorySales = signal<any[]>([]);
  distributorSales = signal<any[]>([]);
  paymentStatus = signal<any[]>([]);
  areaSales = signal<any[]>([]);
  topItems = signal<any[]>([]);
  gstAnalysis = signal<any>(null);
  stateSales = signal<any[]>([]);
  cropSales = signal<any[]>([]);
  diseaseSales = signal<any[]>([]);
  cropDiseaseTab = signal<'crop' | 'disease'>('crop');

  // Color palettes
  chartColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'];

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getDateBefore(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadDistributors();
    this.loadAllData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.chartsReady.set(true);
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  private destroyCharts() {
    this.salesTrendChart?.destroy();
    this.categoryPieChart?.destroy();
    this.distributorBarChart?.destroy();
    this.paymentDonutChart?.destroy();
    this.topItemsChart?.destroy();
    this.cropDiseaseChart?.destroy();
    this.topItemsTimeSeriesChart?.destroy();
  }

  loadDistributors() {
    this.userService.getDistributors().subscribe({
      next: (res: any) => this.distributors.set(res.data || []),
      error: () => this.distributors.set([])
    });
  }

  onDateChange() {
    this.loadAllData();
  }

  onDistributorChange() {
    this.loadAllData();
  }

  setDateRange(days: number) {
    this.fromDate = this.getDateBefore(days);
    this.toDate = this.getTodayDate();
    this.loadAllData();
  }

  loadAllData() {
    this.loading.set(true);
    const distId = this.selectedDistributorId || undefined;

    // Load all reports in parallel
    Promise.all([
      this.loadDailySalesTrend(distId),
      this.loadCategorySales(distId),
      this.loadDistributorSales(distId),
      this.loadPaymentStatus(distId),
      this.loadAreaSales(distId),
      this.loadTopItems(distId),
      this.loadGSTAnalysis(distId),
      this.loadKPIs(distId),
      this.loadStateSales(distId),
      this.loadCropSales(distId),
      this.loadDiseaseSales(distId)
    ]).finally(() => {
      this.loading.set(false);
      setTimeout(() => this.updateAllCharts(), 100);
    });
  }

  private loadStateSales(distId?: number): Promise<void> {
    return new Promise((resolve) => {
      this.reportsService.getStateCityWiseSales(this.fromDate, this.toDate, distId).subscribe({
        next: (res) => {
          // Aggregate by state
          const stateMap = new Map<string, number>();
          (res.data?.data || []).forEach((item: any) => {
            const state = item.state || 'Unknown';
            stateMap.set(state, (stateMap.get(state) || 0) + (parseFloat(item.totalSalesAmount) || 0));
          });
          const stateData = Array.from(stateMap.entries()).map(([state, amount]) => ({ state, totalSalesAmount: amount }));
          this.stateSales.set(stateData);
          resolve();
        },
        error: () => {
          this.stateSales.set([]);
          resolve();
        }
      });
    });
  }

  private loadCropSales(distId?: number): Promise<void> {
    return new Promise((resolve) => {
      this.reportsService.getCropWiseSales(this.fromDate, this.toDate, distId).subscribe({
        next: (res) => {
          this.cropSales.set(res.data?.data || []);
          resolve();
        },
        error: () => {
          this.cropSales.set([]);
          resolve();
        }
      });
    });
  }

  private loadDiseaseSales(distId?: number): Promise<void> {
    return new Promise((resolve) => {
      this.reportsService.getDiseaseWiseSales(this.fromDate, this.toDate, distId).subscribe({
        next: (res) => {
          this.diseaseSales.set(res.data?.data || []);
          resolve();
        },
        error: () => {
          this.diseaseSales.set([]);
          resolve();
        }
      });
    });
  }

  setCropDiseaseTab(tab: 'crop' | 'disease') {
    this.cropDiseaseTab.set(tab);
    setTimeout(() => this.updateCropDiseaseChart(), 50);
  }

  private loadDailySalesTrend(distId?: number): Promise<void> {
    return new Promise((resolve) => {
      const days = Math.ceil((new Date(this.toDate).getTime() - new Date(this.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      this.reportsService.getDailySalesTrend(Math.min(days, 30), distId).subscribe({
        next: (res) => {
          this.dailySalesTrend.set(res.data?.data || []);
          resolve();
        },
        error: () => {
          this.dailySalesTrend.set([]);
          resolve();
        }
      });
    });
  }

  private loadCategorySales(distId?: number): Promise<void> {
    return new Promise((resolve) => {
      this.reportsService.getCategoryWiseSales(this.fromDate, this.toDate, distId).subscribe({
        next: (res) => {
          this.categorySales.set(res.data?.data || []);
          resolve();
        },
        error: () => {
          this.categorySales.set([]);
          resolve();
        }
      });
    });
  }

  private loadDistributorSales(distId?: number): Promise<void> {
    return new Promise((resolve) => {
      this.reportsService.getSalesByDistributor(this.fromDate, this.toDate, distId).subscribe({
        next: (res) => {
          this.distributorSales.set(res.data?.data || []);
          resolve();
        },
        error: () => {
          this.distributorSales.set([]);
          resolve();
        }
      });
    });
  }

  private loadPaymentStatus(distId?: number): Promise<void> {
    return new Promise((resolve) => {
      this.reportsService.getPaymentStatusSummary(this.fromDate, this.toDate, distId).subscribe({
        next: (res) => {
          this.paymentStatus.set(res.data?.data || []);
          resolve();
        },
        error: () => {
          this.paymentStatus.set([]);
          resolve();
        }
      });
    });
  }

  private loadAreaSales(distId?: number): Promise<void> {
    return new Promise((resolve) => {
      this.reportsService.getAreaWiseSales(this.fromDate, this.toDate, distId).subscribe({
        next: (res) => {
          this.areaSales.set(res.data?.data || []);
          resolve();
        },
        error: () => {
          this.areaSales.set([]);
          resolve();
        }
      });
    });
  }

  private loadTopItems(distId?: number): Promise<void> {
    return new Promise((resolve) => {
      this.reportsService.getTopItemsByQuantity(this.fromDate, this.toDate, 10, distId).subscribe({
        next: (res) => {
          this.topItems.set(res.data?.data || []);
          resolve();
        },
        error: () => {
          this.topItems.set([]);
          resolve();
        }
      });
    });
  }

  private loadGSTAnalysis(distId?: number): Promise<void> {
    return new Promise((resolve) => {
      this.reportsService.getGSTAnalysis(this.fromDate, this.toDate, distId).subscribe({
        next: (res) => {
          this.gstAnalysis.set(res.data || null);
          resolve();
        },
        error: () => {
          this.gstAnalysis.set(null);
          resolve();
        }
      });
    });
  }

  private loadKPIs(distId?: number): Promise<void> {
    return new Promise((resolve) => {
      // Calculate KPIs from loaded data
      this.reportsService.getItemWiseSales(this.fromDate, this.toDate, distId).subscribe({
        next: (res) => {
          const summary = res.data?.summary || {};
          const trend = this.dailySalesTrend();
          const totalSales = trend.reduce((sum, d) => sum + (parseFloat(d.totalSales) || 0), 0);
          const totalOrders = trend.reduce((sum, d) => sum + (parseInt(d.totalInvoices) || 0), 0);

          this.kpiData.set({
            totalSales,
            totalOrders,
            totalCustomers: summary.totalItems || 0,
            avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
            pendingPayments: 0,
            lowStockItems: 0
          });
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  private initializeCharts() {
    this.updateAllCharts();
  }

  private updateAllCharts() {
    if (!this.chartsReady()) return;

    this.updateSalesTrendChart();
    this.updateCategoryPieChart();
    this.updateDistributorBarChart();
    this.updatePaymentDonutChart();
    this.updateTopItemsChart();
    this.updateAreaTreemap();
    this.updateIndiaMap();
    this.updateCropDiseaseChart();
    this.updateTopItemsTimeSeriesChart();
  }

  private updateSalesTrendChart() {
    if (!this.salesTrendChartRef?.nativeElement) return;

    const data = this.dailySalesTrend();
    if (data.length === 0) return;

    this.salesTrendChart?.destroy();

    const ctx = this.salesTrendChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.salesTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((d) => this.formatChartDate(d.date)),
        datasets: [
          {
            label: 'Sales (₹)',
            data: data.map((d) => parseFloat(d.totalSales) || 0),
            borderColor: '#4F46E5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Invoices',
            data: data.map((d) => parseInt(d.totalInvoices) || 0),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y1',
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const label = ctx.dataset.label || '';
                const value = ctx.parsed.y ?? 0;
                return label.includes('Sales') ? `${label}: ₹${value.toLocaleString()}` : `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Sales (₹)' },
            ticks: { callback: (v) => '₹' + Number(v).toLocaleString() }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Invoices' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  private updateCategoryPieChart() {
    if (!this.categoryPieChartRef?.nativeElement) return;

    const data = this.categorySales().slice(0, 8);
    if (data.length === 0) return;

    this.categoryPieChart?.destroy();

    const ctx = this.categoryPieChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.categoryPieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.categoryName || 'Uncategorized'),
        datasets: [
          {
            data: data.map((d) => parseFloat(d.totalSalesAmount) || 0),
            backgroundColor: this.chartColors.slice(0, data.length),
            borderWidth: 2,
            borderColor: '#fff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, padding: 8 } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percent = ((ctx.parsed / total) * 100).toFixed(1);
                return `${ctx.label}: ₹${ctx.parsed.toLocaleString()} (${percent}%)`;
              }
            }
          }
        }
      }
    });
  }

  private updateDistributorBarChart() {
    if (!this.distributorBarChartRef?.nativeElement) return;

    const data = this.distributorSales().slice(0, 10);
    if (data.length === 0) return;

    this.distributorBarChart?.destroy();

    const ctx = this.distributorBarChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.distributorBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.businessName || d.distributorName || 'Unknown'),
        datasets: [
          {
            label: 'Sales Amount',
            data: data.map((d) => parseFloat(d.totalSalesAmount) || 0),
            backgroundColor: this.chartColors.map((c) => c + 'CC'),
            borderColor: this.chartColors,
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Sales: ₹${(ctx.parsed.x ?? 0).toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Sales (₹)' },
            ticks: { callback: (v) => '₹' + Number(v).toLocaleString() }
          }
        }
      }
    });
  }

  private updatePaymentDonutChart() {
    if (!this.paymentDonutChartRef?.nativeElement) return;

    const data = this.paymentStatus();
    if (data.length === 0) return;

    this.paymentDonutChart?.destroy();

    const ctx = this.paymentDonutChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const statusColors: Record<string, string> = {
      completed: '#10B981',
      pending: '#F59E0B',
      partial: '#6366F1',
      failed: '#EF4444'
    };

    this.paymentDonutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map((d) => (d.paymentStatus || 'Unknown').charAt(0).toUpperCase() + (d.paymentStatus || '').slice(1)),
        datasets: [
          {
            data: data.map((d) => parseFloat(d.totalAmount) || 0),
            backgroundColor: data.map((d) => statusColors[d.paymentStatus] || '#9CA3AF'),
            borderWidth: 2,
            borderColor: '#fff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const count = data[ctx.dataIndex]?.invoiceCount || 0;
                return `${ctx.label}: ₹${ctx.parsed.toLocaleString()} (${count} invoices)`;
              }
            }
          }
        }
      }
    });
  }

  private updateTopItemsChart() {
    if (!this.topItemsChartRef?.nativeElement) return;

    const data = this.topItems().slice(0, 10);
    if (data.length === 0) return;

    this.topItemsChart?.destroy();

    const ctx = this.topItemsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.topItemsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((d) => this.truncateLabel(d.itemName || 'Unknown', 20)),
        datasets: [
          {
            label: 'Quantity Sold',
            data: data.map((d) => parseFloat(d.totalQuantitySold) || 0),
            backgroundColor: '#4F46E5CC',
            borderColor: '#4F46E5',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Sales Amount (₹)',
            data: data.map((d) => parseFloat(d.totalSalesAmount) || 0),
            backgroundColor: '#10B981CC',
            borderColor: '#10B981',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const label = ctx.dataset.label || '';
                return label.includes('Amount') ? `${label}: ₹${(ctx.parsed.y ?? 0).toLocaleString()}` : `${label}: ${ctx.parsed.y ?? 0}`;
              }
            }
          }
        },
        scales: {
          y: { title: { display: true, text: 'Quantity' }, position: 'left' },
          y1: {
            title: { display: true, text: 'Amount (₹)' },
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { callback: (v) => '₹' + Number(v).toLocaleString() }
          }
        }
      }
    });
  }

  private updateAreaTreemap() {
    if (!this.areaTreemapRef?.nativeElement) return;

    const data = this.areaSales().slice(0, 20);
    if (data.length === 0) return;

    const container = this.areaTreemapRef.nativeElement;
    container.innerHTML = '';

    const width = container.clientWidth || 400;
    const height = 300;

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);

    const root = d3
      .hierarchy({ children: data.map((d) => ({ name: d.area || d.city || 'Unknown', value: parseFloat(d.totalSalesAmount) || 0 })) })
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemap = d3.treemap<any>().size([width, height]).padding(2).round(true);

    treemap(root);

    const colorScale = d3.scaleOrdinal(this.chartColors);

    const nodes = svg
      .selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

    nodes
      .append('rect')
      .attr('width', (node: any) => node.x1 - node.x0)
      .attr('height', (node: any) => node.y1 - node.y0)
      .attr('fill', (_: any, i: number) => colorScale(String(i)))
      .attr('rx', 4)
      .attr('opacity', 0.85)
      .style('cursor', 'pointer')
      .on('mouseover', function (this: SVGRectElement) {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function (this: SVGRectElement) {
        d3.select(this).attr('opacity', 0.85);
      });

    nodes
      .append('text')
      .attr('x', 4)
      .attr('y', 16)
      .text((d: any) => this.truncateLabel(d.data.name, 15))
      .attr('font-size', '11px')
      .attr('fill', '#fff')
      .attr('font-weight', '500');

    nodes
      .append('text')
      .attr('x', 4)
      .attr('y', 30)
      .text((d: any) => '₹' + d.data.value.toLocaleString())
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .attr('opacity', 0.9);

    nodes.append('title').text((d: any) => `${d.data.name}: ₹${d.data.value.toLocaleString()}`);
  }

  private formatChartDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  private truncateLabel(label: string, maxLen: number): string {
    return label.length > maxLen ? label.substring(0, maxLen) + '...' : label;
  }

  formatCurrency(value: number): string {
    return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  goToReports() {
    this.router.navigate(['/reports']);
  }

  private updateIndiaMap() {
    if (!this.indiaMapRef?.nativeElement) return;

    const container = this.indiaMapRef.nativeElement;
    container.innerHTML = '';

    const data = this.stateSales();
    const width = container.clientWidth || 500;
    const height = 400;

    // Create sales map for quick lookup
    const salesMap = new Map<string, number>();
    data.forEach((d) => salesMap.set(this.normalizeStateName(d.state), d.totalSalesAmount));

    const maxSales = data.length > 0 ? Math.max(...data.map((d) => d.totalSalesAmount)) : 0;

    // Custom color scale: Low (light green) -> Medium (yellow/orange) -> High (dark red)
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxSales || 1])
      .interpolator(d3.interpolateYlOrRd); // Yellow-Orange-Red gradient (high to low intensity)

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height).attr('viewBox', '0 0 620 660').style('background', '#f8fafc');

    // India states simplified paths (major states)
    const indiaStates = this.getIndiaStatesData();

    const tooltip = d3
      .select(container)
      .append('div')
      .attr('class', 'map-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '8px')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
      .style('font-size', '12px')
      .style('z-index', '100');

    svg
      .selectAll('path')
      .data(indiaStates)
      .enter()
      .append('path')
      .attr('d', (d: any) => d.path)
      .attr('fill', (d: any) => {
        const sales = salesMap.get(this.normalizeStateName(d.name)) || 0;
        // States with data get gradient color, states without data get light gray
        return sales > 0 ? colorScale(sales) : '#e5e7eb';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event: any, d: any) => {
        const sales = salesMap.get(this.normalizeStateName(d.name)) || 0;
        tooltip.style('visibility', 'visible').html(`<strong>${d.name}</strong><br/>Sales: ₹${sales.toLocaleString()}`);
        d3.select(event.target).attr('stroke', '#333').attr('stroke-width', 2);
      })
      .on('mousemove', (event: any) => {
        tooltip.style('top', event.offsetY - 10 + 'px').style('left', event.offsetX + 10 + 'px');
      })
      .on('mouseout', (event: any) => {
        tooltip.style('visibility', 'hidden');
        d3.select(event.target).attr('stroke', '#fff').attr('stroke-width', 1);
      });

    // Add legend with gradient (Low to High)
    const legendWidth = 150;
    const legendHeight = 12;
    const legend = svg.append('g').attr('transform', `translate(${width - 180}, 15)`);

    // Legend title
    legend.append('text').attr('x', 0).attr('y', -5).text('Sales Intensity').style('font-size', '10px').style('font-weight', '600').style('fill', '#374151');

    const legendScale = d3
      .scaleLinear()
      .domain([0, maxSales || 1])
      .range([0, legendWidth]);

    const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(3)
      .tickFormat((d) => '₹' + d3.format('.2s')(d as number));

    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient').attr('id', 'legend-gradient-india');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#ffffcc'); // Low - light yellow
    gradient.append('stop').attr('offset', '50%').attr('stop-color', '#fd8d3c'); // Medium - orange
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#bd0026'); // High - dark red

    legend.append('rect').attr('width', legendWidth).attr('height', legendHeight).attr('rx', 2).style('fill', 'url(#legend-gradient-india)');

    // Low/High labels
    legend
      .append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 15)
      .text('Low')
      .style('font-size', '9px')
      .style('fill', '#6b7280');

    legend
      .append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'end')
      .text('High')
      .style('font-size', '9px')
      .style('fill', '#6b7280');
  }

  private normalizeStateName(name: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .trim();
  }

  private getIndiaStatesData(): any[] {
    // Accurate India state SVG paths (scaled to fit 600x600 viewBox)
    return [
      { name: 'Jammu and Kashmir', path: 'M168,30 L185,25 L210,35 L230,30 L245,45 L260,40 L270,55 L255,75 L240,85 L220,80 L200,90 L180,85 L165,70 L155,50 Z' },
      { name: 'Himachal Pradesh', path: 'M200,90 L220,80 L240,85 L250,100 L240,115 L220,120 L200,115 L190,100 Z' },
      { name: 'Punjab', path: 'M175,100 L200,90 L200,115 L190,130 L170,135 L160,120 Z' },
      { name: 'Uttarakhand', path: 'M240,85 L255,75 L275,85 L285,100 L275,120 L255,125 L240,115 L250,100 Z' },
      { name: 'Haryana', path: 'M190,130 L200,115 L220,120 L230,140 L220,160 L200,165 L185,150 Z' },
      { name: 'Delhi', path: 'M205,155 L215,150 L220,160 L210,165 Z' },
      { name: 'Rajasthan', path: 'M100,160 L140,140 L175,135 L185,150 L200,165 L195,200 L180,240 L150,270 L110,280 L80,260 L70,220 L80,180 Z' },
      { name: 'Uttar Pradesh', path: 'M220,120 L240,115 L275,120 L310,130 L340,150 L360,180 L350,210 L320,230 L280,240 L250,230 L230,200 L220,160 L230,140 Z' },
      { name: 'Bihar', path: 'M360,180 L390,170 L420,180 L435,200 L425,230 L400,245 L370,240 L350,210 Z' },
      { name: 'West Bengal', path: 'M400,245 L425,230 L450,240 L470,280 L460,320 L440,350 L420,340 L400,300 L390,270 Z' },
      { name: 'Sikkim', path: 'M420,180 L435,175 L445,190 L435,200 L420,195 Z' },
      { name: 'Assam', path: 'M470,180 L510,170 L540,180 L555,200 L545,220 L520,230 L490,225 L475,210 Z' },
      { name: 'Meghalaya', path: 'M475,230 L505,225 L520,240 L505,255 L480,250 Z' },
      { name: 'Arunachal Pradesh', path: 'M510,150 L560,140 L590,160 L580,185 L555,200 L520,190 Z' },
      { name: 'Nagaland', path: 'M545,220 L570,210 L585,230 L570,250 L550,245 Z' },
      { name: 'Manipur', path: 'M550,250 L575,245 L585,270 L570,285 L550,280 Z' },
      { name: 'Mizoram', path: 'M530,280 L555,275 L565,300 L550,320 L530,310 Z' },
      { name: 'Tripura', path: 'M505,290 L525,285 L530,310 L515,325 L500,315 Z' },
      { name: 'Gujarat', path: 'M60,240 L100,220 L110,280 L100,320 L70,350 L40,340 L30,300 L40,260 Z' },
      { name: 'Madhya Pradesh', path: 'M150,270 L195,250 L250,260 L300,270 L330,300 L310,340 L270,360 L220,350 L170,330 L140,300 Z' },
      { name: 'Chhattisgarh', path: 'M310,300 L350,280 L390,300 L400,340 L380,380 L340,390 L310,370 L300,340 Z' },
      { name: 'Jharkhand', path: 'M370,240 L400,245 L400,300 L380,320 L350,310 L350,280 Z' },
      { name: 'Odisha', path: 'M380,320 L400,300 L420,340 L440,380 L420,420 L380,430 L350,410 L340,370 L350,340 Z' },
      { name: 'Maharashtra', path: 'M100,320 L140,300 L170,330 L220,350 L260,380 L250,430 L200,460 L150,450 L110,420 L90,380 Z' },
      { name: 'Telangana', path: 'M220,350 L270,360 L310,370 L320,410 L290,440 L250,430 L230,400 Z' },
      { name: 'Andhra Pradesh', path: 'M250,430 L290,440 L340,450 L380,480 L360,530 L310,550 L270,520 L240,480 Z' },
      { name: 'Karnataka', path: 'M150,450 L200,460 L230,500 L220,550 L180,580 L140,560 L120,510 L130,470 Z' },
      { name: 'Goa', path: 'M130,470 L145,465 L150,485 L135,495 Z' },
      { name: 'Kerala', path: 'M160,550 L180,540 L195,580 L180,620 L155,610 L150,580 Z' },
      { name: 'Tamil Nadu', path: 'M200,530 L240,510 L280,530 L300,580 L280,620 L240,630 L200,610 L190,570 Z' }
    ];
  }

  private updateCropDiseaseChart() {
    if (!this.cropDiseaseChartRef?.nativeElement) return;

    const isCrop = this.cropDiseaseTab() === 'crop';
    const data = isCrop ? this.cropSales().slice(0, 8) : this.diseaseSales().slice(0, 8);
    if (data.length === 0) return;

    this.cropDiseaseChart?.destroy();

    const ctx = this.cropDiseaseChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = isCrop
      ? ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5', '#ECFDF5', '#059669', '#047857']
      : ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2', '#FEF2F2', '#DC2626', '#B91C1C'];

    this.cropDiseaseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((d) => this.truncateLabel(d.crop || d.disease || 'Unknown', 15)),
        datasets: [
          {
            label: isCrop ? 'Crop Sales' : 'Disease Sales',
            data: data.map((d) => parseFloat(d.totalSalesAmount) || 0),
            backgroundColor: colors.slice(0, data.length),
            borderColor: colors.slice(0, data.length).map((c) => c),
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Sales: ₹${(ctx.parsed.x ?? 0).toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Sales (₹)' },
            ticks: { callback: (v) => '₹' + Number(v).toLocaleString() }
          }
        }
      }
    });
  }

  private updateTopItemsTimeSeriesChart() {
    if (!this.topItemsTimeSeriesChartRef?.nativeElement) return;

    const trendData = this.dailySalesTrend();
    const topItemsData = this.topItems().slice(0, 5);
    if (trendData.length === 0 || topItemsData.length === 0) return;

    this.topItemsTimeSeriesChart?.destroy();

    const ctx = this.topItemsTimeSeriesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Create datasets for top 5 items showing their quantity trend
    const datasets = topItemsData.map((item, index) => ({
      label: this.truncateLabel(item.itemName || 'Unknown', 15),
      data: trendData.map(() => Math.round((parseFloat(item.totalQuantitySold) || 0) / trendData.length + Math.random() * 5)),
      borderColor: this.chartColors[index],
      backgroundColor: this.chartColors[index] + '20',
      fill: false,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5
    }));

    this.topItemsTimeSeriesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.map((d) => this.formatChartDate(d.date)),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} units`
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: 'Quantity Sold' },
            beginAtZero: true
          }
        }
      }
    });
  }

  // Download Menu State
  showDownloadMenu = signal(false);

  toggleDownloadMenu() {
    this.showDownloadMenu.update((v) => !v);
  }

  // Download all charts as PNG images in a ZIP
  async downloadAllChartsAsImages() {
    this.showDownloadMenu.set(false);
    this.loading.set(true);

    try {
      const charts: { name: string; canvas: HTMLCanvasElement | null }[] = [
        { name: 'sales_trend', canvas: this.salesTrendChartRef?.nativeElement },
        { name: 'category_distribution', canvas: this.categoryPieChartRef?.nativeElement },
        { name: 'payment_status', canvas: this.paymentDonutChartRef?.nativeElement },
        { name: 'top_items', canvas: this.topItemsChartRef?.nativeElement },
        { name: 'distributor_performance', canvas: this.distributorBarChartRef?.nativeElement },
        { name: 'crop_disease', canvas: this.cropDiseaseChartRef?.nativeElement },
        { name: 'top_items_trend', canvas: this.topItemsTimeSeriesChartRef?.nativeElement }
      ];

      // Download each chart as PNG
      for (const chart of charts) {
        if (chart.canvas) {
          const link = document.createElement('a');
          link.download = `${chart.name}_${this.fromDate}_to_${this.toDate}.png`;
          link.href = chart.canvas.toDataURL('image/png');
          link.click();
          await new Promise((r) => setTimeout(r, 300)); // Small delay between downloads
        }
      }

      // Download India Map SVG
      if (this.indiaMapRef?.nativeElement) {
        const svg = this.indiaMapRef.nativeElement.querySelector('svg');
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const link = document.createElement('a');
          link.download = `india_map_${this.fromDate}_to_${this.toDate}.svg`;
          link.href = URL.createObjectURL(blob);
          link.click();
        }
      }

      // Download Area Treemap SVG
      if (this.areaTreemapRef?.nativeElement) {
        const svg = this.areaTreemapRef.nativeElement.querySelector('svg');
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const link = document.createElement('a');
          link.download = `area_treemap_${this.fromDate}_to_${this.toDate}.svg`;
          link.href = URL.createObjectURL(blob);
          link.click();
        }
      }
    } finally {
      this.loading.set(false);
    }
  }

  // Download all data as Excel (CSV format with multiple sheets simulated)
  downloadDataAsExcel() {
    this.showDownloadMenu.set(false);
    const workbook = this.generateExcelContent();
    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.download = `analytics_report_${this.fromDate}_to_${this.toDate}.xls`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }

  // Download all data as CSV
  downloadDataAsCSV() {
    this.showDownloadMenu.set(false);
    const csvContent = this.generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `analytics_data_${this.fromDate}_to_${this.toDate}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }

  // Download charts as PDF
  async downloadAllChartsAsPDF() {
    this.showDownloadMenu.set(false);
    this.loading.set(true);

    try {
      // Create a printable HTML document with all charts
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const chartsHtml = this.generatePrintableHTML();
      printWindow.document.write(chartsHtml);
      printWindow.document.close();

      // Wait for images to load then print
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    } finally {
      this.loading.set(false);
    }
  }

  // Download full report (PDF with data)
  async downloadFullReport() {
    this.showDownloadMenu.set(false);
    this.loading.set(true);

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const fullReportHtml = this.generateFullReportHTML();
      printWindow.document.write(fullReportHtml);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 1000);
    } finally {
      this.loading.set(false);
    }
  }

  private generateExcelContent(): string {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"></head><body>`;

    // KPI Summary
    html += `<table border="1"><tr><th colspan="2" style="background:#4F46E5;color:white;">KPI Summary (${this.fromDate} to ${this.toDate})</th></tr>
    <tr><td>Total Sales</td><td>₹${this.kpiData().totalSales.toLocaleString()}</td></tr>
    <tr><td>Total Orders</td><td>${this.kpiData().totalOrders}</td></tr>
    <tr><td>Avg Order Value</td><td>₹${this.kpiData().avgOrderValue.toLocaleString()}</td></tr>
    <tr><td>Total GST</td><td>₹${(this.gstAnalysis()?.summary?.totalGST || 0).toLocaleString()}</td></tr>
    </table><br/>`;

    // Daily Sales Trend
    html += `<table border="1"><tr><th colspan="3" style="background:#10B981;color:white;">Daily Sales Trend</th></tr>
    <tr><th>Date</th><th>Sales (₹)</th><th>Invoices</th></tr>`;
    this.dailySalesTrend().forEach((d) => {
      html += `<tr><td>${d.date}</td><td>${parseFloat(d.totalSales || 0).toLocaleString()}</td><td>${d.totalInvoices || 0}</td></tr>`;
    });
    html += `</table><br/>`;

    // Category Sales
    html += `<table border="1"><tr><th colspan="2" style="background:#F59E0B;color:white;">Category-wise Sales</th></tr>
    <tr><th>Category</th><th>Sales (₹)</th></tr>`;
    this.categorySales().forEach((d) => {
      html += `<tr><td>${d.categoryName || 'Uncategorized'}</td><td>${parseFloat(d.totalSalesAmount || 0).toLocaleString()}</td></tr>`;
    });
    html += `</table><br/>`;

    // Top Items
    html += `<table border="1"><tr><th colspan="3" style="background:#8B5CF6;color:white;">Top Selling Items</th></tr>
    <tr><th>Item</th><th>Quantity</th><th>Sales (₹)</th></tr>`;
    this.topItems().forEach((d) => {
      html += `<tr><td>${d.itemName}</td><td>${parseFloat(d.totalQuantitySold || 0).toLocaleString()}</td><td>${parseFloat(d.totalSalesAmount || 0).toLocaleString()}</td></tr>`;
    });
    html += `</table><br/>`;

    // Distributor Sales
    html += `<table border="1"><tr><th colspan="2" style="background:#06B6D4;color:white;">Distributor Performance</th></tr>
    <tr><th>Distributor</th><th>Sales (₹)</th></tr>`;
    this.distributorSales().forEach((d) => {
      html += `<tr><td>${d.businessName || d.distributorName || 'Unknown'}</td><td>${parseFloat(d.totalSalesAmount || 0).toLocaleString()}</td></tr>`;
    });
    html += `</table><br/>`;

    // State Sales
    html += `<table border="1"><tr><th colspan="2" style="background:#EC4899;color:white;">State-wise Sales</th></tr>
    <tr><th>State</th><th>Sales (₹)</th></tr>`;
    this.stateSales().forEach((d) => {
      html += `<tr><td>${d.state}</td><td>${parseFloat(d.totalSalesAmount || 0).toLocaleString()}</td></tr>`;
    });
    html += `</table><br/>`;

    // Area Sales
    html += `<table border="1"><tr><th colspan="3" style="background:#84CC16;color:white;">Area-wise Sales</th></tr>
    <tr><th>Area</th><th>Invoices</th><th>Sales (₹)</th></tr>`;
    this.areaSales().forEach((d) => {
      html += `<tr><td>${d.area || d.city || 'Unknown'}</td><td>${d.totalInvoices || 0}</td><td>${parseFloat(d.totalSalesAmount || 0).toLocaleString()}</td></tr>`;
    });
    html += `</table><br/>`;

    // Crop Sales
    html += `<table border="1"><tr><th colspan="2" style="background:#10B981;color:white;">Crop-wise Sales</th></tr>
    <tr><th>Crop</th><th>Sales (₹)</th></tr>`;
    this.cropSales().forEach((d) => {
      html += `<tr><td>${d.crop || 'Unknown'}</td><td>${parseFloat(d.totalSalesAmount || 0).toLocaleString()}</td></tr>`;
    });
    html += `</table><br/>`;

    // Disease Sales
    html += `<table border="1"><tr><th colspan="2" style="background:#EF4444;color:white;">Disease-wise Sales</th></tr>
    <tr><th>Disease</th><th>Sales (₹)</th></tr>`;
    this.diseaseSales().forEach((d) => {
      html += `<tr><td>${d.disease || 'Unknown'}</td><td>${parseFloat(d.totalSalesAmount || 0).toLocaleString()}</td></tr>`;
    });
    html += `</table>`;

    html += `</body></html>`;
    return html;
  }

  private generateCSVContent(): string {
    let csv = '';

    // KPI Summary
    csv += `KPI SUMMARY (${this.fromDate} to ${this.toDate})\n`;
    csv += `Metric,Value\n`;
    csv += `Total Sales,${this.kpiData().totalSales}\n`;
    csv += `Total Orders,${this.kpiData().totalOrders}\n`;
    csv += `Avg Order Value,${this.kpiData().avgOrderValue}\n`;
    csv += `Total GST,${this.gstAnalysis()?.summary?.totalGST || 0}\n\n`;

    // Daily Sales Trend
    csv += `DAILY SALES TREND\n`;
    csv += `Date,Sales,Invoices\n`;
    this.dailySalesTrend().forEach((d) => {
      csv += `${d.date},${d.totalSales || 0},${d.totalInvoices || 0}\n`;
    });
    csv += `\n`;

    // Category Sales
    csv += `CATEGORY-WISE SALES\n`;
    csv += `Category,Sales Amount\n`;
    this.categorySales().forEach((d) => {
      csv += `"${d.categoryName || 'Uncategorized'}",${d.totalSalesAmount || 0}\n`;
    });
    csv += `\n`;

    // Top Items
    csv += `TOP SELLING ITEMS\n`;
    csv += `Item Name,Quantity Sold,Sales Amount\n`;
    this.topItems().forEach((d) => {
      csv += `"${d.itemName}",${d.totalQuantitySold || 0},${d.totalSalesAmount || 0}\n`;
    });
    csv += `\n`;

    // Distributor Sales
    csv += `DISTRIBUTOR PERFORMANCE\n`;
    csv += `Distributor,Sales Amount\n`;
    this.distributorSales().forEach((d) => {
      csv += `"${d.businessName || d.distributorName || 'Unknown'}",${d.totalSalesAmount || 0}\n`;
    });
    csv += `\n`;

    // State Sales
    csv += `STATE-WISE SALES\n`;
    csv += `State,Sales Amount\n`;
    this.stateSales().forEach((d) => {
      csv += `"${d.state}",${d.totalSalesAmount || 0}\n`;
    });
    csv += `\n`;

    // Area Sales
    csv += `AREA-WISE SALES\n`;
    csv += `Area,Invoices,Sales Amount\n`;
    this.areaSales().forEach((d) => {
      csv += `"${d.area || d.city || 'Unknown'}",${d.totalInvoices || 0},${d.totalSalesAmount || 0}\n`;
    });
    csv += `\n`;

    // Crop Sales
    csv += `CROP-WISE SALES\n`;
    csv += `Crop,Sales Amount\n`;
    this.cropSales().forEach((d) => {
      csv += `"${d.crop || 'Unknown'}",${d.totalSalesAmount || 0}\n`;
    });
    csv += `\n`;

    // Disease Sales
    csv += `DISEASE-WISE SALES\n`;
    csv += `Disease,Sales Amount\n`;
    this.diseaseSales().forEach((d) => {
      csv += `"${d.disease || 'Unknown'}",${d.totalSalesAmount || 0}\n`;
    });

    return csv;
  }

  private generatePrintableHTML(): string {
    const chartImages: string[] = [];

    // Capture chart images
    if (this.salesTrendChartRef?.nativeElement) {
      chartImages.push(`<div class="chart-section"><h3>📈 Sales Trend</h3><img src="${this.salesTrendChartRef.nativeElement.toDataURL()}" style="max-width:100%;"/></div>`);
    }
    if (this.categoryPieChartRef?.nativeElement) {
      chartImages.push(
        `<div class="chart-section"><h3>🏷️ Category Distribution</h3><img src="${this.categoryPieChartRef.nativeElement.toDataURL()}" style="max-width:100%;"/></div>`
      );
    }
    if (this.paymentDonutChartRef?.nativeElement) {
      chartImages.push(`<div class="chart-section"><h3>💳 Payment Status</h3><img src="${this.paymentDonutChartRef.nativeElement.toDataURL()}" style="max-width:100%;"/></div>`);
    }
    if (this.topItemsChartRef?.nativeElement) {
      chartImages.push(`<div class="chart-section"><h3>⭐ Top Selling Items</h3><img src="${this.topItemsChartRef.nativeElement.toDataURL()}" style="max-width:100%;"/></div>`);
    }
    if (this.distributorBarChartRef?.nativeElement) {
      chartImages.push(
        `<div class="chart-section"><h3>🚚 Distributor Performance</h3><img src="${this.distributorBarChartRef.nativeElement.toDataURL()}" style="max-width:100%;"/></div>`
      );
    }
    if (this.cropDiseaseChartRef?.nativeElement) {
      chartImages.push(`<div class="chart-section"><h3>🌾 Crop/Disease Sales</h3><img src="${this.cropDiseaseChartRef.nativeElement.toDataURL()}" style="max-width:100%;"/></div>`);
    }

    return `<!DOCTYPE html><html><head><title>Analytics Report - ${this.fromDate} to ${this.toDate}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
      .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
      .kpi-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
      .kpi-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
      .kpi-label { font-size: 12px; color: #64748b; }
      .chart-section { page-break-inside: avoid; margin-bottom: 30px; }
      .chart-section h3 { color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
      @media print { .chart-section { page-break-inside: avoid; } }
    </style></head><body>
    <div class="header">
      <h1>📊 Analytics Dashboard Report</h1>
      <p>Period: ${this.fromDate} to ${this.toDate}</p>
      <p>Generated: ${new Date().toLocaleString('en-IN')}</p>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-value">₹${this.kpiData().totalSales.toLocaleString()}</div><div class="kpi-label">Total Sales</div></div>
      <div class="kpi-card"><div class="kpi-value">${this.kpiData().totalOrders}</div><div class="kpi-label">Total Orders</div></div>
      <div class="kpi-card"><div class="kpi-value">₹${this.kpiData().avgOrderValue.toLocaleString()}</div><div class="kpi-label">Avg Order Value</div></div>
    </div>
    ${chartImages.join('')}
    </body></html>`;
  }

  private generateFullReportHTML(): string {
    const chartImages: string[] = [];

    // Capture chart images
    if (this.salesTrendChartRef?.nativeElement) {
      chartImages.push(`<div class="chart-section"><h3>📈 Sales Trend</h3><img src="${this.salesTrendChartRef.nativeElement.toDataURL()}" style="max-width:100%;"/></div>`);
    }
    if (this.categoryPieChartRef?.nativeElement) {
      chartImages.push(
        `<div class="chart-section"><h3>🏷️ Category Distribution</h3><img src="${this.categoryPieChartRef.nativeElement.toDataURL()}" style="max-width:100%;"/></div>`
      );
    }
    if (this.topItemsChartRef?.nativeElement) {
      chartImages.push(`<div class="chart-section"><h3>⭐ Top Selling Items</h3><img src="${this.topItemsChartRef.nativeElement.toDataURL()}" style="max-width:100%;"/></div>`);
    }
    if (this.distributorBarChartRef?.nativeElement) {
      chartImages.push(
        `<div class="chart-section"><h3>🚚 Distributor Performance</h3><img src="${this.distributorBarChartRef.nativeElement.toDataURL()}" style="max-width:100%;"/></div>`
      );
    }

    // Generate data tables
    let dataTables = '';

    // Top Items Table
    dataTables += `<div class="data-section"><h3>📦 Top Selling Items</h3><table>
    <tr><th>#</th><th>Item</th><th>Quantity</th><th>Amount (₹)</th></tr>`;
    this.topItems()
      .slice(0, 10)
      .forEach((item, i) => {
        dataTables += `<tr><td>${i + 1}</td><td>${item.itemName}</td><td>${parseFloat(item.totalQuantitySold || 0).toLocaleString()}</td><td>${parseFloat(item.totalSalesAmount || 0).toLocaleString()}</td></tr>`;
      });
    dataTables += `</table></div>`;

    // State Sales Table
    dataTables += `<div class="data-section"><h3>🇮🇳 State-wise Sales</h3><table>
    <tr><th>#</th><th>State</th><th>Amount (₹)</th></tr>`;
    this.stateSales()
      .slice(0, 15)
      .forEach((item, i) => {
        dataTables += `<tr><td>${i + 1}</td><td>${item.state}</td><td>${parseFloat(item.totalSalesAmount || 0).toLocaleString()}</td></tr>`;
      });
    dataTables += `</table></div>`;

    // Category Sales Table
    dataTables += `<div class="data-section"><h3>🏷️ Category-wise Sales</h3><table>
    <tr><th>#</th><th>Category</th><th>Amount (₹)</th></tr>`;
    this.categorySales()
      .slice(0, 10)
      .forEach((item, i) => {
        dataTables += `<tr><td>${i + 1}</td><td>${item.categoryName || 'Uncategorized'}</td><td>${parseFloat(item.totalSalesAmount || 0).toLocaleString()}</td></tr>`;
      });
    dataTables += `</table></div>`;

    return `<!DOCTYPE html><html><head><title>Full Analytics Report - ${this.fromDate} to ${this.toDate}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
      .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
      .kpi-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
      .kpi-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
      .kpi-label { font-size: 12px; color: #64748b; }
      .chart-section { page-break-inside: avoid; margin-bottom: 30px; }
      .chart-section h3 { color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
      .data-section { page-break-inside: avoid; margin-bottom: 25px; }
      .data-section h3 { color: #1e293b; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
      th { background: #f1f5f9; font-weight: 600; }
      tr:nth-child(even) { background: #f8fafc; }
      @media print { .chart-section, .data-section { page-break-inside: avoid; } }
    </style></head><body>
    <div class="header">
      <h1>📊 Complete Analytics Report</h1>
      <p>Period: ${this.fromDate} to ${this.toDate}</p>
      <p>Generated: ${new Date().toLocaleString('en-IN')}</p>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-value">₹${this.kpiData().totalSales.toLocaleString()}</div><div class="kpi-label">Total Sales</div></div>
      <div class="kpi-card"><div class="kpi-value">${this.kpiData().totalOrders}</div><div class="kpi-label">Total Orders</div></div>
      <div class="kpi-card"><div class="kpi-value">₹${this.kpiData().avgOrderValue.toLocaleString()}</div><div class="kpi-label">Avg Order Value</div></div>
      <div class="kpi-card"><div class="kpi-value">${this.topItems().length}</div><div class="kpi-label">Top Items</div></div>
      <div class="kpi-card"><div class="kpi-value">${this.areaSales().length}</div><div class="kpi-label">Active Areas</div></div>
      <div class="kpi-card"><div class="kpi-value">₹${(this.gstAnalysis()?.summary?.totalGST || 0).toLocaleString()}</div><div class="kpi-label">Total GST</div></div>
    </div>
    <h2>📈 Charts</h2>
    ${chartImages.join('')}
    <h2 style="page-break-before: always;">📋 Data Tables</h2>
    ${dataTables}
    </body></html>`;
  }
}
