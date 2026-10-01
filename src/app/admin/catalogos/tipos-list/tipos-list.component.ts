import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CatalogoService } from '../catalogo.service';
import { TipoPronostico, OpcionPronostico } from '../../../core/models/admin.models';

@Component({
  selector: 'app-tipos-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tipos-list.component.html',
  styleUrl: './tipos-list.component.scss',
})
export class TiposListComponent implements OnInit {
  private service = inject(CatalogoService);
  private fb      = inject(FormBuilder);

  // ── Estado general ─────────────────────────────────────────────
  cargando = true;
  error    = '';
  tipos: TipoPronostico[] = [];

  // ── Tipo: create/edit ──────────────────────────────────────────
  mostrarFormTipo = false;
  editandoTipo: TipoPronostico | null = null;
  guardandoTipo  = false;
  errorTipo      = '';
  tipoForm!: FormGroup;

  // ── Opciones por tipo (expandido) ──────────────────────────────
  tipoAbierto: number | null = null;
  opcionesPorTipo: Partial<Record<number, OpcionPronostico[]>> = {};
  cargandoOpciones: number | null = null;

  // ── Opción: create/edit ────────────────────────────────────────
  mostrarFormOpcion: number | null = null;   // tipoId activo
  editandoOpcion: OpcionPronostico | null = null;
  guardandoOpcion  = false;
  errorOpcion      = '';
  opcionForm!: FormGroup;

  ngOnInit(): void {
    this.initTipoForm();
    this.initOpcionForm();
    this.cargarTipos();
  }

  // ── Init forms ─────────────────────────────────────────────────

  private initTipoForm(t?: TipoPronostico): void {
    this.tipoForm = this.fb.group({
      codigo:      [t?.codigo      ?? '', [Validators.required, Validators.maxLength(30)]],
      nombre:      [t?.nombre      ?? '', [Validators.required, Validators.maxLength(100)]],
      descripcion: [t?.descripcion ?? '', Validators.maxLength(500)],
      puntos:      [t?.puntos      ?? 1,  [Validators.required, Validators.min(1)]],
      activo:      [t?.activo      ?? true],
    });
  }

  private initOpcionForm(o?: OpcionPronostico): void {
    this.opcionForm = this.fb.group({
      codigo:      [o?.codigo      ?? '', [Validators.required, Validators.maxLength(30)]],
      descripcion: [o?.descripcion ?? '', [Validators.required, Validators.maxLength(200)]],
      valorMin:    [o?.valorMin    ?? null],
      valorMax:    [o?.valorMax    ?? null],
      activo:      [o?.activo      ?? true],
    });
  }

  // ── Tipos ──────────────────────────────────────────────────────

  cargarTipos(): void {
    this.cargando = true;
    this.error    = '';
    this.service.listarTipos().subscribe({
      next: (t) => { this.tipos = t; this.cargando = false; },
      error: (err) => { this.error = err.error?.error ?? 'Error al cargar tipos'; this.cargando = false; },
    });
  }

  abrirCrearTipo(): void {
    this.editandoTipo   = null;
    this.errorTipo      = '';
    this.mostrarFormTipo = true;
    this.initTipoForm();
  }

  abrirEditarTipo(t: TipoPronostico, ev: Event): void {
    ev.stopPropagation();
    this.editandoTipo   = t;
    this.errorTipo      = '';
    this.mostrarFormTipo = true;
    this.initTipoForm(t);
  }

  cancelarTipo(): void {
    this.mostrarFormTipo = false;
    this.editandoTipo    = null;
    this.errorTipo       = '';
  }

