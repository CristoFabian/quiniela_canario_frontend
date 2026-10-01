import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface JwtPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  role?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly ROLE_KEY = 'auth_role';
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.ROLE_KEY);
    }
  }

  hasToken(): boolean {
    return this.getToken() !== null;
  }

  decodeToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const payload = parts[1];
      // Normalize base64url to base64
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const decoded = atob(padded);
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null;
    }
  }

  isTokenExpired(): boolean {
    const payload = this.decodeToken();
    if (!payload || payload['exp'] === undefined) {
      return true;
    }
    const expirationMs = (payload['exp'] as number) * 1000;
    return Date.now() >= expirationMs;
  }

  isAuthenticated(): boolean {
    return this.hasToken() && !this.isTokenExpired();
  }

  getUsername(): string | null {
    return (this.decodeToken()?.['sub'] as string) ?? null;
  }

  setRole(role: string): void {
    if (this.isBrowser) {
      localStorage.setItem(this.ROLE_KEY, role);
    }
  }

  getRole(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem(this.ROLE_KEY);
  }

  hasRole(role: string): boolean {
    return this.getRole() === role;
  }
}
