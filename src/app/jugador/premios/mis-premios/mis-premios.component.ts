import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JugadorApiService } from '../../services/jugador-api.service';
import { PremioJugador, EstadoPremio } from '../../models/jugador.models';

@Component({
  selector: 'app-mis-premios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mis-premios.component.html',
  styleUrl: './mis-premios.component.scss',
})
export class MisPremiosComponent implements OnInit {
  private service = inject(JugadorApiService);

  cargando = true;
  error    = '';
  premios: PremioJugador[] = [];
  busqueda = '';

  confirmandoId: number | null = null;
  errorConfirmar: Record<number, string> = {};
  errorComprobante: Record<number, string> = {};

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.error    = '';
    this.service.listarMisPremios().subscribe({
      next: (p) => { this.premios = p; this.cargando = false; },
      error: () => { this.error = 'No se pudieron cargar tus premios.'; this.cargando = false; },
    });
  }

  get hayFiltrosActivos(): boolean {
    return this.busqueda.trim().length > 0;
  }

  get premiosFiltrados(): PremioJugador[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.premios;
    return this.premios.filter(p => p.nombreQuiniela.toLowerCase().includes(q));
  }

  limpiarFiltros(): void {
    this.busqueda = '';
  }

  estadoClass(estado: EstadoPremio): string {
    return {
      PENDIENTE: 'estado-pendiente',
      PAGADO:    'estado-pagado',
      CONFIRMADO: 'estado-confirmado',
    }[estado] ?? '';
  }

  estadoLabel(estado: EstadoPremio): string {
    return {
      PENDIENTE: 'Pendiente de pago',
      PAGADO:    'Pagado, pendiente de confirmar',
      CONFIRMADO: 'Confirmado',
    }[estado] ?? estado;
  }

  estadoIcon(estado: EstadoPremio): string {
    return {
      PENDIENTE: 'fa-regular fa-clock fa-warn',
      PAGADO:    'fa-solid fa-money-bill-wave',
      CONFIRMADO: 'fa-solid fa-circle-check fa-ok',
    }[estado] ?? '';
  }

  verComprobante(premio: PremioJugador): void {
    this.errorComprobante[premio.ganadorId] = '';
    this.service.getMiComprobantePremio(premio.ganadorId).subscribe({
      next:  (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: ()     => { this.errorComprobante[premio.ganadorId] = 'No se pudo cargar el comprobante.'; },
    });
  }

  confirmarRecepcion(premio: PremioJugador): void {
    this.confirmandoId = premio.ganadorId;
    this.errorConfirmar[premio.ganadorId] = '';
    this.service.confirmarRecepcionPremio(premio.ganadorId).subscribe({
      next: (actualizado) => {
        const idx = this.premios.findIndex(p => p.ganadorId === actualizado.ganadorId);
        if (idx !== -1) this.premios[idx] = actualizado;
        this.confirmandoId = null;
      },
      error: (err) => {
        this.errorConfirmar[premio.ganadorId] = err.error?.error ?? 'Error al confirmar la recepción del premio';
        this.confirmandoId = null;
      },
    });
  }
}
