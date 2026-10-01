import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { JugadorApiService, WHATSAPP_NUMERO } from '../../services/jugador-api.service';
import { Jugada, PerfilJugador } from '../../models/jugador.models';

@Component({
  selector: 'app-pago-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pago-registro.component.html',
  styleUrl: './pago-registro.component.scss',
})
export class PagoRegistroComponent implements OnInit {
  private service = inject(JugadorApiService);
  private router  = inject(Router);
  private route   = inject(ActivatedRoute);

  // ── Estado carga ──────────────────────────────────────────────────
  cargando = true;
  error    = '';

  // ── Jugadas disponibles (estado CREADA) ───────────────────────────
  jugadasCreadas: Jugada[] = [];
  seleccionadas  = new Set<number>();
  private totalesPronosticosRequeridos = new Map<number, number>();

  // ── Monto ─────────────────────────────────────────────────────────
  monto = 0;

  // ── Comprobante ───────────────────────────────────────────────────
  comprobante: File | null = null;
  previewUrl: string | null = null;
  isDragOver = false;
  errorArchivo = '';  comprobanteViaWhatsapp = false;

  // ── Saldo a favor ─────────────────────────────────────────────────
  perfil: PerfilJugador | null = null;
  usarSaldoAFavor = false;

  // ── Envío ─────────────────────────────────────────────────────────
  enviando  = false;
  enviado   = false;
  pagoId: number | null = null;
  pagadoConSaldo = false;
  errorWhatsApp = '';

  ngOnInit(): void {
    this.service.getPerfil().subscribe({
      next: (perfil) => { this.perfil = perfil; },
    });

    this.service.listarMisJugadas().subscribe({
      next: (jugadas) => {
        this.jugadasCreadas = jugadas.filter(j => j.estado === 'CREADA');
        this.cargarTotalesPronosticosRequeridos();
        this.cargando = false;
        this.preseleccionarDesdeParam();
      },
      error: () => {
        this.error = 'No se pudieron cargar tus jugadas.';
        this.cargando = false;
      },
    });
  }

  private cargarTotalesPronosticosRequeridos(): void {
    const quinielaIds = Array.from(new Set(this.jugadasCreadas.map(j => j.quinielaId)));
    quinielaIds.forEach(id => {
      this.service.obtenerQuinielaDetalle(id).subscribe({
        next: (quiniela) => {
          const next = new Map(this.totalesPronosticosRequeridos);
          next.set(id, quiniela.totalPartidos);
          this.totalesPronosticosRequeridos = next;
        },
      });
    });
  }

  private preseleccionarDesdeParam(): void {
    const param = this.route.snapshot.queryParamMap.get('jugadaIds');
    if (param) {
      const ids = param.split(',').map(n => Number(n.trim())).filter(n => !isNaN(n) && n > 0);
      ids.forEach(id => {
        if (this.jugadasCreadas.some(j => j.id === id)) {
          this.seleccionadas.add(id);
        }
      });
      this.recalcularMonto();
    }
  }

  // ── Selección ─────────────────────────────────────────────────────

  toggleSeleccion(id: number): void {
    this.errorWhatsApp = '';
    const next = new Set(this.seleccionadas);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.seleccionadas = next;
    this.recalcularMonto();
  }

  recalcularMonto(): void {
    const total = this.jugadasCreadas
      .filter(j => this.seleccionadas.has(j.id))
      .reduce((acc, j) => acc + (j.costoQuiniela ?? 0), 0);
    this.monto = total;
    if (!this.puedeUsarSaldoAFavor) {
      this.usarSaldoAFavor = false;
    }
  }

  get ninguntSeleccionada(): boolean {
    return this.seleccionadas.size === 0;
  }

  // ── Saldo a favor ─────────────────────────────────────────────────

  get saldoAFavor(): number {
    return this.perfil?.saldoAFavor ?? 0;
  }

  /** Concepto que el jugador debe anotar en su transferencia bancaria. */
  get conceptoTransferencia(): string {
    const partes = [this.perfil?.nombre, this.perfil?.apellidoPaterno, this.perfil?.apellidoMaterno]
      .filter((p): p is string => !!p && p.trim().length > 0);
    return partes.join(' ');
  }

  /** Solo se muestra el checkbox cuando el jugador tiene saldo disponible. */
  get mostrarSaldoAFavor(): boolean {
    return this.saldoAFavor > 0;
  }

  /** Solo se puede usar si hay saldo y alcanza para cubrir el monto seleccionado. */
  get puedeUsarSaldoAFavor(): boolean {
    return this.saldoAFavor > 0 && this.monto > 0 && this.saldoAFavor >= this.monto;
  }

