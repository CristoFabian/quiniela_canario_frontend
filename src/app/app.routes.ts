import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { JugadorLayoutComponent } from './layout/jugador-layout/jugador-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { jugadorGuard } from './core/guards/jugador.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full', title: 'Inicio' },
  { path: 'login', component: LoginComponent, canActivate: [publicGuard], title: 'Iniciar Sesión' },
  { path: 'register', component: RegisterComponent, canActivate: [publicGuard], title: 'Crear Cuenta' },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
  },
  {
    path: 'jugador',
    component: JugadorLayoutComponent,
    canActivate: [authGuard, jugadorGuard],
    loadChildren: () => import('./jugador/jugador.module').then(m => m.JugadorModule),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
