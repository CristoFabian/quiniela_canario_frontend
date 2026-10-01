import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JugadorApiService } from '../services/jugador-api.service';
import { PerfilJugador } from '../models/jugador.models';
import { AuthService } from '../../core/services/auth.service';

/** Validator: the selected date must be at least 18 years in the past */
function edadMinima18(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const nacimiento = new Date(control.value);
  if (isNaN(nacimiento.getTime())) return { fechaInvalida: true };
  const hoy = new Date();
  const limite = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
  return nacimiento <= limite ? null : { menorDeEdad: true };
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  private service = inject(JugadorApiService);
  private fb      = inject(FormBuilder);
  private authService = inject(AuthService);

  @ViewChild('alertaGuardado') alertaGuardado?: ElementRef<HTMLElement>;

  // ── Estado general ────────────────────────────────────────────────
  cargando  = true;
  guardando = false;
  error     = '';
  exito     = '';
  perfil: PerfilJugador | null = null;

  // ── Desactivar cuenta ─────────────────────────────────────────────
  desactivandoCuenta = false;
  errorCuenta = '';

  // ── Foto ──────────────────────────────────────────────────────────
  fotoArchivo: File | null = null;
  fotoPreview: string | null = null;
  subiendoFoto = false;
  eliminandoFoto = false;
  exitoFoto    = '';
  errorFoto    = '';

  // ── Formulario ────────────────────────────────────────────────────
  form = this.fb.group({
    nombre:          ['', [Validators.required, Validators.maxLength(100)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(100)]],
    apellidoMaterno: ['', [Validators.required, Validators.maxLength(100)]],
    ciudad:          ['', [Validators.required, Validators.maxLength(100)]],
    fechaNacimiento: ['', [Validators.required, edadMinima18]],
    telefono:        ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  // ── Helpers ───────────────────────────────────────────────────────
  get completo(): boolean { return this.perfil?.estado === 'COMPLETO'; }
  get f() { return this.form.controls; }

  /** Full URL for the stored photo filename, or null if no photo */
  get fotoUrl(): string | null {
    return this.perfil?.foto ? `http://localhost:8080/perfiles/${this.perfil.foto}` : null;
  }

  /** Max date for the date input = today - 18 years */
  get maxFechaNacimiento(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.service.getPerfil().subscribe({
      next: (p) => {
        this.perfil = p;
        this.form.patchValue({
          nombre:          p.nombre          ?? '',
          apellidoPaterno: p.apellidoPaterno ?? '',
          apellidoMaterno: p.apellidoMaterno ?? '',
          ciudad:          p.ciudad          ?? '',
          fechaNacimiento: p.fechaNacimiento ?? '',
          telefono:        p.telefono        ?? '',
        });
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el perfil. Intenta de nuevo.';
        this.cargando = false;
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.error = '';
    this.exito = '';

    const dto = this.form.value as {
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
      ciudad: string;
      fechaNacimiento: string;
      telefono: string;
    };

    this.service.actualizarPerfil(dto).subscribe({
      next: (p) => {
        this.perfil = p;
        this.guardando = false;
        this.exito = '¡Perfil actualizado correctamente!';
        this.scrollAlertaGuardadoIntoView();
        setTimeout(() => (this.exito = ''), 4000);
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No se pudo guardar el perfil. Intenta de nuevo.';
        this.guardando = false;
        this.scrollAlertaGuardadoIntoView();
      },
    });
  }

  /** Brings the save feedback alert into view — needed because the submit button
   *  is below it and the user may have scrolled past it while filling the form. */
  private scrollAlertaGuardadoIntoView(): void {
    setTimeout(() => this.alertaGuardado?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  // ── Foto ──────────────────────────────────────────────────────────

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    this.errorFoto = '';

    if (!file) return;

    const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!permitidos.includes(file.type)) {
      this.errorFoto = 'Solo se permiten imágenes JPG, PNG o WebP.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorFoto = 'La imagen no debe superar 5 MB.';
      return;
    }

    this.fotoArchivo = file;
    const reader = new FileReader();
    reader.onload = (e) => (this.fotoPreview = e.target?.result as string);
    reader.readAsDataURL(file);
  }

  subirFoto(): void {
    if (!this.fotoArchivo) return;
    this.subiendoFoto = true;
    this.errorFoto    = '';
    this.exitoFoto    = '';

    this.service.actualizarFoto(this.fotoArchivo).subscribe({
      next: (p) => {
        this.perfil       = p;
        this.subiendoFoto = false;
        this.fotoArchivo  = null;
        this.exitoFoto    = '¡Foto actualizada correctamente!';
        setTimeout(() => (this.exitoFoto = ''), 4000);
      },
      error: (err) => {
        this.errorFoto    = err?.error?.message ?? 'No se pudo subir la foto.';
        this.subiendoFoto = false;
      },
    });
  }

  quitarFotoSeleccionada(): void {
    this.fotoArchivo = null;
    this.fotoPreview = null;
    this.errorFoto   = '';
  }

  eliminarFoto(): void {
    if (!this.fotoUrl || this.eliminandoFoto) return;
    if (!confirm('¿Seguro que deseas eliminar tu foto de perfil?')) return;

    this.eliminandoFoto = true;
    this.errorFoto = '';
    this.exitoFoto = '';

    this.service.eliminarFoto().subscribe({
      next: (p) => {
        this.perfil = p;
        this.eliminandoFoto = false;
        this.exitoFoto = 'Foto eliminada correctamente.';
        setTimeout(() => (this.exitoFoto = ''), 4000);
      },
      error: (err) => {
        this.errorFoto = err?.error?.message ?? 'No se pudo eliminar la foto.';
        this.eliminandoFoto = false;
      },
    });
  }

  // ── Desactivar cuenta ─────────────────────────────────────────────

  desactivarCuenta(): void {
    if (this.desactivandoCuenta) return;
    if (!confirm('¿Seguro que deseas desactivar tu cuenta? Se cerrará tu sesión y necesitarás contactar al administrador para reactivarla.')) return;

    this.desactivandoCuenta = true;
    this.errorCuenta = '';

    this.service.desactivarCuenta().subscribe({
      next: () => this.authService.logout(),
      error: (err) => {
        this.errorCuenta = err?.error?.error ?? 'No se pudo desactivar la cuenta.';
        this.desactivandoCuenta = false;
      },
    });
  }
}
