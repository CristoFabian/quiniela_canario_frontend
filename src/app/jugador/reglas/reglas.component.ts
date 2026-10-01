import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReglaJuegoService } from '../../core/services/regla-juego.service';
import { ReglaJuego, CategoriaRegla, CATEGORIAS_REGLA, CATEGORIA_REGLA_LABELS } from '../../core/models/regla.models';

@Component({
  selector: 'app-jugador-reglas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reglas.component.html',
  styleUrl: './reglas.component.scss',
})
export class ReglasComponent implements OnInit {
  private service = inject(ReglaJuegoService);

  cargando = true;
  error    = '';
  reglas: ReglaJuego[] = [];

  categorias = CATEGORIAS_REGLA;
  categoriaLabels = CATEGORIA_REGLA_LABELS;

  ngOnInit(): void {
    this.service.listarActivas().subscribe({
      next: (r) => { this.reglas = r; this.cargando = false; },
      error: (err) => { this.error = err.error?.error ?? 'Error al cargar las reglas del juego'; this.cargando = false; },
    });
  }

  reglasPorCategoria(categoria: CategoriaRegla): ReglaJuego[] {
    return this.reglas
      .filter(r => r.categoria === categoria)
      .sort((a, b) => a.orden - b.orden);
  }
}
