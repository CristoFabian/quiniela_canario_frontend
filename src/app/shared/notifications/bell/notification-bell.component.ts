import { Component, ElementRef, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/notification.service';
import { Notificacion } from '../../../core/models/notification.models';
import { NOTIFICACION_DISPLAY, obtenerRutaNotificacion } from '../notification-display.util';

/** Máximo de notificaciones visibles en el panel desplegable de la campana. */
const MAX_VISIBLE = 8;

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly unreadCount$ = this.notificationService.unreadCount$;
  readonly display = NOTIFICACION_DISPLAY;

  panelOpen = false;
  cargando = false;
  notificaciones: Notificacion[] = [];

  /** Ruta de historial: se ajusta según el layout (admin/jugador) en el que se use la campana. */
  historialRoute = '/jugador/notificaciones';

  ngOnInit(): void {
    this.notificationService.startPolling();
    this.historialRoute = this.router.url.startsWith('/admin')
      ? '/admin/notificaciones'
      : '/jugador/notificaciones';
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.panelOpen && !this.host.nativeElement.contains(event.target as Node)) {
      this.panelOpen = false;
    }
  }

  toggle(): void {
    this.panelOpen = !this.panelOpen;
    if (this.panelOpen) {
      this.cargarUltimas();
    }
  }

  private cargarUltimas(): void {
    this.cargando = true;
    this.notificationService.listarNoLeidas(0, MAX_VISIBLE).subscribe({
      next: page => {
        this.notificaciones = page.contenido;
        this.cargando = false;
      },
      error: () => { this.cargando = false; },
    });
  }

  onNotificacionClick(n: Notificacion): void {
    const ruta = obtenerRutaNotificacion(n, this.router.url.startsWith('/admin') ? 'admin' : 'jugador');
    if (!n.leida) {
      this.notificationService.marcarLeida(n.id).subscribe({
        next: actualizada => { n.leida = true; n.fechaLectura = actualizada.fechaLectura; },
      });
    }
    if (ruta) {
      this.panelOpen = false;
      this.router.navigateByUrl(ruta);
    }
  }

  marcarTodasLeidas(): void {
    this.notificationService.marcarTodasLeidas().subscribe(() => {
      this.notificaciones.forEach(n => (n.leida = true));
    });
  }

  vaciarPanel(): void {
    if (this.notificaciones.length === 0) return;
    this.notificationService.marcarTodasLeidas().subscribe(() => {
      this.notificaciones = [];
    });
  }

  verHistorial(): void {
    this.panelOpen = false;
    this.router.navigateByUrl(this.historialRoute);
  }
}
