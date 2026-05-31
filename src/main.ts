import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { defineCustomElements as ionicPwaElements } from '@ionic/pwa-elements/loader';
import { addIcons } from 'ionicons';
import {
  trashOutline, pencilOutline, saveOutline, closeOutline,
  personCircle, calendarOutline,
  timeOutline, checkmarkCircleOutline, calendar,
  shieldCheckmark, statsChart, people, searchOutline,
  personCircleOutline, heartCircle, mailOutline,
  personOutline, homeOutline, callOutline, lockClosedOutline, logInOutline, personAddOutline, time,
  lockClosed, reloadOutline, checkmarkOutline,
  addCircleOutline, createOutline, documentText, documentTextOutline,
  eyeOutline, chatbubbleEllipses, chatbubbleEllipsesOutline,
  chatbubblesOutline, arrowBackOutline, peopleOutline,
  chatbubbleOutline, send, happyOutline
} from 'ionicons/icons';
ionicPwaElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
  ],
});

addIcons({
  'trash-outline': trashOutline,
  'pencil-outline': pencilOutline,
  'save-outline': saveOutline,
  'close-outline': closeOutline,
  'person-circle': personCircle,
  'calendar-outline': calendarOutline,
  'time-outline': timeOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'calendar': calendar,
  'shield-checkmark': shieldCheckmark,
  'stats-chart': statsChart,
  'people': people,
  'search-outline': searchOutline,
  'person-circle-outline': personCircleOutline,
  'heart-circle': heartCircle,
  'mail-outline': mailOutline,
  'person-outline': personOutline,
  'home-outline': homeOutline,
  'call-outline': callOutline,
  'lock-closed-outline': lockClosedOutline,
  'log-in-outline': logInOutline,
  'person-add-outline': personAddOutline,
  'time': time,
  'lock-closed': lockClosed,
  'reload-outline': reloadOutline,
  'checkmark-outline': checkmarkOutline,
  'add-circle-outline': addCircleOutline,
  'create-outline': createOutline,
  'document-text': documentText,
  'document-text-outline': documentTextOutline,
  'eye-outline': eyeOutline,
  'chatbubble-ellipses': chatbubbleEllipses,
  'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
  'chatbubbles-outline': chatbubblesOutline,
  'arrow-back-outline': arrowBackOutline,
  'people-outline': peopleOutline,
  'chatbubble-outline': chatbubbleOutline,
  'send': send,
  'happy-outline': happyOutline,
});