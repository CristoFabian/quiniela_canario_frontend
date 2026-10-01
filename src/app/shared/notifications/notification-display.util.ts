import { Notificacion, TipoNotificacion } from '../../core/models/notification.models';

/** Ícono (Font Awesome) y clase de color por tipo de notificación, para la campana y el historial. */
export const NOTIFICACION_DISPLAY: Record<TipoNotificacion, { icon: string; colorClass: string }> = {
  PAGO_PENDIENTE_VALIDACION: { icon: 'fa-solid fa-credit-card',    colorClass: 'notif-warn' },
  PREMIO_CONFIRMADO_JUGADOR: { icon: 'fa-solid fa-circle-check',   colorClass: 'notif-ok' },
  QUINIELA_DISPONIBLE:       { icon: 'fa-solid fa-bullseye',       colorClass: 'notif-info' },
  QUINIELA_PROXIMA_CERRAR:   { icon: 'fa-solid fa-clock',          colorClass: 'notif-warn' },
  PAGO_APROBADO:             { icon: 'fa-solid fa-circle-check',   colorClass: 'notif-ok' },
  PAGO_RECHAZADO:            { icon: 'fa-solid fa-circle-xmark',   colorClass: 'notif-danger' },
  JUGADA_GANADORA:           { icon: 'fa-solid fa-trophy',         colorClass: 'notif-gold' },
  PREMIO_PAGADO:             { icon: 'fa-solid fa-sack-dollar',    colorClass: 'notif-ok' },
  REGLA_AGREGADA:            { icon: 'fa-solid fa-scroll',         colorClass: 'notif-info' },
  REGLA_EDITADA:             { icon: 'fa-solid fa-pen',            colorClass: 'notif-warn' },
  REGLA_ELIMINADA:           { icon: 'fa-solid fa-trash',          colorClass: 'notif-danger' },
  REGLA_REACTIVADA:          { icon: 'fa-solid fa-rotate-left',   colorClass: 'notif-info' },
};

export interface GrupoNotificaciones {
  etiqueta: string;
  items: Notificacion[];
}

export function obtenerRutaNotificacion(
  notificacion: Pick<Notificacion, 'tipo' | 'metadata'>,
  rol: 'admin' | 'jugador' = 'jugador',
): string | null {
  const metadata = notificacion.metadata ?? {};
  const valorId = (key: string): string | null => {
    const value = metadata[key];
    if (value === null || value === undefined || value === '') return null;
    return String(value);
  };

  if (rol === 'admin') {
    switch (notificacion.tipo) {
      case 'PAGO_PENDIENTE_VALIDACION': {
        const pagoId = valorId('pagoId');
        return pagoId ? `/admin/pagos/${pagoId}` : '/admin/pagos';
      }
      case 'PREMIO_CONFIRMADO_JUGADOR':
        return '/admin/finanzas';
      default:
        return null;
    }
  }

  switch (notificacion.tipo) {
    case 'QUINIELA_DISPONIBLE':
    case 'QUINIELA_PROXIMA_CERRAR':
      return '/jugador/quinielas';
    case 'PAGO_APROBADO':
    case 'PAGO_RECHAZADO':
      return '/jugador/mis-pagos';
    case 'JUGADA_GANADORA':
    case 'PREMIO_PAGADO':
      return '/jugador/mis-premios';
    case 'REGLA_AGREGADA':
    case 'REGLA_EDITADA':
    case 'REGLA_ELIMINADA':
    case 'REGLA_REACTIVADA':
      return '/jugador/reglas';
    default:
      return null;
  }
}

/** Agrupa notificaciones ya ordenadas (desc por fecha) en cubetas Hoy / Ayer / Esta semana / Anteriores. */
export function agruparPorFecha(notificaciones: Notificacion[]): GrupoNotificaciones[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(inicioSemana.getDate() - 7);

  const grupos: GrupoNotificaciones[] = [
    { etiqueta: 'Hoy', items: [] },
    { etiqueta: 'Ayer', items: [] },
    { etiqueta: 'Esta semana', items: [] },
    { etiqueta: 'Anteriores', items: [] },
  ];

  for (const n of notificaciones) {
    const fecha = new Date(n.fechaCreacion);
    if (fecha >= hoy) {
      grupos[0].items.push(n);
    } else if (fecha >= ayer) {
      grupos[1].items.push(n);
    } else if (fecha >= inicioSemana) {
      grupos[2].items.push(n);
    } else {
      grupos[3].items.push(n);
    }
  }

  return grupos.filter(g => g.items.length > 0);
}
