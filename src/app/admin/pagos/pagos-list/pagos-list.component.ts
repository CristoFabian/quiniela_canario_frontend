import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { PagoAdmin, ResumenPagosPorJugador } from '../../../core/models/admin.models';

type FiltroTab = 'PENDIENTE' | 'TODOS' | 'APROBADO' | 'RECHAZADO' | 'VENCIDO';

@Component({
  selector: 'app-pagos-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './pagos-list.component.html',
  styleUrl: './pagos-list.component.scss',
})
export class PagosListComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  tab: FiltroTab = 'PENDIENTE';
  cargando = true;
  error = '';
  busqueda = '';
  expandidos = new Set<number>();

  resumenPorJugador: ResumenPagosPorJugador[] = [];
  pagosPlanos: PagoAdmin[] = [];

  ngOnInit(): void {
    this.cargar();
  }

  cambiarTab(t: FiltroTab): void {
    if (this.tab === t) return;
    this.tab = t;
    this.busqueda = '';
    this.expandidos = new Set();
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    if (this.tab === 'PENDIENTE') {
      this.adminApi.resumenPendientesPorJugador().subscribe({
        next: (data) => { this.resumenPorJugador = data; this.cargando = false; },
        error: (err) => { this.error = err.error?.error ?? 'Error al cargar pagos'; this.cargando = false; },
      });
    } else {
      const estado = this.tab === 'TODOS' ? undefined : this.tab;
      this.adminApi.listarPagos(estado).subscribe({
        next: (data) => { this.pagosPlanos = data; this.cargando = false; },
        error: (err) => { this.error = err.error?.error ?? 'Error al cargar pagos'; this.cargando = false; },
      });
    }
  }

  toggleExpandido(usuarioId: number): void {
    const next = new Set(this.expandidos);
    next.has(usuarioId) ? next.delete(usuarioId) : next.add(usuarioId);
    this.expandidos = next;
  }

  fotoUrl(foto: string | null): string | null {
    return foto ? `http://localhost:8080/perfiles/${foto}` : null;
  }

  get resumenFiltrado(): ResumenPagosPorJugador[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.resumenPorJugador;
    return this.resumenPorJugador.filter(r =>
      r.username.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }

  get pagosPlanosFiltrados(): PagoAdmin[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.pagosPlanos;
    return this.pagosPlanos.filter(p =>
      p.usuarioUsername.toLowerCase().includes(q) || String(p.id).includes(q)
    );
  }

  tiempoTranscurrido(fechaStr: string): string {
    const diff = Date.now() - new Date(fechaStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'hace un momento';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days} día${days > 1 ? 's' : ''}`;
  }
}
