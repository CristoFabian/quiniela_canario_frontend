import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';
import { JugadorApiService } from '../../jugador/services/jugador-api.service';
import { NotificationBellComponent } from '../../shared/notifications/bell/notification-bell.component';

@Component({
  selector: 'app-jugador-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DecimalPipe, NotificationBellComponent],
  templateUrl: './jugador-layout.component.html',
  styleUrl: './jugador-layout.component.scss'
})
export class JugadorLayoutComponent implements OnInit {
  private authService  = inject(AuthService);
  private tokenService = inject(TokenService);
  private jugadorApi   = inject(JugadorApiService);
  private router       = inject(Router);

  saldoAFavor = 0;
  sidebarOpen = false;
  foto: string | null = null;

  get username(): string {
    return this.tokenService.getUsername() ?? 'Jugador';
  }

  get fotoUrl(): string | null {
    return this.foto ? `http://localhost:8080/perfiles/${this.foto}` : null;
  }

  ngOnInit(): void {
    this.jugadorApi.getPerfil().subscribe({
      next: perfil => {
        this.saldoAFavor = perfil.saldoAFavor ?? 0;
        this.foto = perfil.foto ?? null;
      },
      error: () => {}
    });

    // Auto-close the off-canvas menu (tablet/mobile) on navigation
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.closeSidebar());
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    document.body.classList.toggle('no-scroll', this.sidebarOpen);
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    document.body.classList.remove('no-scroll');
  }

  logout(): void {
    this.authService.logout();
  }
}

