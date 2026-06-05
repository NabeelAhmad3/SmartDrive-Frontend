import { Component, OnInit } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar,
  IonIcon, IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth';
import { TripService } from 'src/app/services/trip';
import { SyncService } from 'src/app/services/sync';
import { DatabaseService } from 'src/app/services/database';
import { BackgroundGpsService } from 'src/app/services/background-gps-service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon, IonSpinner, SlicePipe]
})
export class DashboardPage implements OnInit {

  driverName = '';
  syncStatus = 'Offline';
  activeTrip: any = null;
  activeTripDuration = '00:00';
  isStartingTrip = false;
  totalTrips = 0;
  totalDistance = '0.0';
  avgSpeed = '0';
  overspeedCount = 0;
  unsyncedCount = 0;
  recentTrips: any[] = [];

  private durationInterval: any;

  constructor(
    private auth: AuthService,
    private tripService: TripService,
    private sync: SyncService,
    private db: DatabaseService,
    private router: Router,
    private bgGps: BackgroundGpsService
  ) { }

  async ngOnInit() {
    const user = this.auth.getUser();
    this.driverName = user?.name || 'Driver';
    await this.loadDashboard();
    this.checkSyncStatus();

    if (this.bgGps.isTracking) {
      this.activeTrip = this.recentTrips.find(t => t.status === 'active') || null;
      if (this.activeTrip) this.startDurationTimer();
    }

    this.bgGps.currentSpeed$.subscribe(speed => {
      if (speed > 0 && this.activeTrip) {
        this.syncStatus = `Live: ${speed} km/h`;
      }
    });
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
      this.activeTrip = this.recentTrips.find(t => t.status === 'active') || null;
      if (this.activeTrip) this.startDurationTimer();
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }

  async checkSyncStatus() {
    const unsynced = await this.db.getUnsyncedPoints();
    this.unsyncedCount = unsynced.length;
    this.syncStatus = navigator.onLine ? 'Online' : 'Offline';
  }

  async startTrip() {
    this.isStartingTrip = true;
    try {
      const trip = await this.tripService.startTrip();
      this.activeTrip = trip;
      this.router.navigateByUrl('/trip-active');
    } catch (e) {
      console.error('Start trip error:', e);
    } finally {
      this.isStartingTrip = false;
    }
  }

  startDurationTimer() {
    if (!this.activeTrip?.start_time) return;
    this.durationInterval = setInterval(() => {
      const start = new Date(this.activeTrip.start_time).getTime();
      const diff = Date.now() - start;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      this.activeTripDuration =
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
  }

  goToActiveTrip() {
    this.router.navigateByUrl('/trip-active');
  }

  goTo(page: string) {
    this.router.navigateByUrl(`/${page}`);
  }

  async syncNow() {
    await this.sync.syncNow();
    await this.checkSyncStatus();
  }

  logout() {
    clearInterval(this.durationInterval);
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  ngOnDestroy() {
    clearInterval(this.durationInterval);
  }
}
