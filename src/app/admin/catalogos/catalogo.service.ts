import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TipoPronostico, OpcionPronostico,
  TipoPronosticoDto, OpcionPronosticoDto
} from '../../core/models/admin.models';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly BASE = 'http://localhost:8080/api/admin/catalogos';
  private readonly http = inject(HttpClient);

  // ── Tipos ─────────────────────────────────────────────────────────

  listarTipos(): Observable<TipoPronostico[]> {
    return this.http.get<TipoPronostico[]>(`${this.BASE}/tipos-pronostico`);
  }

  crearTipo(data: TipoPronosticoDto): Observable<TipoPronostico> {
    return this.http.post<TipoPronostico>(`${this.BASE}/tipos-pronostico`, data);
  }

  actualizarTipo(id: number, data: TipoPronosticoDto): Observable<TipoPronostico> {
    return this.http.put<TipoPronostico>(`${this.BASE}/tipos-pronostico/${id}`, data);
  }

  eliminarTipo(id: number): Observable<TipoPronostico> {
    return this.http.delete<TipoPronostico>(`${this.BASE}/tipos-pronostico/${id}`);
  }

  // ── Opciones ──────────────────────────────────────────────────────

  listarOpciones(tipoId: number): Observable<OpcionPronostico[]> {
    return this.http.get<OpcionPronostico[]>(`${this.BASE}/tipos-pronostico/${tipoId}/opciones`);
  }

  crearOpcion(tipoId: number, data: OpcionPronosticoDto): Observable<OpcionPronostico> {
    return this.http.post<OpcionPronostico>(`${this.BASE}/tipos-pronostico/${tipoId}/opciones`, data);
  }

  actualizarOpcion(id: number, data: OpcionPronosticoDto): Observable<OpcionPronostico> {
    return this.http.put<OpcionPronostico>(`${this.BASE}/opciones-pronostico/${id}`, data);
  }

  eliminarOpcion(id: number): Observable<OpcionPronostico> {
    return this.http.delete<OpcionPronostico>(`${this.BASE}/opciones-pronostico/${id}`);
  }
}
