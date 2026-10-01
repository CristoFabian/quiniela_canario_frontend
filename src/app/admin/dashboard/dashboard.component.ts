import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { DashboardData, UsuarioAdmin } from '../../core/models/admin.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  dashboard: DashboardData | null = null;
  usuarios: UsuarioAdmin[] = [];
  cargandoDashboard = true;
  cargandoUsuarios = true;
  errorDashboard = '';
  errorUsuarios = '';
  tabActiva: 'resumen' | 'quinielas' | 'usuarios' = 'resumen';

  // ── Búsqueda y paginación de usuarios ──────────────────────────────
  readonly USUARIOS_POR_PAGINA = 10;
  busquedaUsuarios = '';
  paginaUsuarios = 1;

  ngOnInit(): void {
    this.cargarDashboard();
    this.cargarUsuarios();
  }

  cargarDashboard(): void {
    this.cargandoDashboard = true;
    this.errorDashboard = '';
    this.adminApi.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.cargandoDashboard = false;
      },
      error: (err) => {
        this.errorDashboard = err.error?.error ?? 'Error al cargar el dashboard';
        this.cargandoDashboard = false;
      },
    });
  }

  cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    this.errorUsuarios = '';
    this.adminApi.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.paginaUsuarios = 1;
        this.cargandoUsuarios = false;
      },
      error: (err) => {
        this.errorUsuarios = err.error?.error ?? 'Error al cargar usuarios';
        this.cargandoUsuarios = false;
      },
    });
  }

  /** Usuarios filtrados por nombre de usuario o email */
  get usuariosFiltrados(): UsuarioAdmin[] {
    const q = this.busquedaUsuarios.trim().toLowerCase();
    if (!q) return this.usuarios;
    return this.usuarios.filter(
      (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  /** Página actual (10 en 10) de la lista ya filtrada */
  get usuariosPaginados(): UsuarioAdmin[] {
    const inicio = (this.paginaUsuarios - 1) * this.USUARIOS_POR_PAGINA;
    return this.usuariosFiltrados.slice(inicio, inicio + this.USUARIOS_POR_PAGINA);
  }

  get totalPaginasUsuarios(): number {
    return Math.max(1, Math.ceil(this.usuariosFiltrados.length / this.USUARIOS_POR_PAGINA));
  }

  onBusquedaUsuariosChange(): void {
    this.paginaUsuarios = 1;
  }

  irAPaginaUsuarios(n: number): void {
    this.paginaUsuarios = Math.min(Math.max(1, n), this.totalPaginasUsuarios);
  }

  cambiarRol(usuario: UsuarioAdmin): void {
    const nuevoRol = usuario.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`¿Cambiar el rol de "${usuario.username}" a ${nuevoRol}?`)) return;

    this.adminApi.cambiarRol(usuario.id, nuevoRol).subscribe({
      next: (actualizado) => {
        const idx = this.usuarios.findIndex((u) => u.id === actualizado.id);
        if (idx !== -1) this.usuarios[idx] = actualizado;
      },
      error: (err) => {
        this.errorUsuarios = err.error?.error ?? 'Error al cambiar rol';
      },
    });
  }

  reactivarUsuario(usuario: UsuarioAdmin): void {
    if (!confirm(`¿Reactivar la cuenta de "${usuario.username}"?`)) return;

    this.adminApi.reactivarUsuario(usuario.id).subscribe({
      next: (actualizado) => {
        const idx = this.usuarios.findIndex((u) => u.id === actualizado.id);
        if (idx !== -1) this.usuarios[idx] = actualizado;
      },
      error: (err) => {
        this.errorUsuarios = err.error?.error ?? 'Error al reactivar la cuenta';
      },
    });
  }

  setTab(tab: 'resumen' | 'quinielas' | 'usuarios'): void {
    this.tabActiva = tab;
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      CREADA: 'badge-creada',
      ABIERTA: 'badge-abierta',
      EN_JUEGO: 'badge-en-juego',
      FINALIZADA: 'badge-finalizada',
    };
    return map[estado] ?? '';
  }
}
