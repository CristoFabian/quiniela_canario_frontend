import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { QuinielaListComponent } from './quinielas/quiniela-list/quiniela-list.component';
import { QuinielaCreateComponent } from './quinielas/quiniela-create/quiniela-create.component';
import { QuinielaDetailComponent } from './quinielas/quiniela-detail/quiniela-detail.component';
import { TiposListComponent } from './catalogos/tipos-list/tipos-list.component';
import { PagosListComponent } from './pagos/pagos-list/pagos-list.component';
import { PagoDetalleComponent } from './pagos/pago-detalle/pago-detalle.component';
import { ReglasListComponent } from './reglas/reglas-list/reglas-list.component';
import { FinanzasAdminComponent } from './finanzas/finanzas-admin.component';
import { NotificacionesHistorialComponent } from '../shared/notifications/historial/notificaciones-historial.component';

const routes: Routes = [
  { path: '',                component: DashboardComponent,      title: 'Admin' },
  { path: 'quinielas',       component: QuinielaListComponent,   title: 'Quinielas' },
  { path: 'quinielas/nueva', component: QuinielaCreateComponent,  title: 'Nueva Quiniela' },
  { path: 'quinielas/:id',   component: QuinielaDetailComponent,  title: 'Detalle de Quiniela' },
  { path: 'catalogos',       component: TiposListComponent,       title: 'Catálogos' },
  { path: 'pagos',           component: PagosListComponent,       title: 'Pagos' },
  { path: 'pagos/:id',       component: PagoDetalleComponent,     title: 'Detalle de Pago' },
  { path: 'finanzas',        component: FinanzasAdminComponent,   title: 'Finanzas' },
  { path: 'reglas',          component: ReglasListComponent,      title: 'Reglas del Juego' },
  { path: 'notificaciones',  component: NotificacionesHistorialComponent, title: 'Notificaciones' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
