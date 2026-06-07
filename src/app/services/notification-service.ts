import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment.prod';
import { AuthService } from './auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private isNative = Capacitor.isNativePlatform();

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  private headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`
    });
  }
  private getSettings() {
    const s = localStorage.getItem('smartdrive_settings');
    return s ? JSON.parse(s) : {
      vibrationEnabled: true,
      soundEnabled: true
    };
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isNative) return false;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (e) {
      console.error('Notification permission error:', e);
      return false;
    }
  }
  private async saveAlertToDB(tripId: number, speed: number, limitSet: number) {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/admin/overspeed`, {
          tripId,
          speed,
          limitSet
        }, { headers: this.headers() })
      );
      console.log('Speed alert saved to DB');
    } catch (e) {
      console.error('Failed to save speed alert:', e);
    }
  }

async sendOverspeedAlert(speed: number, limit: number, tripId?: number): Promise<void> {
  const over = Math.round(speed - limit);
  const settings = this.getSettings();

  if (tripId) {
    await this.saveAlertToDB(tripId, speed, limit);
  }

  if (!this.isNative) return;

  if (settings.vibrationEnabled) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await Haptics.vibrate();
    } catch (e) {
      console.error('Haptics error:', e);
    }
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() / 1000),  
        title: '⚠️ Speed Limit Exceeded!',
        body: `Driving at ${Math.round(speed)} km/h — ${over} km/h over the ${limit} km/h limit.`,
        channelId: 'overspeed_alert',   
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#EF4444',
        schedule: { at: new Date(Date.now() + 100) },
        extra: { type: 'overspeed', speed, limit }
      }]
    });
  } catch (e) {
    console.error('Send notification error:', e);
  }
}

async sendTripStarted(tripId: number): Promise<void> {
  if (!this.isNative) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() / 1000),
        title: 'Trip Started',
        body: `Trip #${tripId} is now active. Drive safely!`,
        channelId: 'trip_updates',          
        schedule: { at: new Date(Date.now() + 100) }
      }]
    });
  } catch (e) {
    console.error('Trip start notification error:', e);
  }
}

async sendTripEnded(distance: string, duration: string): Promise<void> {
  if (!this.isNative) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() / 1000),
        title: 'Trip Completed',
        body: `Distance: ${distance} km · Duration: ${duration}`,
        channelId: 'trip_updates',           
        schedule: { at: new Date(Date.now() + 100) }
      }]
    });
  } catch (e) {
    console.error('Trip end notification error:', e);
  }
}

  async cancelAll(): Promise<void> {
    if (!this.isNative) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch (e) {
      console.error('Cancel notifications error:', e);
    }
  }
}