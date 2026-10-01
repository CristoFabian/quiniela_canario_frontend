import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PagoAdmin, PremioAdmin } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { QuinielaService } from '../quinielas/quiniela.service';

@Component({
  selector: 'app-finanzas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finanzas-admin.component.html',
  styleUrl: './finanzas-admin.component.scss',
})
export class FinanzasAdminComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly quinielaService = inject(QuinielaService);

  tab: 'pagos' | 'premios' = 'pagos';
  cargando = true;
  error = '';
  busqueda = '';
  fechaDesde = '';
  fechaHasta = '';

  pagosAprobados: PagoAdmin[] = [];
  premiosEntregados: PremioAdmin[] = [];

  private setError(message: string): void {
    this.error = message;
    if (message) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        this.error = '';
      }, 4000);
    }
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';

    this.adminApi.listarPagos('APROBADO').subscribe({
      next: (pagos) => {
        this.pagosAprobados = pagos;
        this.cargarPremios();
      },
      error: (err) => {
        this.setError(err.error?.error ?? 'Error al cargar pagos aprobados');
        this.cargarPremios();
      },
    });
  }

  private cargarPremios(): void {
    this.quinielaService.listar().subscribe({
      next: (quinielas) => {
        if (quinielas.length === 0) {
          this.premiosEntregados = [];
          this.cargando = false;
          return;
        }

        forkJoin(quinielas.map((q) => this.adminApi.listarPremiosPorQuiniela(q.id))).subscribe({
          next: (grupos) => {
            this.premiosEntregados = grupos
              .flat()
              .filter((premio) => premio.estadoPremio === 'PAGADO' || premio.estadoPremio === 'CONFIRMADO');
            this.cargando = false;
          },
          error: (err) => {
            this.setError(this.error || (err.error?.error ?? 'Error al cargar premios entregados'));
            this.cargando = false;
          },
        });
      },
      error: (err) => {
        this.setError(this.error || (err.error?.error ?? 'Error al cargar quinielas'));
        this.cargando = false;
      },
    });
  }

  get pagosFiltrados(): PagoAdmin[] {
    const q = this.busqueda.trim().toLowerCase();

    return this.pagosAprobados.filter((p) => {
      const nombre = (p.nombreCompleto ?? p.usuarioUsername ?? '').toLowerCase();
      const coincideBusqueda =
        !q ||
        nombre.includes(q) ||
        p.usuarioUsername.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        p.jugadas.some((j) => j.quinielaNombre.toLowerCase().includes(q));

      const coincideFecha = this.cumpleFiltroFecha(this.fechaDesde, this.fechaHasta, p.fechaValidacion ?? p.fechaCreacion);
      return coincideBusqueda && coincideFecha;
    });
  }

  get premiosFiltrados(): PremioAdmin[] {
    const q = this.busqueda.trim().toLowerCase();

    return this.premiosEntregados.filter((p) => {
      const coincideBusqueda =
        !q ||
        p.nombreQuiniela.toLowerCase().includes(q) ||
        p.nombreCompleto.toLowerCase().includes(q) ||
        String(p.ganadorId).includes(q) ||
        String(p.montoPremio).includes(q);

      const coincideFecha = this.cumpleFiltroFecha(this.fechaDesde, this.fechaHasta, p.fechaPagoPremio ?? '');
      return coincideBusqueda && coincideFecha;
    });
  }

  limpiarFiltros(): void {
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.busqueda = '';
  }

  cumpleFiltroFecha(fechaDesde: string, fechaHasta: string, valorFecha: string | null): boolean {
    if (!fechaDesde && !fechaHasta) return true;
    if (!valorFecha) return false;

    const fecha = new Date(valorFecha);
    if (Number.isNaN(fecha.getTime())) return false;

    const inicio = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null;
    const fin = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999`) : null;

    if (inicio && fecha < inicio) return false;
    if (fin && fecha > fin) return false;
    return true;
  }

  getEstadoPremioLabel(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      PAGADO: 'Pagado',
      CONFIRMADO: 'Confirmado',
    };
    return map[estado] ?? estado;
  }

  getEstadoPremioClass(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'estado-pendiente',
      PAGADO: 'estado-pagado',
      CONFIRMADO: 'estado-confirmado',
    };
    return map[estado] ?? 'estado-default';
  }

  getEstadoPagoClass(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'estado-pendiente',
      APROBADO: 'estado-aprobado',
      RECHAZADO: 'estado-rechazado',
      VENCIDO: 'estado-vencido',
    };
    return map[estado] ?? 'estado-default';
  }

  getComprobanteLabel(pago: PagoAdmin): string {
    if (pago.comprobanteWhatsapp) return 'WhatsApp';
    if (pago.comprobanteUrl) return 'Archivo';
    return 'Sin comprobante';
  }

  verComprobantePago(pago: PagoAdmin): void {
    if (!pago.comprobanteUrl && !pago.comprobanteWhatsapp) {
      this.setError('Este pago no tiene comprobante adjunto.');
      return;
    }

    this.adminApi.getComprobante(pago.id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => {
        this.setError('No se pudo cargar el comprobante del pago.');
      },
    });
  }

  verComprobantePremio(premio: PremioAdmin): void {
    if (!premio.tieneComprobante) {
      this.setError('Este premio no tiene comprobante registrado.');
      return;
    }

    this.adminApi.getComprobantePremio(premio.ganadorId).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => {
        this.setError('No se pudo cargar el comprobante del premio.');
      },
    });
  }

  formatMoney(value: number | string | null | undefined): string {
    const numericValue = Number(value ?? 0);
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Sin fecha';
    return new Date(date).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
