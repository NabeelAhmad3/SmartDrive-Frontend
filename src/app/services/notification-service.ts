import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private isNative = Capacitor.isNativePlatform();
  async requestPermission(): Promise<boolean> {
    if (!this.isNative) {
      console.log('Notifications: browser mode — skipping');
      return false;
    }
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.requestPermissions();
      console.log('Notification permission:', result.display);
      return result.display === 'granted';
    } catch (e) {
      console.error('Notification permission error:', e);
      return false;
    }
  }
  async sendOverspeedAlert(speed: number, limit: number): Promise<void> {
    const over = Math.round(speed - limit);

    if (!this.isNative) {
      console.log(`[Browser] Overspeed: ${speed} km/h (limit ${limit} km/h)`);
      return;
    }

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: '⚠️ Speed Limit Exceeded!',
            body: `You are driving at ${Math.round(speed)} km/h — ${over} km/h over the ${limit} km/h limit. Please slow down.`,
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#EF4444',
            extra: {
              type: 'overspeed',
              speed,
              limit
            },
            schedule: { at: new Date(Date.now() + 100) }
          }
        ]
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
        notifications: [
          {
            id: Date.now(),
            title: '🚗 Trip Started',
            body: `Trip #${tripId} is now active. Drive safely!`,
            sound: 'default',
            schedule: { at: new Date(Date.now() + 100) }
          }
        ]
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
        notifications: [
          {
            id: Date.now(),
            title: '✅ Trip Completed',
            body: `Trip ended. Distance: ${distance} km · Duration: ${duration}`,
            sound: 'default',
            schedule: { at: new Date(Date.now() + 100) }
          }
        ]
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