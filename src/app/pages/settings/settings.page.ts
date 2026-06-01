import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar,
  IonIcon, IonToggle
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader,
    IonToolbar, IonIcon, IonToggle]
})
export class SettingsPage implements OnInit {

  userName = '';
  userEmail = '';
  userRole = 'Driver';
  isOnline = navigator.onLine;
  speedLimit = 80;
  vibrationEnabled = true;
  soundEnabled = false;
  backgroundTracking = true;
  autoSync = true;

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    const user = this.auth.getUser();
    this.userName = user?.name || 'Driver';
    this.userEmail = user?.email || '';
    this.userRole = user?.role || 'driver';
    this.loadSettings();

    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }

  loadSettings() {
    const s = localStorage.getItem('smartdrive_settings');
    if (s) {
      const settings = JSON.parse(s);
      this.speedLimit = settings.speedLimit ?? 80;
      this.vibrationEnabled = settings.vibrationEnabled ?? true;
      this.soundEnabled = settings.soundEnabled ?? false;
      this.backgroundTracking = settings.backgroundTracking ?? true;
      this.autoSync = settings.autoSync ?? true;
    }
  }

  saveSettings() {
    localStorage.setItem('smartdrive_settings', JSON.stringify({
      speedLimit: this.speedLimit,
      vibrationEnabled: this.vibrationEnabled,
      soundEnabled: this.soundEnabled,
      backgroundTracking: this.backgroundTracking,
      autoSync: this.autoSync,
    }));
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  goBack() {
    this.router.navigateByUrl('/dashboard');
  }
}