  guardarTipo(): void {
    if (this.tipoForm.invalid) { this.tipoForm.markAllAsTouched(); return; }
    this.guardandoTipo = true;
    this.errorTipo     = '';
    const v = this.tipoForm.value;
    const dto = { ...v, codigo: (v.codigo as string).toUpperCase() };

    const req$ = this.editandoTipo
      ? this.service.actualizarTipo(this.editandoTipo.id, dto)
      : this.service.crearTipo(dto);

    req$.subscribe({
      next: (saved) => {
        if (this.editandoTipo) {
          const idx = this.tipos.findIndex(t => t.id === saved.id);
          if (idx !== -1) {
            const prevActivo = this.tipos[idx].activo;
            this.tipos[idx] = saved;
            // Sincronizar caché de opciones si activo cambió
            if (prevActivo !== saved.activo && this.opcionesPorTipo[saved.id]) {
              this.opcionesPorTipo[saved.id] = this.opcionesPorTipo[saved.id]!.map(
                o => ({ ...o, activo: saved.activo })
              );
            }
          }
        } else {
          this.tipos.push(saved);
        }
        this.guardandoTipo   = false;
        this.mostrarFormTipo = false;
        this.editandoTipo    = null;
      },
      error: (err) => {
        this.errorTipo     = err.error?.error ?? 'Error al guardar tipo';
        this.guardandoTipo = false;
      },
    });
  }

  reactivarTipo(t: TipoPronostico, ev: Event): void {
    ev.stopPropagation();
    if (!confirm(`¿Reactivar el tipo "${t.nombre}"? También se reactivarán todas sus opciones.`)) return;
    const dto = { codigo: t.codigo, nombre: t.nombre, descripcion: t.descripcion ?? '', puntos: t.puntos, activo: true };
    this.service.actualizarTipo(t.id, dto).subscribe({
      next: (saved) => {
        const idx = this.tipos.findIndex(x => x.id === saved.id);
        if (idx !== -1) this.tipos[idx] = saved;
        // Reactivar opciones en caché si estaban cargadas
        if (this.opcionesPorTipo[t.id]) {
          this.opcionesPorTipo[t.id] = this.opcionesPorTipo[t.id]!.map(o => ({ ...o, activo: true }));
        }
      },
      error: (err) => { this.error = err.error?.error ?? 'Error al reactivar tipo'; },
    });
  }

  desactivarTipo(t: TipoPronostico, ev: Event): void {
    ev.stopPropagation();
    if (!confirm(`¿Desactivar el tipo "${t.nombre}"? También se desactivarán todas sus opciones.`)) return;
    this.service.eliminarTipo(t.id).subscribe({
      next: (saved) => {
        const idx = this.tipos.findIndex(x => x.id === saved.id);
        if (idx !== -1) this.tipos[idx] = saved;
        // Refrescar opciones si estaban abiertas
        if (this.tipoAbierto === t.id && this.opcionesPorTipo[t.id]) {
          const ops = this.opcionesPorTipo[t.id]!;
          this.opcionesPorTipo[t.id] = ops.map(o => ({ ...o, activo: false }));
        }
      },
      error: (err) => { this.error = err.error?.error ?? 'Error al desactivar tipo'; },
    });
  }

  // ── Acordeón tipos / carga de opciones ────────────────────────

  toggleTipo(id: number): void {
    if (this.tipoAbierto === id) {
      this.tipoAbierto = null;
      return;
    }
    this.tipoAbierto = id;
    this.mostrarFormOpcion = null;
    this.editandoOpcion    = null;
    if (!this.opcionesPorTipo[id]) {
      this.cargarOpciones(id);
    }
  }

  private cargarOpciones(tipoId: number): void {
    this.cargandoOpciones = tipoId;
    this.service.listarOpciones(tipoId).subscribe({
      next: (ops) => {
        this.opcionesPorTipo[tipoId] = ops;
        this.cargandoOpciones = null;
      },
      error: (err) => {
        this.errorOpcion      = err.error?.error ?? 'Error al cargar opciones';
        this.cargandoOpciones = null;
      },
    });
  }

  // ── Opciones ───────────────────────────────────────────────────

  abrirCrearOpcion(tipoId: number): void {
    this.editandoOpcion    = null;
    this.errorOpcion       = '';
    this.mostrarFormOpcion = tipoId;
    this.initOpcionForm();
  }

  abrirEditarOpcion(o: OpcionPronostico): void {
    this.editandoOpcion    = o;
    this.errorOpcion       = '';
    this.mostrarFormOpcion = o.tipoPronosticoId;
    this.initOpcionForm(o);
  }

