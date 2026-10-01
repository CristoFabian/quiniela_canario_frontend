// ── Quinielas disponibles ─────────────────────────────────────────

export interface QuinielaDisponible {
  id: number;
  nombre: string;
  descripcion: string;
  costo: number;
  estado: string;
  fechaInicio: string;
  fechaCierre: string;
  totalPartidos: number;
  creadoPorUsername: string;
  fechaCreacion: string;
  bolsaAcumulada: number | null;
  partidos?: PartidoJugador[];
}

export interface PartidoJugador {
  id: number;
  quinielaId: number;
  equipoLocal: string;
  equipoVisitante: string;
  descripcion: string | null;
  marcadorLocal: number | null;
  marcadorVisitante: number | null;
  totalCorners: number | null;
  ambosMarcan: boolean | null;
  fechaPartido: string;
  estado: string;
}

// ── Jugadas (tickets) ─────────────────────────────────────────────

export type EstadoJugada =
  | 'CREADA'               // recién creada, puede editarse y eliminarse
  | 'PENDIENTE_VALIDACION' // pago enviado, esperando confirmación admin
  | 'ACTIVA'               // pago confirmado, participando
  | 'RECHAZADA'            // pago no confirmado
  | 'EXPIRADA'             // quiniela cerró sin confirmar pago
  | 'FINALIZADA';          // quiniela finalizada y evaluada

export interface ActualizarPronosticoDto {
  tipoPronosticoId: number;
  opcionPronosticoId: number;
}

export interface Jugada {
  id: number;
  quinielaId: number;
  quinielaNombre: string;
  costoQuiniela: number;
  puntosObtenidos: number | null;
  estado: EstadoJugada;
  createdAt: string;
  totalPronosticos: number;
  posicionFinal: number | null;
  esGanadora: boolean;
  pronosticos?: PronosticoJugado[];
}

export interface CrearJugadaDto {
  quinielaId: number;
}

// ── Pronósticos ───────────────────────────────────────────────────

export interface PronosticoJugado {
  id: number;
  jugadaId: number;
  partidoId: number;
  equipoLocal: string;
  equipoVisitante: string;
  tipoPronosticoId: number;
  tipoPronosticoCodigo: string;
  tipoPronosticoNombre: string;
  opcionPronosticoId: number;
  opcionPronosticoCodigo: string;
  opcionPronosticoDescripcion: string;
  puntosObtenidos: number | null;
}

export interface CrearPronosticoDto {
  partidoId: number;
  tipoPronosticoId: number;
  opcionPronosticoId: number;
}

// ── Catálogo jugador — tipos con opciones embebidas ───────────────
// GET /api/jugador/catalogos/tipos-pronostico

export interface TipoPronosticoJugador {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  puntos: number;
  opciones: OpcionPronosticoJugador[];
}

export interface OpcionPronosticoJugador {
  id: number;
  tipoPronosticoId: number;
  tipoPronosticoCodigo: string;
  codigo: string;
  descripcion: string;
  valorMin: number | null;
  valorMax: number | null;
  activo: boolean;
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface JugadaResumenEnPago {
  id: number;
  quinielaId: number;
  quinielaNombre: string;
  estadoQuiniela: string;
  estado: string;
}

export interface Pago {
  id: number;
  usuarioId: number;
  usuarioUsername: string;
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
}

// ── Perfil del jugador ──────────────────────────────────────────

export type EstadoPerfil = 'COMPLETO' | 'INCOMPLETO';

export interface PerfilJugador {
  id: number;
  username: string;
  email: string;
  role: string;
  activo: boolean;
  nombre: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  ciudad: string | null;
  fechaNacimiento: string | null;
  telefono: string | null;
  foto: string | null;
  estado: EstadoPerfil;
  saldoAFavor: number;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface UpdatePerfilDto {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  ciudad: string;
  fechaNacimiento: string;
  telefono: string;
}

// ── Cierre de quiniela (resultado definitivo, visible al jugador) ──────────

export interface GanadorPublico {
  jugadaId: number;
  nombreCompleto: string;
  puntosObtenidos: number;
  posicion: number;
  criterioAplicado: string | null;
}

export interface CierrePublico {
  quinielaId: number;
  nombreQuiniela: string;
  puntajeMaximo: number;
  totalJugadasElegibles: number;
  totalGanadores: number;
  esEmpate: boolean;
  criterioDesempate: string | null;
  fechaCierre: string;
  ganadores: GanadorPublico[];
}

// ── Premios (entrega del premio monetario al ganador) ──────────────────────

export type EstadoPremio = 'PENDIENTE' | 'PAGADO' | 'CONFIRMADO';

export interface PremioJugador {
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

// ── Ranking de quiniela ────────────────────────────────────────────────────

export interface PosicionRanking {
  jugadaId: number;
  posicion: number;
  nombreJugador: string;
  puntosObtenidos: number | null;
  esGanador: boolean;
  /** Pronósticos ya evaluados de esta jugada — transparencia del puntaje frente a los demás. */
  pronosticos: PronosticoJugado[] | null;
}

export interface RankingQuiniela {
  quinielaId: number;
  nombreQuiniela: string;
  estadoQuiniela: string;
  totalParticipantes: number;
  criteriosAplicados: string | null;
  ranking: PosicionRanking[];
}

