import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { JugadorApiService } from '../../services/jugador-api.service';
import {
  Jugada, QuinielaDisponible, PartidoJugador,
  PronosticoJugado, TipoPronosticoJugador, OpcionPronosticoJugador, RankingQuiniela,
  PremioJugador
} from '../../models/jugador.models';

type EstadoJugada = Jugada['estado'];
type ModoForm = 'agregar' | 'editar';

@Component({
  selector: 'app-jugada-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './jugada-detalle.component.html',
  styleUrl: './jugada-detalle.component.scss',
})
export class JugadaDetalleComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private service = inject(JugadorApiService);

  cargando = true;
  error    = '';

  jugada:   Jugada | null             = null;
  quiniela: QuinielaDisponible | null = null;
  tipos:    TipoPronosticoJugador[]   = [];

  /**
   * Pronóstico registrado por partido (1 por partido, regla de negocio).
   */
  pronosticoPorPartido: Partial<Record<number, PronosticoJugado>> = {};

  // ── Form activo ───────────────────────────────────────────────────
  partidoSeleccionado:  number | null               = null;
  pronosticoEditando:   PronosticoJugado | null      = null;  // null = modo agregar
  modoForm:             ModoForm                     = 'agregar';
  tipoSeleccionado:     TipoPronosticoJugador | null = null;
  opcionSeleccionada:   number | null                = null;
  guardandoPronostico   = false;
  errorPronostico       = '';

  // ── Eliminar jugada ───────────────────────────────────────────────
  confirmandoEliminar  = false;
  eliminandoJugada     = false;
  errorEliminar        = '';

  // ── Crear nueva jugada para la misma quiniela ─────────────────────
  creandoNuevaJugada = false;
  errorNuevaJugada   = '';

  // ── Ranking de la quiniela (EN_JUEGO + FINALIZADA) ─────────────────────
  ranking: RankingQuiniela | null = null;
  cargandoRanking = false;
  premioActual: PremioJugador | null = null;
  errorComprobantePremioOtros = '';

  /** Toggle del botón "Ver Ranking General" mostrado mientras la quiniela está EN_JUEGO. */
  mostrarRankingGeneral = false;

  /** jugadaId cuya fila del ranking tiene el detalle de pronósticos expandido. */
  filaExpandidaId: number | null = null;

  // ── Ranking: paginación y búsqueda ───────────────────────────────
  paginaActual       = 1;
  readonly FILAS_POR_PAGINA = 10;
  filtroBusqueda     = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.cerrarForm();
      this.cargar(id);
    });
  }

  cargar(id: number): void {
    this.cargando = true;
    this.error    = '';
    this.ranking  = null;

    forkJoin({
      jugada: this.service.obtenerDetalle(id),
      tipos:  this.service.listarTiposConOpciones(),
    }).subscribe({
      next: ({ jugada, tipos }) => {
        this.jugada = jugada;
        this.tipos  = tipos;
        this.indexarPronosticos(jugada.pronosticos ?? []);
        this.service.obtenerQuinielaDetalle(jugada.quinielaId).subscribe({
          next: (q) => {
            this.quiniela = q;
            this.cargando = false;
            if (q.estado !== 'ABIERTA' && (jugada.estado === 'FINALIZADA' || jugada.estado === 'ACTIVA')) {
              this.cargarRanking(jugada.quinielaId);
            }
          },
          error: ()  => { this.cargando = false; },
        });
      },
      error: (err) => {
        this.error    = err.error?.error ?? 'Error al cargar la jugada';
        this.cargando = false;
      },
    });
  }

  private indexarPronosticos(lista: PronosticoJugado[]): void {
    this.pronosticoPorPartido = {};
    for (const p of lista) {
      this.pronosticoPorPartido[p.partidoId] = p;
    }
  }

  private cargarRanking(quinielaId: number): void {
    this.cargandoRanking = true;
    this.service.getRanking(quinielaId).subscribe({
      next: (r) => {
        this.ranking         = r;
        this.cargandoRanking = false;
        this.paginaActual    = 1;
        this.cargarPremioActual();
      },
      error: () => { this.cargandoRanking = false; },
    });
  }

  private cargarPremioActual(): void {
    if (!this.jugada) return;
    this.service.listarMisPremios().subscribe({
      next: (premios) => {
        this.premioActual = premios.find(p => p.jugadaId === this.jugada!.id) ?? null;
      },
      error: () => {
        this.premioActual = null;
      },
    });
  }

  // ── Getters ───────────────────────────────────────────────────────

  get esCreada(): boolean {
    return this.jugada?.estado === 'CREADA';
  }

  get esEnJuego(): boolean {
    return this.jugada?.estado === 'ACTIVA';
  }

  get esFinalizada(): boolean {
    return this.jugada?.estado === 'FINALIZADA';
  }

  /** True if the player can still edit/add a pronostico for this partido.
   *  Allowed while jugada is CREADA or ACTIVA (paid) AND partido hasn't started yet. */
  puedeEditarPronostico(partido: PartidoJugador): boolean {
    return (this.esCreada || this.esEnJuego) && partido.estado === 'PENDIENTE';
  }

  /** Points earned by the player in this jugada (definitive, from backend) */
  get puntosFinales(): number {
    return this.jugada?.puntosObtenidos ?? 0;
  }

  /** Number of pronosticos with at least 1 point (correct) */
  get pronosticosCorrectos(): number {
    return Object.values(this.pronosticoPorPartido)
      .filter(pr => (pr?.puntosObtenidos ?? 0) > 0).length;
  }

  /** Total registered pronosticos for this jugada */
  get totalPronosticos(): number {
    return Object.keys(this.pronosticoPorPartido).length;
  }

  /** Position of this player in the ranking.
   * Primary: match by jugadaId (requires backend restart after adding the field).
   * Fallback: match by puntosObtenidos when jugadaId is not yet returned by backend.
   */
  get miPosicion(): number {
    if (!this.ranking) return -1;
    const porId = this.ranking.ranking.find(
      f => f.jugadaId != null && f.jugadaId === this.jugada?.id
    );
    if (porId) return porId.posicion;
    // fallback: first row matching the player's points
    if (this.jugada?.puntosObtenidos == null) return -1;
    const porPts = this.ranking.ranking.find(
      f => f.puntosObtenidos === this.jugada!.puntosObtenidos
    );
    return porPts?.posicion ?? -1;
  }

  /** Winners list from ranking */
  get ganadoresList(): import('../../models/jugador.models').PosicionRanking[] {
    return this.ranking?.ranking.filter(f => f.esGanador) ?? [];
  }

  /** True if this jugada was declared a winner */
  get esSoyGanador(): boolean {
    return this.ranking?.ranking.some(
      f => f.esGanador && (f.jugadaId != null
        ? f.jugadaId === this.jugada?.id
        : f.puntosObtenidos === this.jugada?.puntosObtenidos)
    ) ?? false;
  }

  /** Ranking rows matching the current search filter */
  get rankingFiltrado(): import('../../models/jugador.models').PosicionRanking[] {
    const q = this.filtroBusqueda.trim().toLowerCase();
    if (!q) return this.ranking?.ranking ?? [];
    return (this.ranking?.ranking ?? []).filter(
      f => f.nombreJugador.toLowerCase().includes(q)
    );
  }

  /** Page slice of the filtered ranking */
  get rankingPaginado(): import('../../models/jugador.models').PosicionRanking[] {
    const start = (this.paginaActual - 1) * this.FILAS_POR_PAGINA;
    return this.rankingFiltrado.slice(start, start + this.FILAS_POR_PAGINA);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.rankingFiltrado.length / this.FILAS_POR_PAGINA));
  }

  /** True if the player's own row is visible in the current page */
  get esMiFilaVisible(): boolean {
    return this.rankingPaginado.some(f => this.esFilaPropia(f));
  }

  esFilaPropia(fila: import('../../models/jugador.models').PosicionRanking): boolean {
    // Primary: exact jugadaId match
    if (fila.jugadaId != null && this.jugada?.id != null) {
      return fila.jugadaId === this.jugada.id;
    }
    // Fallback: puntosObtenidos match (shows "Tú" on the first row with same points)
    return fila.puntosObtenidos != null &&
           fila.puntosObtenidos === this.jugada?.puntosObtenidos;
  }

  irAPagina(n: number): void {
    this.paginaActual = Math.min(Math.max(1, n), this.totalPaginas);
  }

  irAMiPagina(): void {
    if (!this.ranking) return;
    const idx = this.ranking.ranking.findIndex(f => this.esFilaPropia(f));
    if (idx === -1) return;
    this.paginaActual = Math.ceil((idx + 1) / this.FILAS_POR_PAGINA);
  }

  onFiltroChange(event: Event): void {
    this.filtroBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual   = 1;
  }

  verComprobantePremioOtros(): void {
    if (!this.premioActual) return;
    this.errorComprobantePremioOtros = '';
    this.service.getMiComprobantePremioOtros(this.premioActual.ganadorId).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => {
        this.errorComprobantePremioOtros = 'No se pudo cargar el comprobante del premio.';
      },
    });
  }

  /** Muestra u oculta la sección de ranking general (usado en la vista EN_JUEGO). */
  toggleRankingGeneral(): void {
    this.mostrarRankingGeneral = !this.mostrarRankingGeneral;
  }

  /** Expande/colapsa el detalle de pronósticos evaluados de una fila del ranking. */
  toggleDetalleFila(jugadaId: number): void {
    this.filaExpandidaId = this.filaExpandidaId === jugadaId ? null : jugadaId;
  }

  get bannerEnJuegoTitulo(): string {
    const q = this.quiniela?.estado;
    if (q === 'EN_JUEGO')  return 'Quiniela en juego';
    if (q === 'FINALIZADA') return 'Quiniela finalizada';
    return 'Participación confirmada';
  }

  get bannerEnJuegoSubtitulo(): string {
    const q = this.quiniela?.estado;
    if (q === 'EN_JUEGO')  return 'Los partidos se evalúan una vez que el organizador capture los resultados de los mismos. Los puntos se actualizaran y el ranking se ira actualizando.';;
    if (q === 'FINALIZADA') return 'La quiniela ha concluido. Consulta tus puntos y resultados a continuación.';
    return 'Tu pago fue aprobado. Tus pronósticos están registrados y esperando que inicien los partidos.';
  }

  /** Partidos con pronóstico ya evaluado (puntosObtenidos !== null) */
  get progresoEvaluacion(): { evaluados: number; total: number } {
    const partidos = this.quiniela?.partidos ?? [];
    const evaluados = partidos.filter(p => p.estado === 'FINALIZADO').length;
    return { evaluados, total: partidos.length };
  }

  /** Suma de puntos de pronósticos ya evaluados */
  get puntosEvaluados(): number {
    return Object.values(this.pronosticoPorPartido)
      .reduce((sum, pr) => sum + (pr?.puntosObtenidos ?? 0), 0);
  }

  get progreso(): { completados: number; total: number } {
    const total       = this.quiniela?.partidos?.length ?? 0;
    const completados = Object.keys(this.pronosticoPorPartido).length;
    return { completados, total };
  }

  get opcionesDelTipo(): OpcionPronosticoJugador[] {
    return this.tipoSeleccionado?.opciones ?? [];
  }

  // ── Control formulario (agregar o editar) ─────────────────────────

  abrirFormAgregar(partido: PartidoJugador): void {
    if (this.partidoSeleccionado === partido.id && this.modoForm === 'agregar') {
      this.cerrarForm();
      return;
    }
    this.partidoSeleccionado = partido.id;
    this.pronosticoEditando  = null;
    this.modoForm            = 'agregar';
    this.tipoSeleccionado    = null;
    this.opcionSeleccionada  = null;
    this.errorPronostico     = '';
  }

  abrirFormEditar(partido: PartidoJugador, pr: PronosticoJugado): void {
    this.partidoSeleccionado = partido.id;
    this.pronosticoEditando  = pr;
    this.modoForm            = 'editar';
    this.errorPronostico     = '';
    // Pre-seleccionar el tipo y opción actuales
    this.tipoSeleccionado    = this.tipos.find(t => t.id === pr.tipoPronosticoId) ?? null;
    this.opcionSeleccionada  = pr.opcionPronosticoId;
  }

  cerrarForm(): void {
    this.partidoSeleccionado = null;
    this.pronosticoEditando  = null;
    this.modoForm            = 'agregar';
    this.tipoSeleccionado    = null;
    this.opcionSeleccionada  = null;
    this.errorPronostico     = '';
  }

  seleccionarTipo(tipo: TipoPronosticoJugador): void {
    if (this.tipoSeleccionado?.id === tipo.id) return;
    this.tipoSeleccionado   = tipo;
    this.opcionSeleccionada = null;
  }

  guardarPronostico(): void {
    if (!this.jugada || !this.partidoSeleccionado || !this.tipoSeleccionado || !this.opcionSeleccionada) return;
    this.guardandoPronostico = true;
    this.errorPronostico     = '';

    if (this.modoForm === 'editar' && this.pronosticoEditando) {
      // PUT — actualizar pronóstico existente
      this.service.actualizarPronostico(this.jugada.id, this.pronosticoEditando.id, {
        tipoPronosticoId:   this.tipoSeleccionado.id,
        opcionPronosticoId: this.opcionSeleccionada,
      }).subscribe({
        next: (updated) => {
          this.pronosticoPorPartido[updated.partidoId] = updated;
          this.guardandoPronostico = false;
          this.cerrarForm();
        },
        error: (err) => {
          this.errorPronostico     = err.error?.error ?? 'Error al actualizar pronóstico';
          this.guardandoPronostico = false;
        },
      });
    } else {
      // POST — crear pronóstico nuevo
      this.service.registrarPronostico(this.jugada.id, {
        partidoId:          this.partidoSeleccionado,
        tipoPronosticoId:   this.tipoSeleccionado.id,
        opcionPronosticoId: this.opcionSeleccionada,
      }).subscribe({
        next: (saved) => {
          this.pronosticoPorPartido[saved.partidoId] = saved;
          this.jugada!.totalPronosticos = Object.keys(this.pronosticoPorPartido).length;
          this.guardandoPronostico = false;
          this.cerrarForm();
        },
        error: (err) => {
          this.errorPronostico     = err.error?.error ?? 'Error al registrar pronóstico';
          this.guardandoPronostico = false;
        },
      });
    }
  }

  // ── Eliminar jugada ───────────────────────────────────────────────

  pedirConfirmacionEliminar(): void {
    this.confirmandoEliminar = true;
    this.errorEliminar       = '';
  }

  cancelarEliminar(): void {
    this.confirmandoEliminar = false;
  }

  confirmarEliminar(): void {
    if (!this.jugada) return;
    this.eliminandoJugada = true;
    this.errorEliminar    = '';
    this.service.eliminarJugada(this.jugada.id).subscribe({
      next: () => this.router.navigate(['/jugador/mis-jugadas']),
      error: (err) => {
        this.errorEliminar    = err.error?.error ?? 'Error al eliminar la jugada';
        this.eliminandoJugada = false;
        this.confirmandoEliminar = false;
      },
    });
  }

  crearNuevaJugada(): void {
    if (!this.jugada || this.creandoNuevaJugada) return;
    // En tablet/mobile el scroll ocurre en window, no en .main-content (ver jugador-layout)
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.creandoNuevaJugada = true;
    this.errorNuevaJugada   = '';
    this.service.crearJugada({ quinielaId: this.jugada.quinielaId }).subscribe({
      next: (nueva) => {
        this.creandoNuevaJugada = false;
        this.router.navigate(['/jugador/jugadas', nueva.id]);
      },
      error: (err) => {
        this.errorNuevaJugada   = err.error?.error ?? 'Error al crear la jugada';
        this.creandoNuevaJugada = false;
      },
    });
  }

  get puedeCrearNuevaJugada(): boolean {
    return this.quiniela?.estado === 'ABIERTA';
  }

  // ── Helpers ───────────────────────────────────────────────────────

  enlaceWhatsApp(): string {
    if (!this.jugada) return '#';
    return this.service.enlaceWhatsApp(
      this.jugada.id, this.jugada.quinielaNombre, this.quiniela?.costo ?? 0
    );
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

  estadoPartidoClass(estado: string): string {
    if (estado === 'FINALIZADO') return 'p-estado-finalizado';
    if (estado === 'EN_JUEGO')   return 'p-estado-en-juego';
    return 'p-estado-pendiente';
  }

  labelEstadoPartido(estado: string): string {
    if (estado === 'FINALIZADO') return 'Finalizado';
    if (estado === 'EN_JUEGO')   return 'En curso';
    return 'Pendiente';
  }

  iconEstadoPartido(estado: string): string {
    if (estado === 'FINALIZADO') return 'fa-solid fa-circle-check fa-ok';
    if (estado === 'EN_JUEGO')   return 'fa-solid fa-circle-notch';
    return 'fa-regular fa-clock fa-warn';
  }
}


