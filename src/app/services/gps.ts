import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GpsService {
  currentSpeed$ = new BehaviorSubject<number>(0);
  currentPosition$ = new BehaviorSubject<{lat:number,lng:number}|null>(null);
  private watchId: string | null = null;

  async startTracking() {
    await Geolocation.requestPermissions();
    this.watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 1000 },
      (pos) => {
        if (!pos) return;
        const speedMs = pos.coords.speed ?? 0;
        const speedKmh = speedMs * 3.6;
        this.currentSpeed$.next(Math.round(speedKmh));
        this.currentPosition$.next({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      }
    );
  }

  async stopTracking() {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }
}