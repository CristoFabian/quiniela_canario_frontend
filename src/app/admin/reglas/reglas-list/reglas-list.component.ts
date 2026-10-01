import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReglaJuegoService } from '../../../core/services/regla-juego.service';
import { ReglaJuego, CategoriaRegla, CATEGORIAS_REGLA, CATEGORIA_REGLA_LABELS } from '../../../core/models/regla.models';

@Component({
  selector: 'app-reglas-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reglas-list.component.html',
  styleUrl: './reglas-list.component.scss',
})
export class ReglasListComponent implements OnInit {
  private service = inject(ReglaJuegoService);
  private fb      = inject(FormBuilder);

  cargando = true;
  error    = '';
  reglas: ReglaJuego[] = [];

  categorias = CATEGORIAS_REGLA;
  categoriaLabels = CATEGORIA_REGLA_LABELS;

  mostrarForm = false;
  editando: ReglaJuego | null = null;
  guardando  = false;
  errorForm  = '';
  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.cargarReglas();
  }

  private initForm(r?: ReglaJuego): void {
    this.form = this.fb.group({
      titulo:      [r?.titulo      ?? '', [Validators.required, Validators.maxLength(150)]],
      descripcion: [r?.descripcion ?? '', Validators.required],
      categoria:   [r?.categoria   ?? 'GENERAL', Validators.required],
      orden:       [r?.orden       ?? 0, Validators.required],
      activo:      [r?.activo      ?? true],
    });
  }

  cargarReglas(): void {
    this.cargando = true;
    this.error    = '';
    this.service.listarTodas().subscribe({
      next: (r) => { this.reglas = r; this.cargando = false; },
      error: (err) => { this.error = err.error?.error ?? 'Error al cargar reglas'; this.cargando = false; },
    });
  }

  reglasPorCategoria(categoria: CategoriaRegla): ReglaJuego[] {
    return this.reglas
      .filter(r => r.categoria === categoria)
      .sort((a, b) => a.orden - b.orden);
  }

  abrirCrear(): void {
    this.editando    = null;
    this.errorForm   = '';
    this.mostrarForm = true;
    this.initForm();
  }

  abrirEditar(r: ReglaJuego): void {
    this.editando    = r;
    this.errorForm   = '';
    this.mostrarForm = true;
    this.initForm(r);
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.mostrarForm = false;
    this.editando    = null;
    this.errorForm   = '';
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando  = true;
    this.errorForm  = '';
    const dto = this.form.value;

    const req$ = this.editando
      ? this.service.actualizar(this.editando.id, dto)
      : this.service.crear(dto);

    req$.subscribe({
      next: (saved) => {
        if (this.editando) {
          const idx = this.reglas.findIndex(r => r.id === saved.id);
          if (idx !== -1) this.reglas[idx] = saved;
        } else {
          this.reglas.push(saved);
        }
        this.guardando   = false;
        this.mostrarForm = false;
        this.editando    = null;
      },
      error: (err) => {
        this.errorForm = err.error?.error ?? 'Error al guardar la regla';
        this.guardando = false;
      },
    });
  }

  desactivar(r: ReglaJuego): void {
    if (!confirm(`¿Desactivar la regla "${r.titulo}"? Dejará de mostrarse a los jugadores.`)) return;
    this.service.eliminar(r.id).subscribe({
      next: (saved) => {
        const idx = this.reglas.findIndex(x => x.id === saved.id);
        if (idx !== -1) this.reglas[idx] = saved;
      },
      error: (err) => { this.error = err.error?.error ?? 'Error al desactivar la regla'; },
    });
  }

  reactivar(r: ReglaJuego): void {
    this.service.reactivar(r.id).subscribe({
      next: (saved) => {
        const idx = this.reglas.findIndex(x => x.id === saved.id);
        if (idx !== -1) this.reglas[idx] = saved;
      },
      error: (err) => { this.error = err.error?.error ?? 'Error al reactivar la regla'; },
    });
  }

  eliminarDefinitivo(r: ReglaJuego): void {
    if (!confirm(`¿Eliminar DEFINITIVAMENTE la regla "${r.titulo}"? Esta acción es irreversible.`)) return;
    this.service.eliminarDefinitivo(r.id).subscribe({
      next: () => { this.reglas = this.reglas.filter(x => x.id !== r.id); },
      error: (err) => { this.error = err.error?.error ?? 'Error al eliminar la regla'; },
    });
  }

  get f() { return this.form.controls; }
}
