import { Component } from '@angular/core';
import { IonRouterOutlet, IonApp } from "@ionic/angular/standalone";
import { NotificationService } from './services/notification-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonRouterOutlet, IonApp]
})
export class AppComponent {
  constructor(
    private notifications: NotificationService,
  ) {
    this.initApp();
  }

  async initApp() {
    await this.notifications.requestPermission();
  }
}