import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  router.navigateByUrl('/login');
  return false;
};

// Admin guard — only admin role allowed
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }

  const user = auth.getUser();
  if (user?.role === 'admin') return true;
  router.navigateByUrl('/dashboard');
  return false;
};