import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { QuinielaService } from '../../quinielas/quiniela.service';
import { PartidoResumen } from '../../../core/models/admin.models';

@Component({
  selector: 'app-partido-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './partido-form.component.html',
  styleUrl: './partido-form.component.scss',
})
export class PartidoFormComponent {
  @Input() quinielaId!: number;
  @Output() agregado = new EventEmitter<PartidoResumen>();
  @Output() cancelado = new EventEmitter<void>();

  private fb      = inject(FormBuilder);
  private service = inject(QuinielaService);

  guardando = false;
  error     = '';

  form = this.fb.group({
    equipoLocal:     ['', [Validators.required, Validators.maxLength(100)]],
    equipoVisitante: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion:     ['', Validators.maxLength(300)],
    fechaPartido:    ['', Validators.required],
  });

  get f() { return this.form.controls; }

  enviar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    this.guardando = true;
    this.error     = '';
    this.service.agregarPartido(this.quinielaId, {
      equipoLocal:     v.equipoLocal!,
      equipoVisitante: v.equipoVisitante!,
      descripcion:     v.descripcion ?? '',
      fechaPartido:    v.fechaPartido! + ':00',
    }).subscribe({
      next: (p) => { this.guardando = false; this.form.reset(); this.agregado.emit(p); },
      error: (err) => { this.error = err.error?.error ?? 'Error al agregar partido'; this.guardando = false; },
    });
  }
}
