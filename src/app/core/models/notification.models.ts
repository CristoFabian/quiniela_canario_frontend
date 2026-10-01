/** Debe coincidir 1:1 con el enum TipoNotificacion del backend. */
export type TipoNotificacion =
  | 'PAGO_PENDIENTE_VALIDACION'
  | 'PREMIO_CONFIRMADO_JUGADOR'
  | 'QUINIELA_DISPONIBLE'
  | 'QUINIELA_PROXIMA_CERRAR'
  | 'PAGO_APROBADO'
  | 'PAGO_RECHAZADO'
  | 'JUGADA_GANADORA'
  | 'PREMIO_PAGADO'
  | 'REGLA_AGREGADA'
  | 'REGLA_EDITADA'
  | 'REGLA_ELIMINADA'
  | 'REGLA_REACTIVADA';

export interface Notificacion {
  /** publicId (UUID) — nunca el id secuencial interno. */
  id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leida: boolean;
  fechaCreacion: string;
  fechaLectura: string | null;
  metadata: Record<string, unknown> | null;
}

export interface NotificacionPage {
  contenido: Notificacion[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface NotificacionCount {
  noLeidas: number;
}
