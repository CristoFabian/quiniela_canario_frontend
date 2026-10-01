import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const jugadorGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (tokenService.hasRole('USER')) {
    return true;
  }

  // Autenticado pero sin rol USER (es ADMIN) → redirige a su área
  return router.createUrlTree(['/admin']);
};
