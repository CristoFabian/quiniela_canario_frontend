import { NOTIFICACION_DISPLAY, obtenerRutaNotificacion } from './notification-display.util';

describe('notification-display util', () => {
  it('debe mapear una notificación de pago pendiente a la pantalla de detalle del pago', () => {
    const notificacion = {
      id: 'n-1',
      tipo: 'PAGO_PENDIENTE_VALIDACION',
      titulo: 'Pago pendiente',
      mensaje: 'Pendiente',
      leida: false,
      fechaCreacion: '2026-09-19T10:00:00',
      fechaLectura: null,
      metadata: { pagoId: 42 },
    } as any;

    expect(obtenerRutaNotificacion(notificacion, 'admin')).toBe('/admin/pagos/42');
  });

  it('debe incluir la notificación de regla reactivada y llevar a reglas del juego', () => {
    expect(NOTIFICACION_DISPLAY.REGLA_REACTIVADA).toBeDefined();

    const notificacion = {
      id: 'n-2',
      tipo: 'REGLA_REACTIVADA',
      titulo: 'Regla reactivada',
      mensaje: 'Regla',
      leida: false,
      fechaCreacion: '2026-09-19T10:00:00',
      fechaLectura: null,
      metadata: { reglaId: 9 },
    } as any;

    expect(obtenerRutaNotificacion(notificacion, 'jugador')).toBe('/jugador/reglas');
  });
});
