import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { PagoAdmin, ValidarPagoRequest } from '../../../core/models/admin.models';

@Component({
  selector: 'app-pago-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './pago-detalle.component.html',
  styleUrl: './pago-detalle.component.scss',
})
export class PagoDetalleComponent implements OnInit, OnDestroy {
  private adminApi  = inject(AdminApiService);
  private route     = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  pago: PagoAdmin | null = null;
  cargando = true;
  error = '';

  // Comprobante
  comprobanteUrl: SafeUrl | null = null;
  comprobanteObjectUrl: string | null = null;
  cargandoImagen = false;
  esImagen = false;
  esPdf    = false;

  // Formulario validación
  observacion = '';
  guardando = false;
  guardandoAccion: 'APROBADO' | 'RECHAZADO' | null = null;
  errorGuardar = '';
  exito = '';

  // Subir comprobante (admin)
  uploadFile: File | null = null;
  subiendoComprobante = false;
  errorUpload = '';
  exitoUpload = '';

  private routeSub?: Subscription;

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.resetEstado();
      this.cargar(id);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    if (this.comprobanteObjectUrl) URL.revokeObjectURL(this.comprobanteObjectUrl);
  }

  private resetEstado(): void {
    this.pago = null;
    this.cargando = true;
    this.error = '';
    this.comprobanteUrl = null;
    if (this.comprobanteObjectUrl) { URL.revokeObjectURL(this.comprobanteObjectUrl); this.comprobanteObjectUrl = null; }
    this.cargandoImagen = false;
    this.esImagen = false;
    this.esPdf = false;
    this.observacion = '';
    this.guardando = false;
    this.guardandoAccion = null;
    this.errorGuardar = '';
    this.exito = '';
    this.uploadFile = null;
    this.subiendoComprobante = false;
    this.errorUpload = '';
    this.exitoUpload = '';
  }

  cargar(id: number): void {
    this.cargando = true;
    this.error = '';
    this.adminApi.obtenerPago(id).subscribe({
      next: (p) => {
        this.pago = p;
        this.cargando = false;
        if (p.comprobanteUrl) {
          this.cargarComprobante(p.id);
        }
      },
      error: (err) => {
        this.error = err.error?.error ?? 'Error al cargar el pago';
        this.cargando = false;
      },
    });
  }

  cargarComprobante(pagoId: number): void {
    this.cargandoImagen = true;
    this.adminApi.getComprobante(pagoId).subscribe({
      next: (blob) => {
        if (this.comprobanteObjectUrl) URL.revokeObjectURL(this.comprobanteObjectUrl);
        const url = URL.createObjectURL(blob);
        this.comprobanteObjectUrl = url;

        // Primary: use MIME type from Content-Type header (blob.type)
        // Fallback: detect from stored filename extension
        const mime = blob.type || '';
        const ext  = (this.pago?.comprobanteUrl ?? '').split('.').pop()?.toLowerCase() ?? '';
        this.esImagen = mime.startsWith('image/') || ['jpg','jpeg','png','webp','gif'].includes(ext);
        this.esPdf    = mime === 'application/pdf'  || ext === 'pdf';

        this.comprobanteUrl = this.sanitizer.bypassSecurityTrustUrl(url);
        this.cargandoImagen = false;
      },
      error: () => { this.cargandoImagen = false; },
    });
  }

  validar(accion: 'APROBADO' | 'RECHAZADO'): void {
    if (!this.pago) return;
    if (accion === 'RECHAZADO' && !this.observacion.trim()) {
      this.errorGuardar = 'Escribe el motivo del rechazo antes de continuar.';
      return;
    }
    if (accion === 'APROBADO' && !window.confirm('¿Confirmas que deseas aprobar este pago? Se activarán las jugadas del jugador.')) {
      return;
    }
    const request: ValidarPagoRequest = {
      estado: accion,
      observacion: this.observacion.trim() || undefined,
    };
    this.guardando = true;
    this.guardandoAccion = accion;
    this.errorGuardar = '';
    this.exito = '';
    this.adminApi.validarPago(this.pago.id, request).subscribe({
      next: (updated) => {
        this.pago = updated;
        this.guardando = false;
        this.guardandoAccion = null;
        this.exito = accion === 'APROBADO'
          ? 'Pago aprobado. Las jugadas fueron activadas.'
          : 'Pago rechazado. El jugador puede reintentar.';
      },
      error: (err) => {
        this.errorGuardar = err.error?.error ?? 'Error al validar el pago';
        this.guardando = false;
        this.guardandoAccion = null;
      },
    });
  }

  abrirComprobante(): void {
    if (this.comprobanteObjectUrl) window.open(this.comprobanteObjectUrl, '_blank');
  }

  onSeleccionarArchivoAdmin(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    if (!file) { this.uploadFile = null; return; }
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!permitidos.includes(file.type)) {
      this.errorUpload = 'Solo JPG, PNG, WEBP o PDF.';
      this.uploadFile = null;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorUpload = 'El archivo no debe superar 5 MB.';
      this.uploadFile = null;
      return;
    }
    this.errorUpload = '';
    this.uploadFile  = file;
  }

  subirComprobanteAdmin(): void {
    if (!this.pago) return;
    if (!this.uploadFile) {
      this.errorUpload = 'Selecciona un archivo de comprobante.';
      return;
    }
    this.subiendoComprobante = true;
    this.errorUpload  = '';
    this.exitoUpload  = '';
    this.adminApi.subirComprobanteAdmin(this.pago.id, this.uploadFile, false).subscribe({
      next: (updated) => {
        this.pago = updated;
        this.subiendoComprobante = false;
        this.uploadFile     = null;
        this.exitoUpload    = 'Comprobante registrado correctamente.';
        if (updated.comprobanteUrl) {
          this.cargarComprobante(updated.id);
        }
      },
      error: (err) => {
        this.errorUpload = err.error?.error ?? 'Error al subir el comprobante.';
        this.subiendoComprobante = false;
      },
    });
  }

  tiempoTranscurrido(fechaStr: string): string {
    const diff = Date.now() - new Date(fechaStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'hace un momento';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days} día${days > 1 ? 's' : ''}`;
  }
}
