import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar,
  IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import * as L from 'leaflet';
import { GpsService } from 'src/app/services/gps';
import { TripService } from 'src/app/services/trip';
import { DatabaseService } from 'src/app/services/database';

@Component({
  selector: 'app-trip-active',
  templateUrl: './trip-active.page.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader,
    IonToolbar, IonIcon, IonSpinner, DecimalPipe, DatePipe]
})
export class TripActivePage implements OnInit, OnDestroy {

  currentTripId: number | null = null;
  isTracking = false;
  isLoading = false;
  tripStatus = 'Ready';
  currentSpeed = 0;
  maxSpeed = 0;
  speedLimit = 80;
  isOverspeed = false;
  totalSpeedReadings = 0;
  totalSpeedSum = 0;
  currentLat = 0;
  currentLng = 0;
  tripDistance = '0.0';
  tripDuration = '00:00';
  tripStartTime: Date | null = null;
  private map!: L.Map;
  private marker!: L.Marker;
  private polyline!: L.Polyline;
  private routePoints: L.LatLng[] = [];
  private durationInterval: any;
  private gpsSubscription: any;
  constructor(
    private gps: GpsService,
    private tripService: TripService,
    private db: DatabaseService,
    private router: Router
  ) { }

  ngOnInit() {
    setTimeout(() => this.initMap(), 300);
  }

  initMap() {
    this.map = L.map('map', { zoomControl: false }).setView([30.3753, 69.3451], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
    this.polyline = L.polyline([], { color: '#00D4FF', weight: 4 }).addTo(this.map);
  }

  async startTrip() {
    this.isLoading = true;
    try {
      const trip = await this.tripService.startTrip();
      this.currentTripId = trip.id;
      this.tripStartTime = new Date(trip.start_time);
      this.isTracking = true;
      this.tripStatus = 'In Progress';
      this.startDurationTimer();
      await this.startGpsTracking();
    } catch (e) {
      console.error('Start trip error:', e);
    } finally {
      this.isLoading = false;
    }
  }

  async startGpsTracking() {
    await this.gps.startTracking();

    this.gps.currentPosition$.subscribe(async (pos) => {
      if (!pos) return;
      this.currentLat = pos.lat;
      this.currentLng = pos.lng;
      this.updateMap(pos.lat, pos.lng);
      if (this.currentTripId) {
        await this.db.insertGpsPoint(this.currentTripId, pos.lat, pos.lng, this.currentSpeed);
      }
    });

    this.gps.currentSpeed$.subscribe((speed) => {
      this.currentSpeed = speed;
      if (speed > this.maxSpeed) this.maxSpeed = speed;
      this.totalSpeedSum += speed;
      this.totalSpeedReadings++;
      this.checkSpeedLimit(speed);
    });
  }

  updateMap(lat: number, lng: number) {
    const latlng = L.latLng(lat, lng);
    this.routePoints.push(latlng);
    this.polyline.setLatLngs(this.routePoints);

    if (!this.marker) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#00D4FF;border:3px solid white;border-radius:50%;box-shadow:0 0 10px #00D4FF;"></div>`,
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

  checkSpeedLimit(speed: number) {
    const wasOverspeed = this.isOverspeed;
    this.isOverspeed = speed > this.speedLimit;
    if (this.isOverspeed && !wasOverspeed) {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });
    }
  }

  startDurationTimer() {
    this.durationInterval = setInterval(() => {
      if (!this.tripStartTime) return;
      const diff = Date.now() - this.tripStartTime.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      this.tripDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
        maxSpeed: this.maxSpeed,
        avgSpeed
      });

      await this.gps.stopTracking();
      this.isTracking = false;
      this.tripStatus = 'Completed';
      clearInterval(this.durationInterval);
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
    this.gps.stopTracking().catch(() => { });
    if (this.map) this.map.remove();
  }
}
