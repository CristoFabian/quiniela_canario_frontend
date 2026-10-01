import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JugadorApiService } from '../../services/jugador-api.service';
import { Jugada, EstadoJugada, QuinielaDisponible, EstadoPerfil, Pago } from '../../models/jugador.models';

type FiltroEstado = 'TODAS' | 'ACTIVA' | 'PENDIENTE_VALIDACION' | 'CREADA';

@Component({
  selector: 'app-mis-jugadas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mis-jugadas.component.html',
  styleUrl: './mis-jugadas.component.scss',
})
export class MisJugadasComponent implements OnInit {
  private service = inject(JugadorApiService);
  private router  = inject(Router);

  cargando = true;
  error    = '';
  jugadas: Jugada[] = [];
  hayQuinielasAbiertas = false;
  // Pago PENDIENTE por jugada, para el mensaje de contacto por WhatsApp.
  pagoPorJugadaId = new Map<number, Pago>();
  quinielasAbiertas: QuinielaDisponible[] = [];
  mostrarSelector = false;
  creandoJugadaId: number | null = null;
  errorCrear = '';
  estadoPerfil: EstadoPerfil | null = null;

  // ── Filtros ───────────────────────────────────────────────────────
  busqueda    = '';
  filtroEstado: FiltroEstado = 'TODAS';

  // Eliminación inline
  eliminandoId: number | null  = null;
  confirmandoId: number | null = null;
  errorEliminar = '';

  ngOnInit(): void {
    this.cargar();
    this.cargarQuinielasAbiertas();
    this.cargarPagosPendientes();
    this.service.getPerfil().subscribe({
      next: (perfil) => { this.estadoPerfil = perfil.estado; },
      error: () => {},
    });
  }

  cargar(): void {
    this.cargando = true;
    this.error    = '';
    this.service.listarMisJugadas().subscribe({
      next: (j) => { this.jugadas = j; this.cargando = false; },
      error: (err) => { this.error = err.error?.error ?? 'Error al cargar jugadas'; this.cargando = false; },
    });
  }

  cargarPagosPendientes(): void {
    this.service.listarMisPagos().subscribe({
      next: (pagos) => {
        const pendientes = pagos.filter(p => p.estado === 'PENDIENTE');
        const map = new Map<number, Pago>();
        pendientes.forEach(pago => pago.jugadas.forEach(j => map.set(j.id, pago)));
        this.pagoPorJugadaId = map;
      },
      error: () => { this.pagoPorJugadaId = new Map(); },
    });
  }

  cargarQuinielasAbiertas(): void {
    this.service.listarQuinielasDisponibles().subscribe({
      next: (quinielas: QuinielaDisponible[]) => {
        this.quinielasAbiertas = quinielas.filter(q => q.estado === 'ABIERTA');
        this.hayQuinielasAbiertas = this.quinielasAbiertas.length > 0;
      },
      error: () => {
        this.quinielasAbiertas = [];
        this.hayQuinielasAbiertas = false;
      },
    });
  }

  abrirSelector(): void {
    this.errorCrear = '';
    this.mostrarSelector = true;
  }

  cerrarSelector(): void {
    if (this.creandoJugadaId === null) this.mostrarSelector = false;
  }

  crearJugada(quiniela: QuinielaDisponible): void {
    if (this.creandoJugadaId !== null) return;
    if (this.estadoPerfil === 'INCOMPLETO') {
      this.mostrarSelector = false;
      this.router.navigate(['/jugador/perfil']);
      return;
    }

    this.creandoJugadaId = quiniela.id;
    this.errorCrear = '';
    this.service.crearJugada({ quinielaId: quiniela.id }).subscribe({
      next: (jugada) => {
        this.creandoJugadaId = null;
        this.mostrarSelector = false;
        this.router.navigate(['/jugador/jugadas', jugada.id]);
      },
      error: (err) => {
        this.errorCrear = err.error?.error ?? 'Error al crear jugada';
        this.creandoJugadaId = null;
      },
    });
  }

  tiempoCierre(fechaCierre: string): string {
    const diff = new Date(fechaCierre).getTime() - Date.now();
    if (diff <= 0) return 'Cerrada';
    const totalHoras = Math.floor(diff / 3_600_000);
    const dias = Math.floor(totalHoras / 24);
    const horas = totalHoras % 24;
    if (dias > 0) return `${dias} día${dias !== 1 ? 's' : ''} ${horas}h`;
    const minutos = Math.floor((diff % 3_600_000) / 60_000);
    return `${horas}h ${minutos}m`;
  }

  get jugadasFiltradas(): Jugada[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.jugadas
      .filter(j => {
        const matchNombre = !q || j.quinielaNombre.toLowerCase().includes(q);
        const matchEstado =
          this.filtroEstado === 'TODAS' ||
          j.estado === this.filtroEstado;
        return matchNombre && matchEstado;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  setFiltro(f: FiltroEstado): void {
    this.filtroEstado = f;
  }

  limpiarFiltros(): void {
    this.busqueda    = '';
    this.filtroEstado = 'TODAS';
  }

  get hayFiltrosActivos(): boolean {
    return this.busqueda.trim() !== '' || this.filtroEstado !== 'TODAS';
  }

  enlaceWhatsApp(j: Jugada): string {
    const pago = this.pagoPorJugadaId.get(j.id);
    return pago
      ? this.service.enlaceWhatsAppPago(pago)
      : this.service.enlaceWhatsApp(j.id, j.quinielaNombre, j.costoQuiniela);
  }

  pedirConfirmacion(id: number): void {
    this.confirmandoId = id;
    this.errorEliminar = '';
  }

  cancelarEliminar(): void {
    this.confirmandoId = null;
  }

  eliminar(id: number): void {
    this.eliminandoId = id;
    this.errorEliminar = '';
    this.service.eliminarJugada(id).subscribe({
      next: () => {
        this.jugadas     = this.jugadas.filter(j => j.id !== id);
        this.eliminandoId  = null;
        this.confirmandoId = null;
      },
      error: (err) => {
        this.errorEliminar = err.error?.error ?? 'Error al eliminar';
        this.eliminandoId  = null;
        this.confirmandoId = null;
      },
    });
  }

  estadoClass(estado: EstadoJugada): string {
    const map: Record<EstadoJugada, string> = {
      CREADA:               'estado-creada',
      PENDIENTE_VALIDACION: 'estado-pendiente',
      ACTIVA:               'estado-activa',
      RECHAZADA:            'estado-rechazada',
      EXPIRADA:             'estado-expirada',
      FINALIZADA:           'estado-finalizada',
    };
    return map[estado] ?? '';
  }

  get jugadasActivas(): number {
    return this.jugadas.filter(j => j.estado === 'ACTIVA').length;
  }

  get jugadasPendientes(): number {
    return this.jugadas.filter(j => j.estado === 'PENDIENTE_VALIDACION').length;
  }

  get jugadasCreadas(): number {
    return this.jugadas.filter(j => j.estado === 'CREADA').length;
  }
}

