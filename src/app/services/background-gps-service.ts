import { Injectable, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { NotificationService } from './notification-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';
import { environment } from 'src/environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class BackgroundGpsService {

  isTracking$ = new BehaviorSubject<boolean>(false);
  currentSpeed$ = new BehaviorSubject<number>(0);
  currentPosition$ = new BehaviorSubject<{ lat: number; lng: number } | null>(null);

  private isNative = Capacitor.isNativePlatform();
  private watchId: string | null = null;
  private browserWatchId: number | null = null;
  private currentTripId: number | null = null;
  private speedLimit = 80;
  private lastNotificationTime = 0;
  private readonly NOTIFICATION_COOLDOWN = 30000;
  private foregroundStarted = false;

  constructor(
    private notifications: NotificationService,
    private zone: NgZone,
    private http: HttpClient,
    private auth: AuthService
  ) { }
  private headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`
    });
  }
  async startTracking(tripId: number, speedLimit: number): Promise<void> {
    this.currentTripId = tripId;
    this.speedLimit = speedLimit;
    console.log('Starting tracking for trip ID:', tripId);

    if (this.isNative) {
      await this.startForegroundNotification(tripId);
      await this.startNativeTracking();
    } else {
      this.startBrowserTracking();
    }

    this.isTracking$.next(true);
    console.log(`Background GPS started for trip #${tripId}`);
  }

  private async startNativeTracking(): Promise<void> {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const perm = await Geolocation.requestPermissions();
      if (perm.location !== 'granted') {
        console.error('Location permission denied');
        return;
      }

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 5000,  
        },
        (position, err) => {
          if (err) {
            console.error('GPS watch error:', err);
            return;
          }
          if (!position) return;
          this.zone.run(() => this.handlePosition(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.speed ?? 0
          ));
        }
      );
    } catch (e) {
      console.error('Native tracking error:', e);
    }
  }

  private startBrowserTracking(): void {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    this.browserWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.handlePosition(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.speed ?? 0
        );
      },
      (err) => console.error('Browser GPS error:', err.code, err.message),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }

  private async startForegroundNotification(tripId: number): Promise<void> {
    if (this.foregroundStarted) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          id: 888888,
          title: '🚗 SmartDrive — Trip Active',
          body: `Trip #${tripId} is being tracked. GPS running in background.`,
          ongoing: true,
          autoCancel: false,
          channelId: 'trip_updates',
          smallIcon: 'ic_stat_icon_config_sample',
          schedule: { at: new Date(Date.now() + 100) },
        }]
      });
      this.foregroundStarted = true;
      console.log('Foreground notification started');
    } catch (e) {
      console.error('Foreground notification error:', e);
    }
  }

  private async stopForegroundNotification(): Promise<void> {
    if (!this.foregroundStarted) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({
        notifications: [{ id: 888888 }]
      });
      this.foregroundStarted = false;
    } catch (e) {
      console.error('Stop foreground notification error:', e);
    }
  }

  private async saveGpsPoint(tripId: number, lat: number, lng: number, speed: number) {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/gps/point`, {
          tripId, lat, lng, speed,
          timestamp: Date.now()
        }, { headers: this.headers() })
      );
    } catch (e) {
      console.error('Failed to save GPS point:', e);
    }
  }
  private async handlePosition(lat: number, lng: number, speedMs: number) {
    const speedKmh = Math.max(0, Math.round(speedMs * 3.6));

    this.currentPosition$.next({ lat, lng });
    this.currentSpeed$.next(speedKmh);

    if (this.currentTripId) {
      await this.saveGpsPoint(this.currentTripId, lat, lng, speedKmh);
    } else {
      console.warn('No active trip ID - point not saved');
    }

    await this.checkOverspeed(speedKmh);
  }

  private async checkOverspeed(speed: number): Promise<void> {
    if (speed <= this.speedLimit) return;
    const now = Date.now();
    if (now - this.lastNotificationTime > this.NOTIFICATION_COOLDOWN) {
      this.lastNotificationTime = now;
      await this.notifications.sendOverspeedAlert(
        speed,
        this.speedLimit,
        this.currentTripId ?? undefined
      );
    }
  }

  async stopTracking(): Promise<void> {
    if (this.isNative && this.watchId) {
      const { Geolocation } = await import('@capacitor/geolocation');
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }

    if (!this.isNative && this.browserWatchId !== null) {
      navigator.geolocation.clearWatch(this.browserWatchId);
      this.browserWatchId = null;
    }
    await this.stopForegroundNotification();

    this.currentTripId = null;
    this.isTracking$.next(false);
    this.currentSpeed$.next(0);
    this.currentPosition$.next(null);
    console.log('Background GPS stopped');
  }

  updateSpeedLimit(limit: number): void {
    this.speedLimit = limit;
  }

  get isTracking(): boolean {
    return this.isTracking$.getValue();
  }
}