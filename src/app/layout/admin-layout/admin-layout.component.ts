import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';
import { NotificationBellComponent } from '../../shared/notifications/bell/notification-bell.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  private authService  = inject(AuthService);
  private tokenService = inject(TokenService);
  private router       = inject(Router);

  sidebarOpen = false;

  constructor() {
    // Auto-close the off-canvas menu (tablet/mobile) on navigation
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.closeSidebar());
  }

  get username(): string {
    return this.tokenService.getUsername() ?? 'Admin';
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
