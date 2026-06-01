import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class GpsService {
  currentSpeed$ = new BehaviorSubject<number>(0);
  currentPosition$ = new BehaviorSubject<{ lat: number; lng: number } | null>(null);

  private watchId: string | null = null;
  private isNative = Capacitor.isNativePlatform();

  async startTracking() {
    if (this.isNative) {
      await this.startNativeTracking();
    } else {
      this.startBrowserTracking();
    }
  }

  private async startNativeTracking() {
    const { Geolocation } = await import('@capacitor/geolocation');
    await Geolocation.requestPermissions();
    this.watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 1000 },
      (pos) => {
        if (!pos) return;
        const speedMs = pos.coords.speed ?? 0;
        this.currentSpeed$.next(Math.round(speedMs * 3.6));
        this.currentPosition$.next({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      }
    );
  }

  private startBrowserTracking() {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const speedMs = pos.coords.speed ?? 0;
        this.currentSpeed$.next(Math.round(speedMs * 3.6));
        this.currentPosition$.next({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => console.error('GPS error:', err),
      { enableHighAccuracy: true, timeout: 5000 }
    );
    this.watchId = id.toString();
  }

  async stopTracking() {
    if (!this.watchId) return;
    if (this.isNative) {
      const { Geolocation } = await import('@capacitor/geolocation');
      await Geolocation.clearWatch({ id: this.watchId });
    } else {
      navigator.geolocation.clearWatch(Number(this.watchId));
    }
    this.watchId = null;
    this.currentSpeed$.next(0);
    this.currentPosition$.next(null);
  }
}
