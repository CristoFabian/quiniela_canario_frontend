import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardData, PagoAdmin, PremioAdmin, ResumenPagosPorJugador, UsuarioAdmin, ValidarPagoRequest } from '../models/admin.models';

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private readonly BASE = 'http://localhost:8080/api/admin';
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.BASE}/dashboard`);
  }

  getUsuarios(): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioAdmin[]>(`${this.BASE}/usuarios`);
  }

  cambiarRol(id: number, role: string): Observable<UsuarioAdmin> {
    return this.http.put<UsuarioAdmin>(`${this.BASE}/usuarios/${id}/rol`, { role });
  }

  reactivarUsuario(id: number): Observable<UsuarioAdmin> {
    return this.http.put<UsuarioAdmin>(`${this.BASE}/usuarios/${id}/activar`, {});
  }

  // ── Pagos Admin ──────────────────────────────────────────────────────────

  listarPagos(estado?: string, usuarioId?: number): Observable<PagoAdmin[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    if (usuarioId != null) params = params.set('usuarioId', usuarioId.toString());
    return this.http.get<PagoAdmin[]>(`${this.BASE}/pagos`, { params });
  }

  resumenPendientesPorJugador(): Observable<ResumenPagosPorJugador[]> {
    return this.http.get<ResumenPagosPorJugador[]>(`${this.BASE}/pagos/por-jugador`);
  }

  obtenerPago(id: number): Observable<PagoAdmin> {
    return this.http.get<PagoAdmin>(`${this.BASE}/pagos/${id}`);
  }

  validarPago(id: number, request: ValidarPagoRequest): Observable<PagoAdmin> {
    return this.http.patch<PagoAdmin>(`${this.BASE}/pagos/${id}/validar`, request);
  }

  getComprobante(id: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/pagos/${id}/comprobante`, { responseType: 'blob' });
  }

  /**
   * PUT /api/admin/pagos/{id}/comprobante
   * Sube o reemplaza el comprobante. Al menos uno de los campos debe estar presente.
   * comprobante         → archivo (opcional)
   * comprobanteWhatsapp → true si el recibo llegó por WhatsApp (opcional, default false)
   */
  subirComprobanteAdmin(
    id: number,
    comprobante: File | null,
    comprobanteWhatsapp: boolean,
  ): Observable<PagoAdmin> {
    const form = new FormData();
    if (comprobante) form.append('comprobante', comprobante);
    form.append('comprobanteWhatsapp', String(comprobanteWhatsapp));
    return this.http.put<PagoAdmin>(`${this.BASE}/pagos/${id}/comprobante`, form);
  }

  pagosPorJugador(usuarioId: number, estado?: string): Observable<PagoAdmin[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<PagoAdmin[]>(`${this.BASE}/jugadores/${usuarioId}/pagos`, { params });
  }

  // ── Premios ────────────────────────────────────────────

  /** GET /api/admin/quinielas/{quinielaId}/premios */
  listarPremiosPorQuiniela(quinielaId: number): Observable<PremioAdmin[]> {
    return this.http.get<PremioAdmin[]>(`${this.BASE}/quinielas/${quinielaId}/premios`);
  }

  /** GET /api/admin/premios/{ganadorId} */
  obtenerPremio(ganadorId: number): Observable<PremioAdmin> {
    return this.http.get<PremioAdmin>(`${this.BASE}/premios/${ganadorId}`);
  }

  /** PUT /api/admin/premios/{ganadorId}/comprobante — sube el comprobante y pasa el premio a PAGADO */
  subirComprobantePremio(ganadorId: number, comprobante: File): Observable<PremioAdmin> {
    const form = new FormData();
    form.append('comprobante', comprobante);
    return this.http.put<PremioAdmin>(`${this.BASE}/premios/${ganadorId}/comprobante`, form);
  }

  /** GET /api/admin/premios/{ganadorId}/comprobante */
  getComprobantePremio(ganadorId: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/premios/${ganadorId}/comprobante`, { responseType: 'blob' });
  }

  /** PUT /api/admin/premios/{ganadorId}/comprobante-otros */
  subirComprobantePremioOtros(ganadorId: number, comprobante: File): Observable<PremioAdmin> {
    const form = new FormData();
    form.append('comprobante', comprobante);
    return this.http.put<PremioAdmin>(`${this.BASE}/premios/${ganadorId}/comprobante-otros`, form);
  }

  /** GET /api/admin/premios/{ganadorId}/comprobante-otros */
  getComprobantePremioOtros(ganadorId: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/premios/${ganadorId}/comprobante-otros`, { responseType: 'blob' });
  }
}