  cancelarOpcion(): void {
    this.mostrarFormOpcion = null;
    this.editandoOpcion    = null;
    this.errorOpcion       = '';
  }

  guardarOpcion(tipoId: number): void {
    if (this.opcionForm.invalid) { this.opcionForm.markAllAsTouched(); return; }
    this.guardandoOpcion = true;
    this.errorOpcion     = '';
    const v   = this.opcionForm.value;
    const dto = {
      ...v,
      codigo:   (v.codigo as string).toUpperCase(),
      valorMin: v.valorMin !== '' && v.valorMin !== null ? Number(v.valorMin) : null,
      valorMax: v.valorMax !== '' && v.valorMax !== null ? Number(v.valorMax) : null,
    };

    const req$ = this.editandoOpcion
      ? this.service.actualizarOpcion(this.editandoOpcion.id, dto)
      : this.service.crearOpcion(tipoId, dto);

    req$.subscribe({
      next: (saved) => {
        const lista = this.opcionesPorTipo[tipoId] ?? [];
        if (this.editandoOpcion) {
          const idx = lista.findIndex(o => o.id === saved.id);
          if (idx !== -1) lista[idx] = saved; else lista.push(saved);
        } else {
          lista.push(saved);
        }
        this.opcionesPorTipo[tipoId] = lista;
        // Actualizar totalOpciones del tipo
        const tipoIdx = this.tipos.findIndex(t => t.id === tipoId);
        if (tipoIdx !== -1) {
          this.tipos[tipoIdx].totalOpciones = lista.filter(o => o.activo).length;
        }
        this.guardandoOpcion   = false;
        this.mostrarFormOpcion = null;
        this.editandoOpcion    = null;
      },
      error: (err) => {
        this.errorOpcion     = err.error?.error ?? 'Error al guardar opción';
        this.guardandoOpcion = false;
      },
    });
  }

  desactivarOpcion(o: OpcionPronostico, tipoId: number): void {
    if (!confirm(`¿Desactivar la opción "${o.descripcion}"?`)) return;
    this.service.eliminarOpcion(o.id).subscribe({
      next: (saved) => {
        const lista = this.opcionesPorTipo[tipoId] ?? [];
        const idx   = lista.findIndex(x => x.id === saved.id);
        if (idx !== -1) lista[idx] = saved;
        this.opcionesPorTipo[tipoId] = lista;
        const tipoIdx = this.tipos.findIndex(t => t.id === tipoId);
        if (tipoIdx !== -1) {
          this.tipos[tipoIdx].totalOpciones = lista.filter(op => op.activo).length;
        }
      },
      error: (err) => { this.errorOpcion = err.error?.error ?? 'Error al desactivar opción'; },
    });
  }

  reactivarOpcion(o: OpcionPronostico, tipoId: number): void {
    if (!confirm(`¿Reactivar la opción "${o.descripcion}"?`)) return;
    const dto = { codigo: o.codigo, descripcion: o.descripcion, valorMin: o.valorMin ?? null, valorMax: o.valorMax ?? null, activo: true };
    this.service.actualizarOpcion(o.id, dto).subscribe({
      next: (saved) => {
        const lista = this.opcionesPorTipo[tipoId] ?? [];
        const idx   = lista.findIndex(x => x.id === saved.id);
        if (idx !== -1) lista[idx] = saved;
        this.opcionesPorTipo[tipoId] = lista;
        const tipoIdx = this.tipos.findIndex(t => t.id === tipoId);
        if (tipoIdx !== -1) {
          this.tipos[tipoIdx].totalOpciones = lista.filter(op => op.activo).length;
        }
      },
      error: (err) => { this.errorOpcion = err.error?.error ?? 'Error al reactivar opción'; },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────

  get tf() { return this.tipoForm.controls; }
  get of() { return this.opcionForm.controls; }

  rangoLabel(o: OpcionPronostico): string {
    if (o.valorMin == null) return '—';
    if (o.valorMax == null) return `${o.valorMin}+`;
    return `${o.valorMin} – ${o.valorMax}`;
  }
}
