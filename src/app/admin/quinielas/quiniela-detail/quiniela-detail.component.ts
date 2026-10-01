import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QuinielaService } from '../quiniela.service';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { QuinielaDetalle, PartidoResumen, CierreQuiniela, RankingQuinielaAdminDetalle, PremioAdmin } from '../../../core/models/admin.models';

type EstadoQuiniela = 'CREADA' | 'ABIERTA' | 'EN_JUEGO' | 'FINALIZADA';

@Component({
  selector: 'app-quiniela-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './quiniela-detail.component.html',
  styleUrl: './quiniela-detail.component.scss',
})
export class QuinielaDetailComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private fb       = inject(FormBuilder);
  private service  = inject(QuinielaService);
  private adminApi = inject(AdminApiService);

  quiniela: QuinielaDetalle | null = null;
  cargando = true;
  error    = '';

  // ── Agregar partido
  mostrarFormPartido = false;
  guardandoPartido   = false;
  errorPartido       = '';
  partidoForm!: FormGroup;

  // ── Editar quiniela (solo en estado CREADA)
  mostrarFormEdicion = false;
  guardandoEdicion   = false;
  errorEdicion       = '';
  exitoEdicion       = '';
  edicionForm!: FormGroup;

  // ── Resultados por partido (Record para acceso directo en template)
  resultadoForms:           Record<number, FormGroup> = {};
  estadoPartido:            Record<number, string>    = {};
  partidoAbierto:           number | null             = null;
  guardandoResultado:       number | null             = null;
  guardandoEstadoPartido:   number | null             = null;
  errorResultado = '';

  // ── Editar partido (solo quiniela=CREADA y partido=PENDIENTE)
  editPartidoForms:     Record<number, FormGroup> = {};
  editandoPartidoId:    number | null             = null;
  guardandoEditPartido: number | null             = null;
  errorEditPartido      = '';
  exitoEditPartido      = '';

  readonly ESTADOS_PARTIDO = ['PENDIENTE', 'EN_JUEGO', 'FINALIZADO', 'SUSPENDIDO', 'POSPUESTO'];
  guardandoEstadoQ = false;

  // ── Cierre de quiniela ─────────────────────────────────────────────────
  cierre: CierreQuiniela | null = null;
  cerrando = false;
  errorCierre = '';
  // ── Ranking ─────────────────────────────────────────────────────────────
  ranking: RankingQuinielaAdminDetalle | null = null;
  cargandoRanking = false;

  /** jugadaId cuya fila del ranking tiene el detalle de pronósticos expandido. */
  filaExpandidaId: number | null = null;

  toggleDetalleFila(jugadaId: number): void {
    this.filaExpandidaId = this.filaExpandidaId === jugadaId ? null : jugadaId;
  }

  // ── Premios (entrega del premio monetario a los ganadores) ─────────────
  premios: PremioAdmin[] = [];
  premioFileSeleccionado: Record<number, File> = {};
  premioOtrosFileSeleccionado: Record<number, File> = {};
  subiendoComprobantePremio: number | null = null;
  subiendoComprobantePremioOtros: number | null = null;
  errorPremio: Record<number, string> = {};
  exitoPremio: Record<number, string> = {};
  errorPremioOtros: Record<number, string> = {};
  exitoPremioOtros: Record<number, string> = {};

  premioDeJugada(jugadaId: number): PremioAdmin | undefined {
    return this.premios.find(pr => pr.jugadaId === jugadaId);
  }

  estadoPremioClass(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'pr-pendiente', PAGADO: 'pr-pagado', CONFIRMADO: 'pr-confirmado',
    };
    return map[estado] ?? '';
  }

  estadoPremioLabel(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'Pendiente de pago', PAGADO: 'Pagado', CONFIRMADO: 'Confirmado por jugador',
    };
    return map[estado] ?? estado;
  }

  estadoPremioIcon(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'fa-regular fa-clock fa-warn', PAGADO: 'fa-solid fa-money-bill-wave', CONFIRMADO: 'fa-solid fa-circle-check fa-ok',
    };
    return map[estado] ?? '';
  }

  cargarPremios(quinielaId: number): void {
    this.adminApi.listarPremiosPorQuiniela(quinielaId).subscribe({
      next:  (p) => (this.premios = p),
      error: ()  => {},
    });
  }

  onSeleccionarComprobantePremio(event: Event, ganadorId: number): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    this.errorPremio[ganadorId] = '';
    if (!file) { delete this.premioFileSeleccionado[ganadorId]; return; }
    const permitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!permitidos.includes(file.type)) {
      this.errorPremio[ganadorId] = 'Solo JPG, PNG o PDF.';
      delete this.premioFileSeleccionado[ganadorId];
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorPremio[ganadorId] = 'El archivo no debe superar 5 MB.';
      delete this.premioFileSeleccionado[ganadorId];
      return;
    }
    this.premioFileSeleccionado[ganadorId] = file;
  }

  onSeleccionarComprobantePremioOtros(event: Event, ganadorId: number): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    this.errorPremioOtros[ganadorId] = '';
    if (!file) { delete this.premioOtrosFileSeleccionado[ganadorId]; return; }
    const permitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!permitidos.includes(file.type)) {
      this.errorPremioOtros[ganadorId] = 'Solo JPG, PNG o PDF.';
      delete this.premioOtrosFileSeleccionado[ganadorId];
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorPremioOtros[ganadorId] = 'El archivo no debe superar 5 MB.';
      delete this.premioOtrosFileSeleccionado[ganadorId];
      return;
    }
    this.premioOtrosFileSeleccionado[ganadorId] = file;
  }

  subirComprobantePremio(ganadorId: number): void {
    const file = this.premioFileSeleccionado[ganadorId];
    if (!file) { this.errorPremio[ganadorId] = 'Selecciona un archivo de comprobante.'; return; }
    this.subiendoComprobantePremio = ganadorId;
    this.errorPremio[ganadorId] = '';
    this.exitoPremio[ganadorId] = '';
    this.adminApi.subirComprobantePremio(ganadorId, file).subscribe({
      next: (actualizado) => {
        const idx = this.premios.findIndex(pr => pr.ganadorId === ganadorId);
        if (idx !== -1) this.premios[idx] = actualizado;
        delete this.premioFileSeleccionado[ganadorId];
        this.subiendoComprobantePremio = null;
        this.exitoPremio[ganadorId] = 'Comprobante registrado, premio marcado como PAGADO.';
      },
      error: (err) => {
        this.errorPremio[ganadorId] = err.error?.error ?? 'Error al subir el comprobante';
        this.subiendoComprobantePremio = null;
      },
    });
  }

  subirComprobantePremioOtros(ganadorId: number): void {
    const file = this.premioOtrosFileSeleccionado[ganadorId];
    if (!file) { this.errorPremioOtros[ganadorId] = 'Selecciona un archivo para el comprobante adicional.'; return; }
    this.subiendoComprobantePremioOtros = ganadorId;
    this.errorPremioOtros[ganadorId] = '';
    this.exitoPremioOtros[ganadorId] = '';
    this.adminApi.subirComprobantePremioOtros(ganadorId, file).subscribe({
      next: (actualizado) => {
        const idx = this.premios.findIndex(pr => pr.ganadorId === ganadorId);
        if (idx !== -1) this.premios[idx] = actualizado;
        delete this.premioOtrosFileSeleccionado[ganadorId];
        this.subiendoComprobantePremioOtros = null;
        this.exitoPremioOtros[ganadorId] = 'Comprobante adicional registrado correctamente.';
      },
      error: (err) => {
        this.errorPremioOtros[ganadorId] = err.error?.error ?? 'Error al subir el comprobante adicional';
        this.subiendoComprobantePremioOtros = null;
      },
    });
  }

  verComprobantePremio(ganadorId: number): void {
    this.adminApi.getComprobantePremio(ganadorId).subscribe({
      next:  (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: ()     => { this.errorPremio[ganadorId] = 'No se pudo cargar el comprobante'; },
    });
  }

  verComprobantePremioOtros(ganadorId: number): void {
    this.adminApi.getComprobantePremioOtros(ganadorId).subscribe({
      next:  (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: ()     => { this.errorPremioOtros[ganadorId] = 'No se pudo cargar el comprobante adicional'; },
    });
  }

  ngOnInit(): void {
    this.initPartidoForm();
    this.initEdicionForm();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar(id);
  }

  private initPartidoForm(): void {
    this.partidoForm = this.fb.group({
      equipoLocal:      ['', [Validators.required, Validators.maxLength(100)]],
      equipoVisitante:  ['', [Validators.required, Validators.maxLength(100)]],
      descripcion:      ['', Validators.maxLength(300)],
      fechaPartido:     ['', Validators.required],
    });
  }

  private toDatetimeLocal(iso: string): string {
    // Convert ISO/backend date string to "YYYY-MM-DDTHH:mm" for datetime-local inputs
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private initEdicionForm(): void {
    const q = this.quiniela;
    this.edicionForm = this.fb.group({
      nombre:      [q?.nombre      ?? '', [Validators.required, Validators.maxLength(150)]],
      descripcion: [q?.descripcion ?? '',  Validators.maxLength(500)],
      costo:       [q?.costo       ?? null, [Validators.required, Validators.min(0.01)]],
      fechaInicio: [q ? this.toDatetimeLocal(q.fechaInicio) : '', Validators.required],
      fechaCierre: [q ? this.toDatetimeLocal(q.fechaCierre) : '', Validators.required],
    });
  }

  abrirEdicion(): void {
    this.initEdicionForm();
    this.errorEdicion = '';
    this.exitoEdicion = '';
    this.mostrarFormEdicion = true;
  }

  cancelarEdicion(): void {
    this.mostrarFormEdicion = false;
    this.errorEdicion = '';
  }

  guardarEdicion(): void {
    if (this.edicionForm.invalid) { this.edicionForm.markAllAsTouched(); return; }
    const v = this.edicionForm.value;
    this.guardandoEdicion = true;
    this.errorEdicion     = '';
    this.exitoEdicion     = '';
    this.service.actualizar(this.quiniela!.id, {
      nombre:      v.nombre,
      descripcion: v.descripcion ?? '',
      costo:       v.costo,
      fechaInicio: v.fechaInicio + ':00',
      fechaCierre: v.fechaCierre + ':00',
    }).subscribe({
      next: (q) => {
        this.quiniela!.nombre      = q.nombre;
        this.quiniela!.descripcion = q.descripcion;
        this.quiniela!.costo       = q.costo;
        this.quiniela!.fechaInicio = q.fechaInicio;
        this.quiniela!.fechaCierre = q.fechaCierre;
        this.mostrarFormEdicion    = false;
        this.exitoEdicion          = 'Quiniela actualizada correctamente';
        this.guardandoEdicion      = false;
        setTimeout(() => this.exitoEdicion = '', 4000);
      },
      error: (err) => {
        this.errorEdicion     = err.error?.error ?? 'Error al actualizar la quiniela';
        this.guardandoEdicion = false;
      },
    });
  }

  abrirEditarPartido(p: PartidoResumen): void {
    this.editPartidoForms[p.id] = this.fb.group({
      equipoLocal:     [p.equipoLocal,     [Validators.required, Validators.maxLength(100)]],
      equipoVisitante: [p.equipoVisitante, [Validators.required, Validators.maxLength(100)]],
      descripcion:     [p.descripcion ?? '', Validators.maxLength(300)],
      fechaPartido:    [this.toDatetimeLocal(p.fechaPartido), Validators.required],
    });
    this.editandoPartidoId = p.id;
    this.errorEditPartido  = '';
    this.exitoEditPartido  = '';
  }

  cancelarEditarPartido(): void {
    this.editandoPartidoId = null;
    this.errorEditPartido  = '';
  }

  guardarEditarPartido(partido: PartidoResumen): void {
    const form = this.editPartidoForms[partido.id];
    if (!form || form.invalid) { form?.markAllAsTouched(); return; }
    const v = form.value;
    this.guardandoEditPartido = partido.id;
    this.errorEditPartido     = '';
    this.exitoEditPartido     = '';
    this.service.actualizarPartido(partido.id, {
      equipoLocal:     v.equipoLocal,
      equipoVisitante: v.equipoVisitante,
      descripcion:     v.descripcion ?? '',
      fechaPartido:    v.fechaPartido + ':00',
    }).subscribe({
      next: (updated) => {
        const idx = this.quiniela!.partidos.findIndex(p => p.id === updated.id);
        if (idx !== -1) {
          this.quiniela!.partidos[idx] = updated;
          this.initResultadoForm(updated);
        }
        this.editandoPartidoId    = null;
        this.guardandoEditPartido = null;
        this.exitoEditPartido     = `Partido #${updated.id} actualizado correctamente`;
        setTimeout(() => this.exitoEditPartido = '', 4000);
      },
      error: (err) => {
        this.errorEditPartido     = err.error?.error ?? 'Error al actualizar el partido';
        this.guardandoEditPartido = null;
      },
    });
  }

  private initResultadoForm(p: PartidoResumen): void {
    this.resultadoForms[p.id] = this.fb.group({
      marcadorLocal:      [p.marcadorLocal],
      marcadorVisitante:  [p.marcadorVisitante],
      totalCorners:       [p.totalCorners],
      ambosMarcan:        [p.ambosMarcan ?? false],
    });
    this.estadoPartido[p.id] = p.estado;
  }

  cargar(id: number): void {
    this.cargando = true;
    this.error    = '';
    this.service.detalle(id).subscribe({
      next: (q) => {
        this.quiniela = q;
        q.partidos.forEach(p => this.initResultadoForm(p));
        this.initEdicionForm();
        this.cargando = false;
        if (q.estado === 'FINALIZADA') {
          this.service.obtenerCierre(q.id).subscribe({
            next:  (c) => (this.cierre = c),
            error: ()  => {},
          });
          this.cargarPremios(q.id);
        }
        if (q.estado === 'EN_JUEGO' || q.estado === 'FINALIZADA') {
          this.cargandoRanking = true;
          this.service.getRankingDetalle(q.id).subscribe({
            next:  (r) => { this.ranking = r; this.cargandoRanking = false; },
            error: ()  => { this.cargandoRanking = false; },
          });
        }
      },
      error: (err) => {
        this.error    = err.error?.error ?? 'Error al cargar quiniela';
        this.cargando = false;
      },
    });
  }

  /** Comisión por organización sobre la bolsa acumulada. */
  readonly COMISION_ORGANIZACION = 0.10;

  /** Bolsa acumulada neta, descontando el 10% de comisión por organización. */
  get bolsaNeta(): number {
    return (this.quiniela?.bolsaAcumulada ?? 0) * (1 - this.COMISION_ORGANIZACION);
  }

  get puedeAgregarPartido(): boolean {
    return this.quiniela?.estado === 'CREADA' && (this.quiniela?.partidos?.length ?? 0) < 8;
  }

  get transicionesDisponibles(): string[] {
    const map: Record<EstadoQuiniela, string[]> = {
      CREADA:     ['ABIERTA'],
      ABIERTA:    ['EN_JUEGO'],
      EN_JUEGO:   ['FINALIZADA'],
      FINALIZADA: [],
    };
    return map[this.quiniela?.estado as EstadoQuiniela] ?? [];
  }

  condicionEstadoPartido(p: PartidoResumen, nuevoEstado: string): { ok: boolean; mensaje: string } {
    const ahora      = new Date();
    const fechaMatch = new Date(p.fechaPartido);

    if (nuevoEstado === 'EN_JUEGO') {
      if (ahora < fechaMatch) {
        return { ok: false, mensaje: `El partido aún no comienza (${fechaMatch.toLocaleString('es-MX')})` };
      }
    }

    if (nuevoEstado === 'FINALIZADO') {
      if (ahora < fechaMatch) {
        return { ok: false, mensaje: `El partido aún no comienza (${fechaMatch.toLocaleString('es-MX')})` };
      }
      const incompleto = p.marcadorLocal == null || p.marcadorVisitante == null ||
                         p.totalCorners  == null || p.ambosMarcan == null;
      if (incompleto) {
        return { ok: false, mensaje: 'Faltan resultados por registrar (marcador, corners, ambos marcan)' };
      }
    }

    return { ok: true, mensaje: '' };
  }

  condicionEstado(estado: string): { ok: boolean; mensaje: string } {
    switch (estado) {
      case 'ABIERTA': {
        const total = this.quiniela?.totalPartidos ?? 0;
        if (total < 8) return { ok: false, mensaje: `Necesita 8 partidos (tiene ${total})` };
        return { ok: true, mensaje: '' };
      }
      case 'EN_JUEGO': {
        const cierre = this.quiniela?.fechaCierre ? new Date(this.quiniela.fechaCierre) : null;
        if (cierre && new Date() < cierre) {
          return { ok: false, mensaje: `La fecha de cierre aún no llega (${cierre.toLocaleString('es-MX')})` };
        }
        return { ok: true, mensaje: '' };
      }
      case 'FINALIZADA': {
        const partidos = this.quiniela?.partidos ?? [];
        const TERMINALES = new Set(['FINALIZADO', 'SUSPENDIDO', 'POSPUESTO']);
        const pendientes = partidos.filter(p => !TERMINALES.has(p.estado)).length;
        if (pendientes > 0) return { ok: false, mensaje: `${pendientes} partido(s) aún sin concluir (deben estar en FINALIZADO, SUSPENDIDO o POSPUESTO)` };
        return { ok: true, mensaje: '' };
      }
      default:
        return { ok: true, mensaje: '' };
    }
  }

  cambiarEstadoQuiniela(estado: string): void {
    if (!this.quiniela || this.guardandoEstadoQ) return;
    this.guardandoEstadoQ = true;
    this.error = '';

    if (estado === 'FINALIZADA') {
      this.cerrando   = true;
      this.errorCierre = '';
      this.service.cerrar(this.quiniela.id).subscribe({
        next: (cierre) => {
          this.quiniela!.estado = 'FINALIZADA';
          this.cierre           = cierre;
          this.guardandoEstadoQ = false;
          this.cerrando         = false;
          this.cargarPremios(this.quiniela!.id);
        },
        error: (err) => {
          this.errorCierre      = err.error?.error ?? 'Error al cerrar la quiniela';
          this.guardandoEstadoQ = false;
          this.cerrando         = false;
        },
      });
      return;
    }

    this.service.actualizarEstado(this.quiniela.id, estado).subscribe({
      next:  (q)   => { this.quiniela!.estado = q.estado; this.guardandoEstadoQ = false; },
      error: (err) => { this.error = err.error?.error ?? 'Error al cambiar estado'; this.guardandoEstadoQ = false; },
    });
  }

  agregarPartido(): void {
    if (this.partidoForm.invalid) { this.partidoForm.markAllAsTouched(); return; }
    const v = this.partidoForm.value;
    this.guardandoPartido = true;
    this.errorPartido     = '';
    this.service.agregarPartido(this.quiniela!.id, {
      equipoLocal:     v.equipoLocal,
      equipoVisitante: v.equipoVisitante,
      descripcion:     v.descripcion ?? '',
      fechaPartido:    v.fechaPartido + ':00',
    }).subscribe({
      next: (p) => {
        this.quiniela!.partidos.push(p);
        this.quiniela!.totalPartidos++;
        this.initResultadoForm(p);
        this.partidoForm.reset();
        this.mostrarFormPartido = false;
        this.guardandoPartido   = false;
      },
      error: (err) => {
        this.errorPartido     = err.error?.error ?? 'Error al agregar partido';
        this.guardandoPartido = false;
      },
    });
  }

  guardarResultados(partido: PartidoResumen): void {
    const form = this.resultadoForms[partido.id];
    if (!form) return;
    this.guardandoResultado = partido.id;
    this.errorResultado     = '';
    const v = form.value;
    this.service.actualizarResultados(partido.id, {
      marcadorLocal:     v.marcadorLocal,
      marcadorVisitante: v.marcadorVisitante,
      totalCorners:      v.totalCorners,
      ambosMarcan:       v.ambosMarcan,
    }).subscribe({
      next: (updated) => {
        const idx = this.quiniela!.partidos.findIndex(p => p.id === updated.id);
        if (idx !== -1) { this.quiniela!.partidos[idx] = updated; this.initResultadoForm(updated); }
        this.guardandoResultado = null;
      },
      error: (err) => {
        this.errorResultado     = err.error?.error ?? 'Error al guardar resultados';
        this.guardandoResultado = null;
      },
    });
  }

  guardarEstadoPartido(partido: PartidoResumen): void {
    const estado = this.estadoPartido[partido.id];
    this.guardandoEstadoPartido = partido.id;
    this.service.actualizarEstadoPartido(partido.id, estado).subscribe({
      next: (updated) => {
        const idx = this.quiniela!.partidos.findIndex(p => p.id === updated.id);
        if (idx !== -1) this.quiniela!.partidos[idx] = updated;
        this.estadoPartido[updated.id]  = updated.estado;
        this.guardandoEstadoPartido     = null;
      },
      error: (err) => {
        this.errorResultado         = err.error?.error ?? 'Error al cambiar estado del partido';
        this.guardandoEstadoPartido = null;
      },
    });
  }

  togglePartido(id: number): void {
    this.partidoAbierto = this.partidoAbierto === id ? null : id;
  }

  estadoQClass(estado: string): string {
    const map: Record<string, string> = {
      CREADA: 'q-creada', ABIERTA: 'q-abierta', EN_JUEGO: 'q-en-juego', FINALIZADA: 'q-finalizada',
    };
    return map[estado] ?? '';
  }

  estadoPClass(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'p-pendiente', EN_JUEGO: 'p-en-juego', FINALIZADO: 'p-finalizado',
      SUSPENDIDO: 'p-suspendido', POSPUESTO: 'p-pospuesto',
    };
    return map[estado] ?? '';
  }

  get pf() { return this.partidoForm.controls; }

  /** Un partido se puede evaluar cuando está en estado terminal (no importa el estado de la quiniela). */
  puedeEvaluarPartido(p: PartidoResumen): boolean {
    return p.estado === 'FINALIZADO' || p.estado === 'SUSPENDIDO' || p.estado === 'POSPUESTO';
  }
}
