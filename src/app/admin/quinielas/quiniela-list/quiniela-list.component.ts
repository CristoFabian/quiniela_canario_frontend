import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QuinielaService } from '../quiniela.service';
import { QuinielaResumen } from '../../../core/models/admin.models';

@Component({
  selector: 'app-quiniela-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './quiniela-list.component.html',
  styleUrl: './quiniela-list.component.scss',
})
export class QuinielaListComponent implements OnInit {
  private quinielaService = inject(QuinielaService);

  quinielas: QuinielaResumen[] = [];
  cargando = true;
  error = '';

  // ── Filtros ────────────────────────────────────────────────
  filtroNombre = '';
  filtroEstado = '';

  // ── Paginación ─────────────────────────────
  readonly QUINIELAS_POR_PAGINA = 10;
  paginaActual = 1;

  readonly ESTADOS = ['CREADA', 'ABIERTA', 'EN_JUEGO', 'FINALIZADA'];

  get quinielasFiltradas(): QuinielaResumen[] {
    const nombre = this.filtroNombre.trim().toLowerCase();
    return this.quinielas.filter(q => {
      const matchNombre = !nombre || q.nombre.toLowerCase().includes(nombre);
      const matchEstado = !this.filtroEstado || q.estado === this.filtroEstado;
      return matchNombre && matchEstado;
    });
  }

  /** Página actual (10 en 10) de la lista ya filtrada */
  get quinielasPaginadas(): QuinielaResumen[] {
    const inicio = (this.paginaActual - 1) * this.QUINIELAS_POR_PAGINA;
    return this.quinielasFiltradas.slice(inicio, inicio + this.QUINIELAS_POR_PAGINA);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.quinielasFiltradas.length / this.QUINIELAS_POR_PAGINA));
  }

  onFiltroChange(): void {
    this.paginaActual = 1;
  }

  irAPagina(n: number): void {
    this.paginaActual = Math.min(Math.max(1, n), this.totalPaginas);
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.quinielaService.listar().subscribe({
      next: (data) => { this.quinielas = data; this.paginaActual = 1; this.cargando = false; },
      error: (err) => { this.error = err.error?.error ?? 'Error al cargar quinielas'; this.cargando = false; },
    });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      CREADA: 'badge-creada', ABIERTA: 'badge-abierta',
      EN_JUEGO: 'badge-en-juego', FINALIZADA: 'badge-finalizada',
    };
    return map[estado] ?? '';
  }
}
