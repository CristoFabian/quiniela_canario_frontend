import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/**
 * Evita que un usuario ya autenticado acceda a /login o /register.
 * Lo redirige a su área correspondiente.
 */
export const publicGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.isAuthenticated()) {
    return true;
  }

  const role = tokenService.getRole();
  if (role === 'ADMIN') {
    return router.createUrlTree(['/admin']);
  }

  return router.createUrlTree(['/jugador']);
};
