import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth';
import { Admin } from 'src/app/services/admin';
import { AdminAnalyticsPage } from "../admin-analytics/admin-analytics.page";
import { PdfExportService } from 'src/app/services/pdf-export-service';
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, IonIcon, IonSpinner, AdminAnalyticsPage],
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss']
})
export class AdminDashboardPage implements OnInit {

  activeTab: 'dashboard' | 'drivers' | 'trips' | 'alerts' = 'dashboard';
  adminName = '';
  isLoading = true;
  totalDrivers = 0;
  totalTrips = 0;
  totalDistance = '0';
  totalAlerts = 0;

  alerts: any[] = [];
  alertCount = 0;
  activeTrips = 0;
  drivers: any[] = [];
  recentTrips: any[] = [];
  speedAlerts: any[] = [];
  isExporting = false;
  showLogoutModal = false;

  constructor(
    private auth: AuthService,
    private adminService: Admin,
    private router: Router,
    private pdfExport: PdfExportService
  ) { }
  async ngOnInit() {
    const user = this.auth.getUser();
    this.adminName = user?.name || 'Admin';
    await this.loadDashboard();
  }
  async loadDashboard() {
    this.isLoading = true;
    try {
      const [trips, drivers, alerts] = await Promise.all([
        this.adminService.getAllTrips(),
        this.adminService.getAllDrivers(),
        this.adminService.getOverspeedAlerts()
      ]);
      this.recentTrips = trips;
      this.drivers = drivers;
      this.speedAlerts = alerts;
      this.totalTrips = trips.length;
      this.totalDrivers = drivers.length;
      this.totalAlerts = alerts.length;
      this.activeTrips =
        trips.filter((x: any) => x.status === 'active').length;
      this.totalDistance =
        trips.reduce(
          (sum: number, t: any) =>
            sum + (t.total_distance || 0),
          0
        ).toFixed(1);
    } catch (error) {
      console.error(error);
    }
    finally {
      this.isLoading = false;
    }
  }
  setTab(
    tab:
      'dashboard' |
      'drivers' |
      'trips' |
      'alerts'
  ) {
    this.activeTab = tab;
  }
  async toggleDriver(driver: any) {
    try {
      await this.adminService.toggleDriverStatus(
        driver.id,
        !driver.is_active
      );
      driver.is_active = !driver.is_active;
    } catch (error) {
      console.error(error);
    }
  }

  logout() {
    this.showLogoutModal = true;
  }

  confirmLogout() {
    this.showLogoutModal = false;
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  cancelLogout() {
    this.showLogoutModal = false;
  }
  exportDashboardPdf() {
    this.pdfExport.exportDashboard({
      totalDrivers: this.totalDrivers,
      totalTrips: this.totalTrips,
      totalAlerts: this.totalAlerts,
      activeTrips: this.activeTrips,
      totalDistance: this.totalDistance,
      drivers: this.drivers,
      recentTrips: this.recentTrips,
      speedAlerts: this.speedAlerts,
    });
  }

  exportDriversPdf() {
    this.pdfExport.exportDrivers(this.drivers);
  }

  exportTripsPdf() {
    this.pdfExport.exportTrips(this.recentTrips);
  }

  exportAlertsPdf() {
    this.pdfExport.exportAlerts(this.speedAlerts);
  }

}