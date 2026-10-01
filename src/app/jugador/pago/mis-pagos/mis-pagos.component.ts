import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JugadorApiService } from '../../services/jugador-api.service';
import { Pago, EstadoPago } from '../../models/jugador.models';

type FiltroPago = 'TODOS' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

@Component({
  selector: 'app-mis-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mis-pagos.component.html',
  styleUrl: './mis-pagos.component.scss',
})
export class MisPagosComponent implements OnInit {
  private service = inject(JugadorApiService);

  cargando = true;
  error    = '';
  pagos: Pago[] = [];

  // ── Filtros ───────────────────────────────────────────────────────
  busqueda     = '';
  filtroEstado: FiltroPago = 'TODOS';

  // Para reintentar pago RECHAZADO
  reintentarId:     number | null = null;  // pago que muestra el formulario
  reintentarMonto:  number        = 0;
  reintentarFile:   File | null   = null;
  subiendoId:       number | null = null;
  errorSubir        = '';
  exitoSubir        = '';

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.error    = '';
    this.service.listarMisPagos().subscribe({
      next: (p) => { this.pagos = p; this.cargando = false; },
      error: () => { this.error = 'No se pudieron cargar tus pagos.'; this.cargando = false; },
    });
  }

  get pagosFiltrados(): Pago[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.pagos
      .filter(p => {
        const matchNombre = !q || p.jugadas.some(j => j.quinielaNombre.toLowerCase().includes(q));
        const matchEstado = this.filtroEstado === 'TODOS' || p.estado === this.filtroEstado;
        return matchNombre && matchEstado;
      })
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }

  setFiltro(f: FiltroPago): void { this.filtroEstado = f; }

  limpiarFiltros(): void {
    this.busqueda    = '';
    this.filtroEstado = 'TODOS';
  }

  get hayFiltrosActivos(): boolean {
    return this.busqueda.trim() !== '' || this.filtroEstado !== 'TODOS';
  }

  count(estado: EstadoPago): number {
    return this.pagos.filter(p => p.estado === estado).length;
  }

  estadoClass(estado: EstadoPago): string {
    return {
      PENDIENTE: 'estado-pendiente',
      APROBADO:  'estado-aprobado',
      RECHAZADO: 'estado-rechazado',
    }[estado] ?? '';
  }

  estadoLabel(estado: EstadoPago): string {
    return {
      PENDIENTE: 'Pendiente',
      APROBADO:  'Aprobado',
      RECHAZADO: 'Rechazado',
    }[estado] ?? estado;
  }

  estadoIcon(estado: EstadoPago): string {
    return {
      PENDIENTE: 'fa-regular fa-clock fa-warn',
      APROBADO:  'fa-solid fa-circle-check fa-ok',
      RECHAZADO: 'fa-solid fa-circle-xmark fa-danger',
    }[estado] ?? '';
  }

  // ── Reintentar pago rechazado ─────────────────────────────────────

  /** Devuelve true si alguna jugada de este pago ya quedó cubierta por otro pago PENDIENTE o APROBADO. */
  tienePagoActivoConMismasJugadas(pago: Pago): boolean {
    const ids = new Set(pago.jugadas.map(j => j.id));
    return this.pagos.some(
      p => (p.estado === 'APROBADO' || p.estado === 'PENDIENTE') &&
           p.id !== pago.id &&
           p.jugadas.some(j => ids.has(j.id))
    );
  }

  /** Solo se puede registrar un nuevo pago si todas sus jugadas siguen CREADA y sus quinielas ABIERTA. */
  puedeReintentarPago(pago: Pago): boolean {
    return !this.tienePagoActivoConMismasJugadas(pago) &&
           pago.jugadas.every(j => j.estado === 'CREADA' && j.estadoQuiniela === 'ABIERTA');
  }

  abrirReintentar(pago: Pago): void {
    this.reintentarId    = pago.id;
    this.reintentarMonto = pago.monto;
    this.reintentarFile  = null;
    this.errorSubir      = '';
    this.exitoSubir      = '';
  }

  cancelarReintentar(): void {
    this.reintentarId   = null;
    this.reintentarFile = null;
    this.errorSubir     = '';
  }

  onSeleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) { this.reintentarFile = null; return; }
    const permitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!permitidos.includes(file.type)) {
      this.errorSubir = 'Solo JPG, PNG o PDF.';
      this.reintentarFile = null;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorSubir = 'El archivo no debe superar 5 MB.';
      this.reintentarFile = null;
      return;
    }
    this.errorSubir     = '';
    this.reintentarFile = file;
  }

  enviarReintento(): void {
    if (!this.reintentarId) return;
    if (!this.reintentarMonto || this.reintentarMonto <= 0) {
      this.errorSubir = 'Ingresa un monto válido mayor a $0.';
      return;
    }
    if (!this.reintentarFile) {
      this.errorSubir = 'Debes adjuntar un comprobante de pago para continuar.';
      return;
    }
    this.subiendoId = this.reintentarId;
    this.errorSubir = '';
    this.exitoSubir = '';
    this.service.reintentarPago(
      this.reintentarId,
      this.reintentarMonto,
      this.reintentarFile
    ).subscribe({
      next: (nuevoPago) => {
        // Insertar el nuevo pago al inicio de la lista; el rechazado se conserva
        this.pagos = [nuevoPago, ...this.pagos];
        this.subiendoId      = null;
        this.reintentarId    = null;
        this.reintentarFile  = null;
        this.exitoSubir      = `Nuevo pago #${nuevoPago.id} registrado. ¡Espera la validación!`;
      },
      error: (err) => {
        this.errorSubir = err.error?.error ?? 'Error al registrar el reintento. Intenta de nuevo.';
        this.subiendoId = null;
      },
    });
  }

  onResubirComprobante(event: Event, pago: Pago): void {
    // Kept for backward compat (PENDIENTE sin comprobante)
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    const permitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!permitidos.includes(file.type)) { this.errorSubir = 'Solo JPG, PNG o PDF.'; return; }
    if (file.size > 5 * 1024 * 1024)    { this.errorSubir = 'El archivo no debe superar 5 MB.'; return; }
    this.subiendoId = pago.id;
    this.errorSubir = '';
    this.service.subirComprobante(pago.id, file).subscribe({
      next: (updated) => {
        const idx = this.pagos.findIndex(p => p.id === pago.id);
        if (idx !== -1) this.pagos[idx] = updated;
        this.subiendoId = null;
      },
      error: () => { this.errorSubir = 'Error al subir el comprobante.'; this.subiendoId = null; },
    });
  }
}
