import { Component, OnInit } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon, IonModal } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth';
import { TripService } from 'src/app/services/trip';
import { BackgroundGpsService } from 'src/app/services/background-gps-service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon, SlicePipe, IonModal]
})
export class DashboardPage implements OnInit {

  driverName = '';
  isStartingTrip = false;
  totalTrips = 0;
  totalDistance = '0.0';
  avgSpeed = '0';
  overspeedCount = 0;
  recentTrips: any[] = [];

  private durationInterval: any;
  showLogoutModal = false;

  constructor(
    private auth: AuthService,
    private tripService: TripService,
    private router: Router,
    private bgGps: BackgroundGpsService
  ) { }

  async ngOnInit() {
    const user = this.auth.getUser();
    this.driverName = user?.name || 'Driver';
    await this.loadDashboard();
  }

  overspeedAlerts: any[] = [];

  async loadDashboard() {
    try {
      const stats = await this.tripService.getStats();
      this.totalTrips = stats.totalTrips || 0;
      this.totalDistance = (stats.totalDistance || 0).toFixed(1);
      this.avgSpeed = Math.round(stats.avgSpeed || 0).toString();
      this.overspeedCount = stats.overspeedCount || 0;
      this.recentTrips = await this.tripService.getRecentTrips(5);
      this.overspeedAlerts = await this.tripService.getOverspeedAlerts();
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }


  async startTrip() {
    this.isStartingTrip = true;
    try {
      this.router.navigateByUrl('/trip-active');
    } catch (e) {
      console.error('Start trip error:', e);
    } finally {
      this.isStartingTrip = false;
    }
  }


  goToActiveTrip() {
    this.router.navigateByUrl('/trip-active');
  }

  goTo(page: string) {
    this.router.navigateByUrl(`/${page}`);
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

  ngOnDestroy() {
    clearInterval(this.durationInterval);
  }
}
