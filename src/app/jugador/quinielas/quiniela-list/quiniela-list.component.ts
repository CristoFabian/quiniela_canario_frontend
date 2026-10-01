import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { JugadorApiService } from '../../services/jugador-api.service';
import { QuinielaDisponible, EstadoPerfil } from '../../models/jugador.models';

@Component({
  selector: 'app-quiniela-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quiniela-list.component.html',
  styleUrl: './quiniela-list.component.scss',
})
export class QuinielaListComponent implements OnInit {
  private service = inject(JugadorApiService);
  private router  = inject(Router);

  cargando  = true;
  error     = '';
  quinielas: QuinielaDisponible[] = [];

  estadoPerfil: EstadoPerfil | null = null;
  get perfilIncompleto(): boolean { return this.estadoPerfil === 'INCOMPLETO'; }

  // map quinielaId → guardando (creando jugada)
  creando: Record<number, boolean> = {};
  errorCrear: Record<number, string> = {};

  ngOnInit(): void {
    this.cargar();
    this.service.getPerfil().subscribe({
      next: (p) => (this.estadoPerfil = p.estado),
      error: ()  => {},
    });
  }

  cargar(): void {
    this.cargando = true;
    this.error    = '';
    this.service.listarQuinielasDisponibles().subscribe({
      next: (q) => { this.quinielas = q; this.cargando = false; },
      error: (err) => {
        this.error    = err.error?.error ?? 'Error al cargar quinielas';
        this.cargando = false;
      },
    });
  }

  participar(q: QuinielaDisponible): void {
    if (this.creando[q.id]) return;
    if (this.perfilIncompleto) {
      this.router.navigate(['/jugador/perfil']);
      return;
    }
    this.creando[q.id]    = true;
    this.errorCrear[q.id] = '';
    this.service.crearJugada({ quinielaId: q.id }).subscribe({
      next: (jugada) => {
        this.creando[q.id] = false;
        this.router.navigate(['/jugador/jugadas', jugada.id]);
      },
      error: (err) => {
        this.errorCrear[q.id] = err.error?.error ?? 'Error al crear jugada';
        this.creando[q.id]    = false;
      },
    });
  }

  esCerrada(fechaCierre: string): boolean {
    return Date.now() >= new Date(fechaCierre).getTime();
  }

  tiempoCierre(fechaCierre: string): string {
    const diff = new Date(fechaCierre).getTime() - Date.now();
    if (diff <= 0) return 'Cerrada';
    const totalSegs = Math.floor(diff / 1_000);
    const dias      = Math.floor(totalSegs / 86_400);
    const horas     = Math.floor((totalSegs % 86_400) / 3_600);
    const mins      = Math.floor((totalSegs % 3_600) / 60);
    const segs      = totalSegs % 60;
    if (dias >= 1) return `${dias} día${dias !== 1 ? 's' : ''} ${horas}h ${mins}m`;
    if (horas >= 1) return `${horas}h ${mins}m ${segs}s`;
    if (mins >= 1)  return `${mins}m ${segs}s`;
    return `${segs}s`;
  }

  urgente(fechaCierre: string): boolean {
    const diff = new Date(fechaCierre).getTime() - Date.now();
    return diff > 0 && diff < 2 * 86_400_000;
  }
}
