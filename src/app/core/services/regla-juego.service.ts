import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReglaJuego, ReglaJuegoDto, CategoriaRegla } from '../models/regla.models';

@Injectable({ providedIn: 'root' })
export class ReglaJuegoService {
  private readonly BASE = 'http://localhost:8080/api/reglas';
  private readonly http = inject(HttpClient);

  // ── Consulta (jugador o admin, solo reglas activas) ────────────────

  listarActivas(): Observable<ReglaJuego[]> {
    return this.http.get<ReglaJuego[]>(this.BASE);
  }

  listarActivasPorCategoria(categoria: CategoriaRegla): Observable<ReglaJuego[]> {
    return this.http.get<ReglaJuego[]>(`${this.BASE}/categoria/${categoria}`);
  }

  // ── Administración (solo ADMIN) ─────────────────────────────────────

  listarTodas(): Observable<ReglaJuego[]> {
    return this.http.get<ReglaJuego[]>(`${this.BASE}/admin`);
  }

  obtener(id: number): Observable<ReglaJuego> {
    return this.http.get<ReglaJuego>(`${this.BASE}/admin/${id}`);
  }

  crear(data: ReglaJuegoDto): Observable<ReglaJuego> {
    return this.http.post<ReglaJuego>(`${this.BASE}/admin`, data);
  }

  actualizar(id: number, data: ReglaJuegoDto): Observable<ReglaJuego> {
    return this.http.put<ReglaJuego>(`${this.BASE}/admin/${id}`, data);
  }

  eliminar(id: number): Observable<ReglaJuego> {
    return this.http.delete<ReglaJuego>(`${this.BASE}/admin/${id}`);
  }

  eliminarDefinitivo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/admin/${id}/definitivo`);
  }

  reactivar(id: number): Observable<ReglaJuego> {
    return this.http.patch<ReglaJuego>(`${this.BASE}/admin/${id}/reactivar`, {});
  }
}
