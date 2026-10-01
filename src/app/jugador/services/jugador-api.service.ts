import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  QuinielaDisponible, PartidoJugador, Jugada, CrearJugadaDto,
  PronosticoJugado, CrearPronosticoDto, ActualizarPronosticoDto,
  TipoPronosticoJugador, Pago, PerfilJugador, UpdatePerfilDto, CierrePublico, RankingQuiniela,
  PremioJugador
} from '../models/jugador.models';

// Número de WhatsApp para confirmación de pago.
// Formato internacional sin '+': 521XXXXXXXXXX
export const WHATSAPP_NUMERO = '5214381624401';

@Injectable({ providedIn: 'root' })
export class JugadorApiService {
  private readonly BASE = 'http://localhost:8080/api/jugador';
  private readonly http = inject(HttpClient);

  // ── Quinielas disponibles ─────────────────────────────────────────

  /** GET /api/jugador/quinielas → QuinielaDisponible[] (quinielas ABIERTA) */
  listarQuinielasDisponibles(): Observable<QuinielaDisponible[]> {
    return this.http.get<QuinielaDisponible[]>(`${this.BASE}/quinielas`);
  }

  /** GET /api/jugador/quinielas/{id} → detalle con partidos embebidos */
  obtenerQuinielaDetalle(id: number): Observable<QuinielaDisponible> {
    return this.http.get<QuinielaDisponible>(`${this.BASE}/quinielas/${id}`);
  }

  /** GET /api/jugador/quinielas/{id}/partidos → solo los 8 partidos */
  listarPartidosDeQuiniela(id: number): Observable<PartidoJugador[]> {
    return this.http.get<PartidoJugador[]>(`${this.BASE}/quinielas/${id}/partidos`);
  }

  // ── Catálogo ───────────────────────────────────────────────────────

  /**
   * GET /api/jugador/catalogos/tipos-pronostico
   * Retorna tipos activos con sus opciones activas embebidas.
   * Un solo call — no se necesita llamar opciones por separado.
   */
  listarTiposConOpciones(): Observable<TipoPronosticoJugador[]> {
    return this.http.get<TipoPronosticoJugador[]>(`${this.BASE}/catalogos/tipos-pronostico`);
  }

  /** GET /api/jugador/quinielas/{id}/cierre → resultado definitivo de una quiniela FINALIZADA */
  getQuinielaCierre(quinielaId: number): Observable<CierrePublico> {
    return this.http.get<CierrePublico>(`${this.BASE}/quinielas/${quinielaId}/cierre`);
  }

  /** GET /api/jugador/quinielas/{id}/ranking → ranking en tiempo real (EN_JUEGO) o definitivo (FINALIZADA) */
  getRanking(quinielaId: number): Observable<RankingQuiniela> {
    return this.http.get<RankingQuiniela>(`${this.BASE}/quinielas/${quinielaId}/ranking`);
  }

  // ── Jugadas (tickets) ─────────────────────────────────────────────

  /** POST /api/jugador/jugadas → crea un ticket para una quiniela ABIERTA */
  crearJugada(dto: CrearJugadaDto): Observable<Jugada> {
    return this.http.post<Jugada>(`${this.BASE}/jugadas`, dto);
  }

  /** GET /api/jugador/jugadas → lista mis jugadas (cabecera, sin pronosticos) */
  listarMisJugadas(): Observable<Jugada[]> {
    return this.http.get<Jugada[]>(`${this.BASE}/jugadas`);
  }

  /** GET /api/jugador/jugadas/{id} → detalle con pronosticos embebidos */
  obtenerDetalle(id: number): Observable<Jugada> {
    return this.http.get<Jugada>(`${this.BASE}/jugadas/${id}`);
  }

  // ── Pronósticos ───────────────────────────────────────────────────

  /**
   * POST /api/jugador/jugadas/{jugadaId}/pronosticos
   * Registra UN pronóstico (tipo + opción) para un partido.
   * Regla: exactamente 1 pronóstico por partido por jugada.
   */
  registrarPronostico(jugadaId: number, dto: CrearPronosticoDto): Observable<PronosticoJugado> {
    return this.http.post<PronosticoJugado>(`${this.BASE}/jugadas/${jugadaId}/pronosticos`, dto);
  }

  /**
   * PUT /api/jugador/jugadas/{jugadaId}/pronosticos/{pronosticoId}
   * Actualiza el tipo y la opción de un pronóstico existente.
   * Solo permitido cuando la jugada tiene estado CREADA.
   */
  actualizarPronostico(jugadaId: number, pronosticoId: number, dto: ActualizarPronosticoDto): Observable<PronosticoJugado> {
    return this.http.put<PronosticoJugado>(
      `${this.BASE}/jugadas/${jugadaId}/pronosticos/${pronosticoId}`, dto
    );
  }

  /** GET /api/jugador/jugadas/{jugadaId}/pronosticos */
  listarPronosticos(jugadaId: number): Observable<PronosticoJugado[]> {
    return this.http.get<PronosticoJugado[]>(`${this.BASE}/jugadas/${jugadaId}/pronosticos`);
  }

