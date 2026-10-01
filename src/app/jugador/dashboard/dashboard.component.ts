import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JugadorApiService } from '../services/jugador-api.service';
import { EstadoPerfil } from '../models/jugador.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private service = inject(JugadorApiService);

  estadoPerfil: EstadoPerfil | null = null;

  get perfilIncompleto(): boolean { return this.estadoPerfil === 'INCOMPLETO'; }

  ngOnInit(): void {
    this.service.getPerfil().subscribe({
      next: (p) => (this.estadoPerfil = p.estado),
      error: ()  => {},
    });
  }
}
