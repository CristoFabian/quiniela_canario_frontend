import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, interval, startWith, switchMap, tap } from 'rxjs';

import { Notificacion, NotificacionCount, NotificacionPage } from '../models/notification.models';
import { AuthService } from './auth.service';

/** Intervalo de refresco automático del contador de no leídas (ms). */
const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly BASE = 'http://localhost:8080/api/notificaciones';
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly _unreadCount$ = new BehaviorSubject<number>(0);
  /** Contador de no leídas para el badge de la campana; se actualiza por polling y tras cada acción. */
  readonly unreadCount$ = this._unreadCount$.asObservable();

  private pollingSub: Subscription | null = null;

  /** Inicia el refresco periódico del contador. Se detiene automáticamente al hacer logout. */
  startPolling(): void {
    if (this.pollingSub || !this.authService.isAuthenticated()) return;
    this.pollingSub = interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.contarNoLeidas()),
      )
      .subscribe();
  }

  stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = null;
    this._unreadCount$.next(0);
  }

  /** GET /api/notificaciones?pagina=&tamanio= */
  listar(pagina = 0, tamanio = 20): Observable<NotificacionPage> {
    const params = new HttpParams().set('pagina', pagina).set('tamanio', tamanio);
    return this.http.get<NotificacionPage>(this.BASE, { params });
  }

  /** GET /api/notificaciones/no-leidas?pagina=&tamanio= */
  listarNoLeidas(pagina = 0, tamanio = 10): Observable<NotificacionPage> {
    const params = new HttpParams().set('pagina', pagina).set('tamanio', tamanio);
    return this.http.get<NotificacionPage>(`${this.BASE}/no-leidas`, { params });
  }

  /** GET /api/notificaciones/count — actualiza también el BehaviorSubject del badge. */
  contarNoLeidas(): Observable<NotificacionCount> {
    return this.http.get<NotificacionCount>(`${this.BASE}/count`).pipe(
      tap(res => this._unreadCount$.next(res.noLeidas)),
    );
  }

  /** PUT /api/notificaciones/{id}/leida */
  marcarLeida(id: string): Observable<Notificacion> {
    return this.http.put<Notificacion>(`${this.BASE}/${id}/leida`, {}).pipe(
      tap(() => this.decrementarContador()),
    );
  }

  /** PUT /api/notificaciones/leidas */
  marcarTodasLeidas(): Observable<void> {
    return this.http.put<void>(`${this.BASE}/leidas`, {}).pipe(
      tap(() => this._unreadCount$.next(0)),
    );
  }

  private decrementarContador(): void {
    this._unreadCount$.next(Math.max(0, this._unreadCount$.value - 1));
  }
}
