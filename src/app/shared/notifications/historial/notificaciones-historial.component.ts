import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/notification.service';
import { Notificacion } from '../../../core/models/notification.models';
import { agruparPorFecha, GrupoNotificaciones, NOTIFICACION_DISPLAY, obtenerRutaNotificacion } from '../notification-display.util';

type Filtro = 'todas' | 'no-leidas';

@Component({
  selector: 'app-notificaciones-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones-historial.component.html',
  styleUrl: './notificaciones-historial.component.scss',
})
export class NotificacionesHistorialComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly display = NOTIFICACION_DISPLAY;

  filtro: Filtro = 'todas';
  grupos: GrupoNotificaciones[] = [];
  cargando = false;
  error: string | null = null;

  pagina = 0;
  readonly tamanio = 20;
  totalPaginas = 0;
  totalElementos = 0;

  ngOnInit(): void {
    this.cargar();
  }

  cambiarFiltro(filtro: Filtro): void {
    if (this.filtro === filtro) return;
    this.filtro = filtro;
    this.pagina = 0;
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = null;
    const obs = this.filtro === 'todas'
      ? this.notificationService.listar(this.pagina, this.tamanio)
      : this.notificationService.listarNoLeidas(this.pagina, this.tamanio);

    obs.subscribe({
      next: page => {
        this.grupos = agruparPorFecha(page.contenido);
        this.totalPaginas = page.totalPaginas;
        this.totalElementos = page.totalElementos;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las notificaciones.';
        this.cargando = false;
      },
    });
  }

  irAPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas || pagina === this.pagina) return;
    this.pagina = pagina;
    this.cargar();
  }

  irANotificacion(n: Notificacion): void {
    const ruta = obtenerRutaNotificacion(n, this.router.url.startsWith('/admin') ? 'admin' : 'jugador');
    if (!n.leida) {
      this.notificationService.marcarLeida(n.id).subscribe({
        next: actualizada => {
          n.leida = true;
          n.fechaLectura = actualizada.fechaLectura;
        },
      });
    }
    if (ruta) {
      this.router.navigateByUrl(ruta);
    }
  }

  marcarTodasLeidas(): void {
    this.notificationService.marcarTodasLeidas().subscribe(() => {
      this.grupos.forEach(g => g.items.forEach(n => (n.leida = true)));
    });
  }
}
