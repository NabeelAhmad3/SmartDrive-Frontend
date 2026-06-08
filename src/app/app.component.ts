import { Component, OnInit } from '@angular/core';
import { IonRouterOutlet, IonApp } from "@ionic/angular/standalone";
import { NotificationService } from './services/notification-service';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonRouterOutlet, IonApp]
})
export class AppComponent implements OnInit {
  constructor(
    private notifications: NotificationService,
    private router: Router,
    private auth: AuthService,
  ) {
    this.initApp();
  }
  async ngOnInit() {
    await this.setupNotificationChannels();
    await this.checkAuthAndRedirect();
  }
  async initApp() {
    await this.notifications.requestPermission();
  }
  private async setupNotificationChannels() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      await LocalNotifications.deleteChannel({ id: 'overspeed_alert' });
      await LocalNotifications.deleteChannel({ id: 'trip_updates' });

      await LocalNotifications.createChannel({
        id: 'overspeed_alert',
        name: 'Overspeed Alerts',
        description: 'Alerts when speed limit is exceeded',
        importance: 5,
        sound: 'default',
        vibration: true,
        visibility: 1,
        lights: true,
        lightColor: '#EF4444'
      });

      await LocalNotifications.createChannel({
        id: 'trip_updates',
        name: 'Trip Updates',
        description: 'Trip start and end notifications',
        importance: 3,
        sound: 'default',
        vibration: false,
        visibility: 1,
      });

    } catch (e) {
      console.error('Channel creation error:', e);
    }
  }

  private async checkAuthAndRedirect() {
    if (!this.auth.isLoggedIn()) return;

    const user = this.auth.getUser();
    if (user?.role === 'admin') {
      this.router.navigateByUrl('/admin-dashboard', { replaceUrl: true });
    } else {
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    }
  }
}
