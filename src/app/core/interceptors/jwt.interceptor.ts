import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

import { TokenService } from '../services/token.service';

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const tokenService = inject(TokenService);
  const token = tokenService.getToken();

  // Login and registration are public; an old or expired token must not
  // make the backend JWT filter reject these requests with 401.
  const isPublicAuthRequest = req.url.startsWith('http://localhost:8080/api/auth/');

  if (token && !isPublicAuthRequest) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(authReq);
  }

  return next(req);
};
