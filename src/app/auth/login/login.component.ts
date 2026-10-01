import { Component, inject } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';
import { WHATSAPP_NUMERO } from '../../jugador/services/jugador-api.service';

function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const nuevaPassword = group.get('nuevaPassword')?.value;
    const confirmarPassword = group.get('confirmarPassword')?.value;
    return nuevaPassword && confirmarPassword && nuevaPassword !== confirmarPassword
      ? { passwordMismatch: true }
      : null;
  };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;
  errorMsg = '';
  cuentaInactiva = false;
  credencialesIncorrectas = false;
  showPassword = false;

  readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Hola, mi cuenta de La Quiniela del Canario fue desactivada y necesito reactivarla.')}`;

  // ── Recuperar contraseña ───────────────────────────────────────────
  mostrarReset = false;
  resetLoading = false;
  resetError = '';
  resetExito = '';

  resetForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    nuevaPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', [Validators.required]],
  }, { validators: passwordsMatchValidator() });

  get username() { return this.form.get('username')!; }
  get password() { return this.form.get('password')!; }

  get rUsername()          { return this.resetForm.get('username')!; }
  get rTelefono()          { return this.resetForm.get('telefono')!; }
  get rNuevaPassword()     { return this.resetForm.get('nuevaPassword')!; }
  get rConfirmarPassword() { return this.resetForm.get('confirmarPassword')!; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.cuentaInactiva = false;
    this.credencialesIncorrectas = false;
    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        const role = this.tokenService.getRole();
        if (role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/jugador']);
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 423) {
          this.cuentaInactiva = true;
          this.errorMsg = '';
        } else {
          this.errorMsg = err.error?.error ?? 'Credenciales incorrectas. Intenta de nuevo.';
          this.credencialesIncorrectas = true;
        }
      },
    });
  }

  // ── Recuperar contraseña ───────────────────────────────────────────

  abrirReset(): void {
    this.mostrarReset = true;
    this.resetError = '';
    this.resetExito = '';
    this.resetForm.reset();
    this.resetForm.patchValue({ username: this.username.value ?? '' });
  }

  cerrarReset(): void {
    this.mostrarReset = false;
  }

  enviarReset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.resetLoading = true;
    this.resetError = '';
    this.resetExito = '';

    const { username, telefono, nuevaPassword, confirmarPassword } = this.resetForm.value;
    this.authService.resetPassword({ username, telefono, nuevaPassword, confirmarPassword }).subscribe({
      next: () => {
        this.resetLoading = false;
        this.resetExito = '¡Contraseña actualizada! Ya puedes iniciar sesión con tu nueva contraseña.';
        setTimeout(() => this.cerrarReset(), 2500);
      },
      error: (err) => {
        this.resetLoading = false;
        this.resetError = err.error?.error ?? 'No se pudo restablecer la contraseña.';
      },
    });
  }
}