  /**
   * DELETE /api/jugador/jugadas/{id}
   * Elimina la jugada y todos sus pronósticos.
   * Solo permitido cuando la jugada tiene estado CREADA.
   */
  eliminarJugada(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/jugadas/${id}`);
  }

  // ── Pagos ─────────────────────────────────────────────────────────

  /**
   * POST /api/jugador/pagos
   * multipart/form-data: jugadaIds[], monto, comprobante? (opcional), comprobanteWhatsapp? (opcional),
   * usarSaldoAFavor? (opcional)
   * El backend exige comprobante, comprobanteWhatsapp=true o usarSaldoAFavor=true.
   */
  crearPago(
    jugadaIds: number[],
    monto: number,
    comprobante?: File,
    comprobanteWhatsapp?: boolean,
    usarSaldoAFavor?: boolean,
  ): Observable<Pago> {
    const form = new FormData();
    jugadaIds.forEach(id => form.append('jugadaIds', String(id)));
    form.append('monto', String(monto));
    if (comprobante) {
      form.append('comprobante', comprobante);
    }
    if (comprobanteWhatsapp) {
      form.append('comprobanteWhatsapp', 'true');
    }
    if (usarSaldoAFavor) {
      form.append('usarSaldoAFavor', 'true');
    }
    return this.http.post<Pago>(`${this.BASE}/pagos`, form);
  }

  /** GET /api/jugador/pagos → lista todos mis pagos */
  listarMisPagos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.BASE}/pagos`);
  }

  /** GET /api/jugador/pagos/{id} → detalle de un pago */
  obtenerMiPago(id: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.BASE}/pagos/${id}`);
  }

  /**
   * PUT /api/jugador/pagos/{id}/comprobante
   * Sube o reemplaza el comprobante de un pago PENDIENTE.
   */
  subirComprobante(id: number, comprobante: File): Observable<Pago> {
    const form = new FormData();
    form.append('comprobante', comprobante);
    return this.http.put<Pago>(`${this.BASE}/pagos/${id}/comprobante`, form);
  }

  /**
   * POST /api/jugador/pagos/{id}/reintentar
   * Crea un NUEVO pago a partir de un pago RECHAZADO.
   * El registro rechazado se conserva en el historial (pagoOrigenId).
   * multipart/form-data: monto (requerido), comprobante (opcional)
   */
  reintentarPago(id: number, monto: number, comprobante?: File): Observable<Pago> {
    const form = new FormData();
    form.append('monto', String(monto));
    if (comprobante) {
      form.append('comprobante', comprobante);
    }
    return this.http.post<Pago>(`${this.BASE}/pagos/${id}/reintentar`, form);
  }

  // ── WhatsApp ──────────────────────────────────────────────────────

  enlaceWhatsApp(jugadaId: number, quinielaNombre: string, costo: number): string {
    const msg = encodeURIComponent(
      `¡Hola! Quiero confirmar mi pago para la Jugada #${jugadaId} ` +
      `de la quiniela "${quinielaNombre}". Costo: $${costo} MXN.`
    );
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`;
  }

  /** Mensaje con el pago real: incluye su id, las jugadas ligadas a él y el monto pagado. */
  enlaceWhatsAppPago(pago: Pago): string {
    const ids = pago.jugadas.map(j => `#${j.id}`).join(', ');
    const msg = encodeURIComponent(
      `¡Hola! Quiero confirmar mi pago #${pago.id} de las jugadas ${ids} ` +
      `por un monto de $${pago.monto} MXN.`
    );
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`;
  }

  // ── Perfil ──────────────────────────────────────────────────────

  /** GET /api/jugador/perfil */
  getPerfil(): Observable<PerfilJugador> {
    return this.http.get<PerfilJugador>(`${this.BASE}/perfil`);
  }

  /** PUT /api/jugador/perfil */
  actualizarPerfil(dto: UpdatePerfilDto): Observable<PerfilJugador> {
    return this.http.put<PerfilJugador>(`${this.BASE}/perfil`, dto);
  }

  /** PUT /api/jugador/perfil/foto */
  actualizarFoto(foto: File): Observable<PerfilJugador> {
    const form = new FormData();
    form.append('foto', foto);
    return this.http.put<PerfilJugador>(`${this.BASE}/perfil/foto`, form);
  }

  /** DELETE /api/jugador/perfil/foto */
  eliminarFoto(): Observable<PerfilJugador> {
    return this.http.delete<PerfilJugador>(`${this.BASE}/perfil/foto`);
  }

  /** PUT /api/jugador/cuenta/desactivar — baja lógica de la cuenta (autoservicio) */
  desactivarCuenta(): Observable<void> {
    return this.http.put<void>(`${this.BASE}/cuenta/desactivar`, {});
  }

  // ── Premios ────────────────────────────────────────────

  /** GET /api/jugador/premios → todos mis premios (de todas las quinielas ganadas) */
  listarMisPremios(): Observable<PremioJugador[]> {
    return this.http.get<PremioJugador[]>(`${this.BASE}/premios`);
  }

  /** GET /api/jugador/premios/{ganadorId} */
  obtenerMiPremio(ganadorId: number): Observable<PremioJugador> {
    return this.http.get<PremioJugador>(`${this.BASE}/premios/${ganadorId}`);
  }

  /** GET /api/jugador/premios/{ganadorId}/comprobante */
  getMiComprobantePremio(ganadorId: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/premios/${ganadorId}/comprobante`, { responseType: 'blob' });
  }

  /** GET /api/jugador/premios/{ganadorId}/comprobante-otros */
  getMiComprobantePremioOtros(ganadorId: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/premios/${ganadorId}/comprobante-otros`, { responseType: 'blob' });
  }

  /** PATCH /api/jugador/premios/{ganadorId}/confirmar — solo disponible cuando el premio está PAGADO */
  confirmarRecepcionPremio(ganadorId: number): Observable<PremioJugador> {
    return this.http.patch<PremioJugador>(`${this.BASE}/premios/${ganadorId}/confirmar`, {});
  }
}

