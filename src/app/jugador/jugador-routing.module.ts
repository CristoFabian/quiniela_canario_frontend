import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent }    from './dashboard/dashboard.component';
import { QuinielaListComponent } from './quinielas/quiniela-list/quiniela-list.component';
import { MisJugadasComponent }   from './jugadas/mis-jugadas/mis-jugadas.component';
import { JugadaDetalleComponent } from './jugadas/jugada-detalle/jugada-detalle.component';
import { PagoRegistroComponent } from './pago/pago-registro/pago-registro.component';
import { MisPagosComponent }     from './pago/mis-pagos/mis-pagos.component';
import { PerfilComponent }       from './perfil/perfil.component';
import { MisPremiosComponent }   from './premios/mis-premios/mis-premios.component';
import { ReglasComponent }       from './reglas/reglas.component';
import { NotificacionesHistorialComponent } from '../shared/notifications/historial/notificaciones-historial.component';

const routes: Routes = [
  { path: '',             component: DashboardComponent,   title: 'Jugador' },
  { path: 'quinielas',   component: QuinielaListComponent, title: 'Quinielas Disponibles' },
  { path: 'mis-jugadas', component: MisJugadasComponent,   title: 'Mis Jugadas' },
  { path: 'jugadas/:id', component: JugadaDetalleComponent, title: 'Detalle de Jugada' },
  { path: 'pagar',       component: PagoRegistroComponent, title: 'Registrar Pago' },
  { path: 'mis-pagos',   component: MisPagosComponent,     title: 'Mis Pagos' },
  { path: 'mis-premios', component: MisPremiosComponent,   title: 'Mis Premios' },
  { path: 'reglas',      component: ReglasComponent,       title: 'Reglas del Juego' },
  { path: 'notificaciones', component: NotificacionesHistorialComponent, title: 'Notificaciones' },
  { path: 'perfil',      component: PerfilComponent,       title: 'Mi Perfil' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JugadorRoutingModule { }
