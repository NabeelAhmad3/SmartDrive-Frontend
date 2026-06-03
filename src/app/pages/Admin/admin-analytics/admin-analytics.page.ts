import {
  Component, OnInit, AfterViewInit,
  OnDestroy, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { Admin } from 'src/app/services/admin';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-analytics',
  templateUrl: './admin-analytics.page.html',
  standalone: true,
  imports: [CommonModule, IonIcon, IonSpinner]
})
export class AdminAnalyticsPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('tripsChart') tripsChartRef!: ElementRef;
  @ViewChild('distanceChart') distanceChartRef!: ElementRef;
  @ViewChild('speedChart') speedChartRef!: ElementRef;
  @ViewChild('driverChart') driverChartRef!: ElementRef;

  isLoading = true;
  analytics: any[] = [];
  drivers: any[] = [];
  private charts: Chart<any>[] = [];

  constructor(private adminService: Admin) { }

  async ngOnInit() {
    try {
      const [analytics, drivers, alerts] = await Promise.all([
        this.adminService.getAnalytics(),
        this.adminService.getAllDrivers(),
        this.adminService.getOverspeedAlerts()
      ]);
      this.analytics = analytics.reverse();
      this.drivers = drivers;
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

    const chart = new Chart(this.tripsChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Trips',
          data,
          backgroundColor: 'rgba(6, 182, 212, 0.7)',
          borderColor: '#06B6D4',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} trips`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94A3B8', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
            ticks: { color: '#94A3B8', stepSize: 1, font: { size: 11 } }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  buildDistanceChart() {
    if (!this.distanceChartRef) return;
    const labels = this.analytics.map(d =>
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = this.analytics.map(d => parseFloat(d.total_distance || 0));
    const chart = new Chart(this.distanceChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Distance (km)',
          data,
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#8B5CF6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} km`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94A3B8', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
            ticks: {
              color: '#94A3B8',
              font: { size: 11 },
              callback: (v) => `${v} km`
            }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  buildSpeedChart() {
    if (!this.speedChartRef) return;
    const labels = this.analytics.map(d =>
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = this.analytics.map(d => parseFloat(d.avg_speed || 0));

    const chart = new Chart(this.speedChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Avg Speed',
          data,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
        },
        {
          label: 'Speed Limit',
          data: new Array(labels.length).fill(80),
          borderColor: '#EF4444',
          borderWidth: 2,
          borderDash: [6, 4],
          fill: false,
          pointRadius: 0,
          tension: 0,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#64748B', font: { size: 11 }, boxWidth: 12 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} km/h`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94A3B8', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
            ticks: {
              color: '#94A3B8',
              font: { size: 11 },
              callback: (v) => `${v} km/h`
            }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  buildDriverChart() {
    if (!this.driverChartRef || !this.drivers.length) return;

    const colors = [
      '#06B6D4', '#8B5CF6', '#10B981',
      '#F59E0B', '#EF4444', '#3B82F6'
    ];

    const chart = new Chart(this.driverChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.drivers.map(d => d.name),
        datasets: [{
          data: this.drivers.map((_, i) =>
            Math.floor(Math.random() * 10) + 1
          ),
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#64748B',
              font: { size: 11 },
              padding: 16,
              boxWidth: 12,
              usePointStyle: true,
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed} trips`
            }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
  }
}