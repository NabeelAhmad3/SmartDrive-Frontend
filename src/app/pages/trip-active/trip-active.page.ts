import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { TripService } from 'src/app/services/trip';
import { NotificationService } from 'src/app/services/notification-service';
import { BackgroundGpsService } from 'src/app/services/background-gps-service';

@Component({
  selector: 'app-trip-active',
  templateUrl: './trip-active.page.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader,
    IonToolbar, IonIcon, IonSpinner, DecimalPipe, DatePipe]
})
export class TripActivePage implements OnInit, OnDestroy {

  currentTripId: number | null = null;
  isTracking    = false;
  isLoading     = false;
  tripStatus    = 'Ready';
  currentSpeed  = 0;
  maxSpeed      = 0;
  speedLimit    = 80;
  isOverspeed   = false;
  currentLat    = 0;
  currentLng    = 0;
  totalSpeedSum = 0;
  totalSpeedReadings = 0;
  private lastNotificationTime  = 0;
  private notificationCooldown  = 30000;
  tripDistance  = '0.0';
  tripDuration  = '00:00';
  tripStartTime: Date | null = null;
  private map!: L.Map;
  private marker!: L.Marker;
  private polyline!: L.Polyline;
  private routePoints: L.LatLng[] = [];
  private durationInterval: any;
  private positionSub!: Subscription;
  private speedSub!: Subscription;

  constructor(
    private bgGps: BackgroundGpsService,
    private tripService: TripService,
    private router: Router,
    private notifications: NotificationService,
  ) {
    const settings = localStorage.getItem('smartdrive_settings');
    if (settings) {
      this.speedLimit = JSON.parse(settings).speedLimit ?? 80;
    }
  }

  async ngOnInit() {
    await this.notifications.requestPermission();
    setTimeout(() => this.initMap(), 300);
    this.positionSub = this.bgGps.currentPosition$.subscribe(pos => {
      if (!pos) return;
      this.currentLat = pos.lat;
      this.currentLng = pos.lng;
      this.updateMap(pos.lat, pos.lng);
    });

    this.speedSub = this.bgGps.currentSpeed$.subscribe(async speed => {
      this.currentSpeed = speed;
      if (speed > this.maxSpeed) this.maxSpeed = speed;
      this.totalSpeedSum += speed;
      this.totalSpeedReadings++;
      await this.checkSpeedLimit(speed);
    });
  }

  initMap() {
    this.map = L.map('map', { zoomControl: false }).setView([30.3753, 69.3451], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
    this.polyline = L.polyline([], {
      color: '#00D4FF', weight: 4, opacity: 0.8
    }).addTo(this.map);
  }

  async startTrip() {
    this.isLoading = true;
    try {
      const trip = await this.tripService.startTrip();
      this.currentTripId = trip.id;
      this.tripStartTime = new Date(trip.start_time);
      this.isTracking    = true;
      this.tripStatus    = 'In Progress';
      await this.bgGps.startTracking(trip.id, this.speedLimit);
      this.startDurationTimer();
      await this.notifications.sendTripStarted(trip.id);
    } catch (e) {
      console.error('Start trip error:', e);
    } finally {
      this.isLoading = false;
    }
  }

  updateMap(lat: number, lng: number) {
    const latlng = L.latLng(lat, lng);
    this.routePoints.push(latlng);
    this.polyline.setLatLngs(this.routePoints);

    if (!this.marker) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#00D4FF;
               border:3px solid white;border-radius:50%;
               box-shadow:0 0 10px #00D4FF;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      this.marker = L.marker(latlng, { icon }).addTo(this.map);
    } else {
      this.marker.setLatLng(latlng);
    }

    this.map.panTo(latlng);
    this.updateDistance();
  }

  updateDistance() {
    if (this.routePoints.length < 2) return;
    let total = 0;
    for (let i = 1; i < this.routePoints.length; i++) {
      total += this.routePoints[i - 1].distanceTo(this.routePoints[i]);
    }
    this.tripDistance = (total / 1000).toFixed(2);
  }

  async checkSpeedLimit(speed: number) {
    this.isOverspeed = speed > this.speedLimit;

    if (this.isOverspeed) {
      const now = Date.now();
      if (now - this.lastNotificationTime > this.notificationCooldown) {
        this.lastNotificationTime = now;
        await this.notifications.sendOverspeedAlert(speed, this.speedLimit,
        this.currentTripId ?? undefined);
      }
    }
  }

  startDurationTimer() {
    this.durationInterval = setInterval(() => {
      if (!this.tripStartTime) return;
      const diff = Date.now() - this.tripStartTime.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      this.tripDuration =
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
  }

  async endTrip() {
    if (!this.currentTripId) return;
    this.isLoading = true;
    try {
      const avgSpeed = this.totalSpeedReadings > 0
        ? Math.round(this.totalSpeedSum / this.totalSpeedReadings)
        : 0;

      await this.tripService.endTrip(this.currentTripId, {
        totalDistance: parseFloat(this.tripDistance),
        maxSpeed:      this.maxSpeed,
        avgSpeed
      });
      await this.bgGps.stopTracking();
      await this.notifications.sendTripEnded(this.tripDistance, this.tripDuration);

      clearInterval(this.durationInterval);
      this.isTracking = false;
      this.tripStatus = 'Completed';
      this.router.navigateByUrl('/dashboard');

    } catch (e) {
      console.error('End trip error:', e);
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigateByUrl('/dashboard');
  }

  ngOnDestroy() {
    clearInterval(this.durationInterval);
    this.positionSub?.unsubscribe();
    this.speedSub?.unsubscribe();
    if (this.map) this.map.remove();
  }
}
