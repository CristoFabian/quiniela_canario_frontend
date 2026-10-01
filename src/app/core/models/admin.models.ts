export interface QuinielaResumen {
  id: number;
  nombre: string;
  descripcion: string;
  costo: number;
  estado: 'CREADA' | 'ABIERTA' | 'EN_JUEGO' | 'FINALIZADA';
  fechaInicio: string;
  fechaCierre: string;
  creadoPorUsername: string;
  fechaCreacion: string;
  totalPartidos: number;
  bolsaAcumulada: number | null;
}

export interface PartidoResumen {
  id: number;
  quinielaId: number;
  descripcion: string | null;
  equipoLocal: string;
  equipoVisitante: string;
  marcadorLocal: number | null;
  marcadorVisitante: number | null;
  totalCorners: number | null;
  ambosMarcan: boolean | null;
  fechaPartido: string;
  estado: 'PENDIENTE' | 'EN_JUEGO' | 'FINALIZADO' | 'SUSPENDIDO' | 'POSPUESTO';
}

export interface QuinielaDetalle extends QuinielaResumen {
  partidos: PartidoResumen[];
  totalParticipantes: number;
}

export interface CrearQuinielaDto {
  nombre: string;
  descripcion: string;
  costo: number;
  fechaInicio: string;
  fechaCierre: string;
}

export interface ActualizarQuinielaDto {
  nombre: string;
  descripcion: string;
  costo: number;
  fechaInicio: string;
  fechaCierre: string;
}

export interface AgregarPartidoDto {
  descripcion: string;
  equipoLocal: string;
  equipoVisitante: string;
  fechaPartido: string;
}

export interface ActualizarPartidoDto {
  equipoLocal: string;
  equipoVisitante: string;
  descripcion: string;
  fechaPartido: string;
}

export interface ActualizarResultadosDto {
  marcadorLocal: number | null;
  marcadorVisitante: number | null;
  totalCorners: number | null;
  ambosMarcan: boolean | null;
}

export interface DashboardData {
  totalQuinielas: number;
  quinielasCreadas: number;
  quinielasAbiertas: number;
  quinielasEnJuego: number;
  quinielasFinalizadas: number;
  totalJugadores: number;
  jugadoresActivos: number;
  jugadoresInactivos: number;
  totalAdmins: number;
  quinielasActivasDetalle: QuinielaResumen[];
  quinielasEnJuegoDetalle: QuinielaResumen[];
}

export interface UsuarioAdmin {
  id: number;
  username: string;
  email: string;
  role: string;
  activo: boolean;
}

// ── Catálogos ─────────────────────────────────────────────────────

export interface TipoPronostico {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  puntos: number;
  activo: boolean;
  totalOpciones: number;
}

export interface OpcionPronostico {
  id: number;
  tipoPronosticoId: number;
  tipoPronosticoCodigo: string;
  codigo: string;
  descripcion: string;
  valorMin: number | null;
  valorMax: number | null;
  activo: boolean;
}

export interface TipoPronosticoDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  puntos: number;
  activo: boolean;
}

export interface OpcionPronosticoDto {
  codigo: string;
  descripcion: string;
  valorMin: number | null;
  valorMax: number | null;
  activo: boolean;
}

// ── Pagos Admin ───────────────────────────────────────────────────────────────

export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'VENCIDO';

export interface JugadaResumenEnPago {
  id: number;
  quinielaId: number;
  quinielaNombre: string;
  estadoQuiniela: string;
  costoQuiniela: number;
  fechaCierreQuiniela: string;
  totalPronosticos: number;
  estado: string;
}

export interface PagoAdmin {
  id: number;
  usuarioId: number;
  usuarioUsername: string;
  nombreCompleto?: string | null;
  jugadas: JugadaResumenEnPago[];
  monto: number;
  comprobanteUrl: string | null;
  estado: EstadoPago;
  validadoPorUsername: string | null;
  observacion: string | null;
  comprobanteWhatsapp: boolean;
  comprobanteAdmin: boolean;
  pagoOrigenId: number | null;
  fechaCreacion: string;
  fechaValidacion: string | null;
  totalJugadas: number;
  saldoAcreditado: boolean;
  montoSaldoAcreditado: number | null;
  saldoJugador: number;
}

