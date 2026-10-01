import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  QuinielaResumen, QuinielaDetalle, PartidoResumen,
  CrearQuinielaDto, ActualizarQuinielaDto, AgregarPartidoDto,
  ActualizarPartidoDto, ActualizarResultadosDto, EvaluacionPartidoResponse,
  CierreQuiniela, RankingQuinielaAdmin, RankingQuinielaAdminDetalle
} from '../../core/models/admin.models';

@Injectable({ providedIn: 'root' })
export class QuinielaService {
  private readonly BASE = 'http://localhost:8080/api/admin';
  private readonly http = inject(HttpClient);

  listar(): Observable<QuinielaResumen[]> {
    return this.http.get<QuinielaResumen[]>(`${this.BASE}/quinielas`);
  }

  detalle(id: number): Observable<QuinielaDetalle> {
    return this.http.get<QuinielaDetalle>(`${this.BASE}/quinielas/${id}`);
  }

  crear(data: CrearQuinielaDto): Observable<QuinielaResumen> {
    return this.http.post<QuinielaResumen>(`${this.BASE}/quinielas`, data);
  }

  actualizar(id: number, data: ActualizarQuinielaDto): Observable<QuinielaResumen> {
    return this.http.put<QuinielaResumen>(`${this.BASE}/quinielas/${id}`, data);
  }

  actualizarEstado(id: number, estado: string): Observable<QuinielaResumen> {
    return this.http.patch<QuinielaResumen>(`${this.BASE}/quinielas/${id}/estado`, { estado });
  }

  agregarPartido(quinielaId: number, data: AgregarPartidoDto): Observable<PartidoResumen> {
    return this.http.post<PartidoResumen>(`${this.BASE}/quinielas/${quinielaId}/partidos`, data);
  }

  actualizarPartido(partidoId: number, data: ActualizarPartidoDto): Observable<PartidoResumen> {
    return this.http.put<PartidoResumen>(`${this.BASE}/partidos/${partidoId}`, data);
  }

  actualizarResultados(partidoId: number, data: ActualizarResultadosDto): Observable<PartidoResumen> {
    return this.http.patch<PartidoResumen>(`${this.BASE}/partidos/${partidoId}/resultados`, data);
  }

  actualizarEstadoPartido(partidoId: number, estado: string): Observable<PartidoResumen> {
    return this.http.patch<PartidoResumen>(`${this.BASE}/partidos/${partidoId}/estado`, { estado });
  }

  /** POST /api/admin/partidos/{id}/evaluar — evalúa pronósticos de un partido FINALIZADO */
  evaluarPartido(partidoId: number): Observable<EvaluacionPartidoResponse> {
    return this.http.post<EvaluacionPartidoResponse>(`${this.BASE}/partidos/${partidoId}/evaluar`, {});
  }

  /** POST /api/admin/quinielas/{id}/cerrar — ejecuta el cierre definitivo */
  cerrar(id: number): Observable<CierreQuiniela> {
    return this.http.post<CierreQuiniela>(`${this.BASE}/quinielas/${id}/cerrar`, {});
  }

  /** GET /api/admin/quinielas/{id}/cierre — recupera cierre ya persistido */
  obtenerCierre(id: number): Observable<CierreQuiniela> {
    return this.http.get<CierreQuiniela>(`${this.BASE}/quinielas/${id}/cierre`);
  }

  /** GET /api/admin/quinielas/{id}/ranking — ranking en tiempo real (EN_JUEGO) o definitivo (FINALIZADA) */
  getRanking(id: number): Observable<RankingQuinielaAdmin> {
    return this.http.get<RankingQuinielaAdmin>(`${this.BASE}/quinielas/${id}/ranking`);
  }

  /** GET /api/admin/quinielas/{id}/ranking-detalle — ranking con todos los pronósticos y el resultado real de cada partido */
  getRankingDetalle(id: number): Observable<RankingQuinielaAdminDetalle> {
    return this.http.get<RankingQuinielaAdminDetalle>(`${this.BASE}/quinielas/${id}/ranking-detalle`);
  }
}
