import { Component } from '@angular/core';
import { DatabaseService } from './services/database';
import { SyncService } from './services/sync';
import { IonRouterOutlet, IonApp } from "@ionic/angular/standalone";
import { NotificationService } from './services/notification-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonRouterOutlet, IonApp]
})
export class AppComponent {
  constructor(
    private db: DatabaseService,
    private sync: SyncService,
    private notifications: NotificationService,
  ) {
    this.initApp();
  }

  async initApp() {
    await this.db.initDB();
    await this.sync.startListening();
    
    await this.notifications.requestPermission();
  }
}