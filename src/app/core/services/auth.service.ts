import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { TokenService } from './token.service';
import { AuthResponse, LoginRequest, RegisterRequest, ResetPasswordRequest } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';

  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  private readonly _isAuthenticated$ = new BehaviorSubject<boolean>(
    this.tokenService.isAuthenticated()
  );

  readonly isAuthenticated$ = this._isAuthenticated$.asObservable();

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        this.tokenService.setToken(response.token);
        this.tokenService.setRole(response.role);
        this._isAuthenticated$.next(true);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/reset-password`, data);
  }

  logout(): void {
    this.tokenService.removeToken();
    this._isAuthenticated$.next(false);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.tokenService.isAuthenticated();
  }

  getUsername(): string | null {
    return this.tokenService.getUsername();
  }

  getRole(): string | null {
    return this.tokenService.getRole();
  }

  hasRole(role: string): boolean {
    return this.tokenService.hasRole(role);
  }
}
