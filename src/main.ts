import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { defineCustomElements as ionicPwaElements } from '@ionic/pwa-elements/loader';
import { addIcons } from 'ionicons';
import { IonicModule } from '@ionic/angular';
import {
  carOutline, cloudUploadOutline, logOutOutline, mapOutline, navigateOutline, playCircleOutline, playOutline,
  personOutline, notificationsOutline, arrowBackOutline, locationOutline, stopOutline, downloadOutline,
  chevronForwardOutline, searchOutline, flagOutline, phonePortraitOutline, eyeOffOutline, settingsOutline,
  eyeOutline, mailOutline, lockClosedOutline, carSport, barChartOutline, peopleOutline, shieldCheckmarkOutline,
  speedometerOutline, timeOutline, warningOutline, analyticsOutline, pulseOutline, carSportOutline, trendingUpOutline,
  closeOutline,
  sendOutline,
  keyOutline,
  checkmarkOutline,
} from 'ionicons/icons';
import { importProvidersFrom } from '@angular/core';
ionicPwaElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    importProvidersFrom(IonicModule.forRoot()),
  ],
});

addIcons({
  carOutline, navigateOutline, speedometerOutline,
  warningOutline, playCircleOutline, playOutline,
  timeOutline, mapOutline, settingsOutline, cloudUploadOutline,
  logOutOutline, arrowBackOutline, personOutline, notificationsOutline,
  locationOutline, stopOutline, downloadOutline, chevronForwardOutline,
  searchOutline, flagOutline, phonePortraitOutline, eyeOffOutline, eyeOutline,
  mailOutline, lockClosedOutline, carSport, shieldCheckmarkOutline, peopleOutline,
  barChartOutline, pulseOutline, analyticsOutline, carSportOutline, trendingUpOutline,
  closeOutline,sendOutline,keyOutline,checkmarkOutline

});