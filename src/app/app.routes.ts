import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard]
  },
  {
    path: 'trip-active',
    loadComponent: () => import('./pages/trip-active/trip-active.page').then(m => m.TripActivePage),
    canActivate: [authGuard]
  },
  {
    path: 'trip-history',
    loadComponent: () => import('./pages/trip-history/trip-history.page').then(m => m.TripHistoryPage),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage),
    canActivate: [authGuard]
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./pages/Admin/admin-dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage),
    canActivate: [adminGuard]
  },
  {
    path: 'admin-analytics',
    loadComponent: () => import('./pages/Admin/admin-analytics/admin-analytics.page').then(m => m.AdminAnalyticsPage),
    canActivate: [adminGuard]
  },

];