  toggleUsarSaldoAFavor(): void {
    if (!this.puedeUsarSaldoAFavor) return;
    this.usarSaldoAFavor = !this.usarSaldoAFavor;
    if (this.usarSaldoAFavor) {
      this.comprobante = null;
      this.previewUrl  = null;
      this.comprobanteViaWhatsapp = false;
      this.errorArchivo = '';
    }
  }

  jugadaTienePronosticosIncompletos(jugada: Jugada): boolean {
    const totalRequerido = this.totalesPronosticosRequeridos.get(jugada.quinielaId);
    return totalRequerido != null && jugada.totalPronosticos < totalRequerido;
  }

  validarWhatsApp(event: MouseEvent): void {
    if (this.seleccionadas.size === 0) {
      event.preventDefault();
      this.errorWhatsApp = 'Selecciona al menos un ticket antes de contactar por WhatsApp.';
      return;
    }

    const jugadasSeleccionadas = this.jugadasCreadas
      .filter(jugada => this.seleccionadas.has(jugada.id));
    const faltanTotales = jugadasSeleccionadas.some(
      jugada => !this.totalesPronosticosRequeridos.has(jugada.quinielaId)
    );

    if (faltanTotales) {
      event.preventDefault();
      this.errorWhatsApp = 'Espera a que se validen los pronósticos de tus tickets e inténtalo nuevamente.';
      return;
    }

    if (jugadasSeleccionadas.some(jugada => this.jugadaTienePronosticosIncompletos(jugada))) {
      event.preventDefault();
      this.errorWhatsApp = 'Todos los tickets seleccionados deben tener completos sus pronósticos.';
      return;
    }

    this.errorWhatsApp = '';
  }

  // ── Comprobante ───────────────────────────────────────────────────

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.procesarArchivo(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.procesarArchivo(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  private procesarArchivo(file: File): void {
    this.errorArchivo = '';
    const permitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!permitidos.includes(file.type)) {
      this.errorArchivo = 'Solo se aceptan imágenes JPG/PNG o PDF.';
      return;
    }
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      this.errorArchivo = `El archivo no debe superar ${maxMB} MB.`;
      return;
    }
    this.comprobante = file;
    this.comprobanteViaWhatsapp = false;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => { this.previewUrl = e.target?.result as string; };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  quitarComprobante(): void {
    this.comprobante = null;
    this.previewUrl  = null;
  }

  toggleComprobanteViaWhatsapp(): void {
    if (this.comprobante) return;
    this.comprobanteViaWhatsapp = !this.comprobanteViaWhatsapp;
    this.errorArchivo = '';
  }

  // ── WhatsApp ──────────────────────────────────────────────────────

  get enlaceWhatsApp(): string {
    const ids = Array.from(this.seleccionadas).map(id => `#${id}`).join(', ');
    const msg = encodeURIComponent(
      `¡Hola! Quiero registrar mi pago para las jugadas ${ids || '??'}. ` +
      `Monto: $${this.monto} MXN. ¿Me puedes proporcionar los detalles de la transferencia?`
    );
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`;
  }

  // ── Enviar ────────────────────────────────────────────────────────

  enviar(): void {
    if (this.ninguntSeleccionada || this.enviando) return;

    if (this.usarSaldoAFavor && !this.puedeUsarSaldoAFavor) {
      this.error = 'Tu saldo a favor no alcanza para cubrir el monto seleccionado.';
      return;
    }

    if (!this.usarSaldoAFavor && !this.comprobante && !this.comprobanteViaWhatsapp) {
      this.errorArchivo = 'Sube tu comprobante o marca que lo enviarás por WhatsApp.';
      return;
    }

    this.enviando = true;
    this.error    = '';
    const pagoConSaldo = this.usarSaldoAFavor;

    const ids = Array.from(this.seleccionadas);
    this.service.crearPago(
      ids,
      this.monto,
      this.usarSaldoAFavor ? undefined : (this.comprobante ?? undefined),
      this.usarSaldoAFavor ? false : this.comprobanteViaWhatsapp,
      this.usarSaldoAFavor,
    ).subscribe({
      next: (pago) => {
        this.enviado = true;
        this.pagoId  = pago.id;
        this.pagadoConSaldo = pagoConSaldo;
        this.enviando = false;
      },
      error: (err) => {
        this.error    = err.error?.error ?? 'Ocurrió un error al registrar el pago.';
        this.enviando = false;
      },
    });
  }

  irAMisPagos(): void {
    this.router.navigate(['/jugador/mis-pagos']);
  }
}
