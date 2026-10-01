import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const adminGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (tokenService.hasRole('ADMIN')) {
    return true;
  }

  // Autenticado pero sin rol ADMIN → redirige a su área
  return router.createUrlTree(['/jugador']);
};
