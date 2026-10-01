import { Component, inject } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordsMatchValidator() });

  loading = false;
  errorMsg = '';
  showPassword = false;
  registroExitoso = false;

  get username()        { return this.form.get('username')!; }
  get email()            { return this.form.get('email')!; }
  get password()         { return this.form.get('password')!; }
  get confirmPassword()  { return this.form.get('confirmPassword')!; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    const { username, email, password } = this.form.value;
    this.authService.register({ username, email, password }).subscribe({
      next: () => {
        this.loading = false;
        this.registroExitoso = true;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.error ?? 'Error al registrar. Intenta de nuevo.';
      },
    });
  }
}