export interface ResumenPagosPorJugador {
  usuarioId: number;
  username: string;
  nombreCompleto?: string | null;
  email: string;
  telefono: string | null;
  foto: string | null;
  cuentaActiva: boolean;
  totalPagosPendientes: number;
  montoPendienteTotal: number;
  todosConComprobante: boolean;
  algunoConWhatsapp: boolean;
  pagoMasAntiguo: string;
  pagos: PagoAdmin[];
}

export interface ValidarPagoRequest {
  estado: 'APROBADO' | 'RECHAZADO';
  observacion?: string;
}

// ── Evaluación de pronósticos ────────────────────────────────────────

export interface ResumenJugadaEvaluada {
  jugadaId: number;
  usuarioId: number;
  username: string;
  puntosEstePartido: number;
  puntosAcumulados: number;
}

export interface EvaluacionPartidoResponse {
  partidoId: number;
  equipoLocal: string;
  equipoVisitante: string;
  pronosticosEvaluados: number;
  jugadasAfectadas: number;
  jugadas: ResumenJugadaEvaluada[];
}

// ── Cierre de quiniela ─────────────────────────────────────────────

export interface GanadorCierre {
  jugadaId: number;
  usuarioId: number;
  nombreCompleto: string;
  email: string | null;
  telefono: string | null;
  puntosObtenidos: number;
  posicion: number;
  criterioAplicado: string | null;
}

export interface CierreQuiniela {
  quinielaId: number;
  nombreQuiniela: string;
  puntajeMaximo: number;
  totalJugadasElegibles: number;
  totalGanadores: number;
  esEmpate: boolean;
  criterioDesempate: string | null;
  cerradoPorUsername: string | null;
  fechaCierre: string;
  ganadores: GanadorCierre[];
}

// ── Ranking de quiniela ────────────────────────────────────────────────────

export interface PosicionRankingAdmin {
  jugadaId: number;
  posicion: number;
  nombreJugador: string;
  puntosObtenidos: number | null;
  esGanador: boolean;
}

export interface RankingQuinielaAdmin {
  quinielaId: number;
  nombreQuiniela: string;
  estadoQuiniela: string;
  totalParticipantes: number;
  criteriosAplicados: string | null;
  ranking: PosicionRankingAdmin[];
}

// ── Ranking de quiniela con detalle de pronósticos (admin) ─────────────────

export interface PronosticoDetalleAdmin {
  id: number;
  partidoId: number;
  equipoLocal: string;
  equipoVisitante: string;
  estadoPartido: string;
  marcadorLocal: number | null;
  marcadorVisitante: number | null;
  totalCorners: number | null;
  ambosMarcan: boolean | null;
  tipoPronosticoCodigo: string;
  tipoPronosticoNombre: string;
  opcionPronosticoCodigo: string;
  opcionPronosticoDescripcion: string;
  puntosObtenidos: number | null;
  evaluado: boolean;
}

export interface PosicionRankingAdminDetalle {
  jugadaId: number;
  posicion: number;
  nombreJugador: string;
  puntosObtenidos: number | null;
  esGanador: boolean;
  pronosticos: PronosticoDetalleAdmin[];
}

export interface RankingQuinielaAdminDetalle {
  quinielaId: number;
  nombreQuiniela: string;
  estadoQuiniela: string;
  totalParticipantes: number;
  criteriosAplicados: string | null;
  ranking: PosicionRankingAdminDetalle[];
}

// ── Premios (entrega del premio monetario a los ganadores) ─────────────────

export type EstadoPremio = 'PENDIENTE' | 'PAGADO' | 'CONFIRMADO';

export interface PremioAdmin {
  ganadorId: number;
  quinielaId: number;
  nombreQuiniela: string;
  jugadaId: number;
  usuarioId: number;
  nombreCompleto: string;
  puntosObtenidos: number;
  montoPremio: number;
  estadoPremio: EstadoPremio;
  tieneComprobante: boolean;
  tieneComprobanteOtros: boolean;
  comprobantePremioOtrosUrl: string | null;
  pagadoPorUsername: string | null;
  fechaPagoPremio: string | null;
  fechaConfirmacionJugador: string | null;
}

