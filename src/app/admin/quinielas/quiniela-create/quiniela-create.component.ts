import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { QuinielaService } from '../quiniela.service';

@Component({
  selector: 'app-quiniela-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './quiniela-create.component.html',
  styleUrl: './quiniela-create.component.scss',
})
export class QuinielaCreateComponent {
  private fb      = inject(FormBuilder);
  private service  = inject(QuinielaService);
  private router   = inject(Router);

  cargando = false;
  error    = '';

  form = this.fb.group({
    nombre:      ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', Validators.maxLength(500)],
    costo:       [null as number | null, [Validators.required, Validators.min(0.01)]],
    fechaInicio: ['', Validators.required],
    fechaCierre: ['', Validators.required],
  });

  get f() { return this.form.controls; }

  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.cargando = true;
    this.error    = '';
    const v = this.form.value;
    this.service.crear({
      nombre:      v.nombre!,
      descripcion: v.descripcion ?? '',
      costo:       v.costo!,
      fechaInicio: v.fechaInicio! + ':00',
      fechaCierre: v.fechaCierre! + ':00',
    }).subscribe({
      next:  (q)   => this.router.navigate(['/admin/quinielas', q.id]),
      error: (err) => {
        this.error    = err.error?.error ?? 'Error al crear la quiniela';
        this.cargando = false;
      },
    });
  }
}
