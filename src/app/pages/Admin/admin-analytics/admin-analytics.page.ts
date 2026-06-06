import {
  Component, OnInit, AfterViewInit,
  OnDestroy, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { Admin } from 'src/app/services/admin';

Chart.register(...registerables);

const GRID_COLOR = '#f1f5f9';
const TICK_COLOR = '#94a3b8';
const TICK_FONT  = { size: 11, family: 'Inter, system-ui, sans-serif' };

const TOOLTIP_BASE = {
  backgroundColor: '#1e293b',
  titleColor: '#94a3b8',
  bodyColor: '#f8fafc',
  padding: 10,
};

@Component({
  selector: 'app-admin-analytics',
  templateUrl: './admin-analytics.page.html',
  standalone: true,
  imports: [CommonModule, IonIcon, IonSpinner]
})
export class AdminAnalyticsPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('tripsChart')    tripsChartRef!:    ElementRef;
  @ViewChild('distanceChart') distanceChartRef!: ElementRef;
  @ViewChild('speedChart')    speedChartRef!:    ElementRef;
  @ViewChild('driverChart')   driverChartRef!:   ElementRef;

  isLoading = true;
  analytics: any[] = [];
  drivers:   any[] = [];
  trips:     any[] = [];
  private charts: Chart<any>[] = [];

  constructor(private adminService: Admin) {}

  async ngOnInit() {
    try {
      const [analytics, drivers, trips] = await Promise.all([
        this.adminService.getAnalytics(),
        this.adminService.getAllDrivers(),
        this.adminService.getAllTrips(),
      ]);
      this.analytics = analytics.reverse();
      this.drivers   = drivers;
      this.trips     = trips;
    } catch (e) {
      console.error('Analytics error:', e);
    } finally {
      this.isLoading = false;
    }
  }

  ngAfterViewInit() {
    const interval = setInterval(() => {
      if (!this.isLoading && this.analytics.length) {
        clearInterval(interval);
        setTimeout(() => this.buildAllCharts(), 100);
      }
    }, 200);
  }

  buildAllCharts() {
    this.buildTripsChart();
    this.buildDistanceChart();
    this.buildSpeedChart();
    this.buildDriverChart();
  }

  buildTripsChart() {
    if (!this.tripsChartRef) return;
    const labels = this.analytics.map(d =>
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = this.analytics.map(d => parseInt(d.total_trips || 0));

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Trips',
          data,
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          borderColor: '#06B6D4',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
          hoverBackgroundColor: 'rgba(6, 182, 212, 0.35)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...TOOLTIP_BASE,
            callbacks: { label: ctx => ` ${ctx.parsed.y} trips` }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: TICK_COLOR, font: TICK_FONT }
          },
          y: {
            beginAtZero: true,
            grid: { color: GRID_COLOR },
            border: { display: false },
            ticks: { color: TICK_COLOR, stepSize: 1, font: TICK_FONT }
          }
        }
      }
    };

    this.charts.push(new Chart(this.tripsChartRef.nativeElement, config));
  }

  buildDistanceChart() {
    if (!this.distanceChartRef) return;
    const labels = this.analytics.map(d =>
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = this.analytics.map(d => parseFloat(d.total_distance || 0));

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Distance (km)',
          data,
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.07)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#8B5CF6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...TOOLTIP_BASE,
            callbacks: {
              label: ctx => ` ${(ctx.parsed.y ?? 0).toFixed(1)} km`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: TICK_COLOR, font: TICK_FONT }
          },
          y: {
            beginAtZero: true,
            grid: { color: GRID_COLOR },
            border: { display: false },
            ticks: {
              color: TICK_COLOR,
              font: TICK_FONT,
              callback: v => `${v} km`
            }
          }
        }
      }
    };

    this.charts.push(new Chart(this.distanceChartRef.nativeElement, config));
  }

  buildSpeedChart() {
    if (!this.speedChartRef) return;
    const labels = this.analytics.map(d =>
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = this.analytics.map(d => parseFloat(d.avg_speed || 0));

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Avg Speed',
            data,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.07)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Speed Limit (80)',
            data: new Array(labels.length).fill(80),
            borderColor: '#EF4444',
            borderWidth: 1.5,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            tension: 0,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#64748b',
              font: TICK_FONT,
              boxWidth: 10,
              usePointStyle: true,
              pointStyleWidth: 8,
              padding: 16,
            }
          },
          tooltip: {
            ...TOOLTIP_BASE,
            callbacks: {
              label: ctx => ` ${(ctx.parsed.y ?? 0).toFixed(1)} km/h`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: TICK_COLOR, font: TICK_FONT }
          },
          y: {
            beginAtZero: false,
            grid: { color: GRID_COLOR },
            border: { display: false },
            ticks: {
              color: TICK_COLOR,
              font: TICK_FONT,
              callback: v => `${v} km/h`
            }
          }
        }
      }
    };

    this.charts.push(new Chart(this.speedChartRef.nativeElement, config));
  }

  buildDriverChart() {
    if (!this.driverChartRef || !this.drivers.length) return;

    const tripCounts = this.drivers.map(driver =>
      this.trips.filter((t: any) =>
        t.driver_id === driver.id || t.driver_name === driver.name
      ).length
    );

    const filtered = this.drivers
      .map((d, i) => ({ name: d.name, count: tripCounts[i] }))
      .filter(d => d.count > 0);

    const colors = [
      '#06B6D4', '#8B5CF6', '#10B981',
      '#F59E0B', '#EF4444', '#3B82F6',
      '#EC4899', '#14B8A6',
    ];

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: filtered.map(d => d.name),
        datasets: [{
          data: filtered.map(d => d.count),
          backgroundColor: colors.slice(0, filtered.length),
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#64748b',
              font: TICK_FONT,
              padding: 14,
              boxWidth: 10,
              usePointStyle: true,
              pointStyleWidth: 8,
            }
          },
          tooltip: {
            ...TOOLTIP_BASE,
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} trips`
            }
          }
        }
      }
    };

    this.charts.push(new Chart(this.driverChartRef.nativeElement, config));
  }

  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
  }
}