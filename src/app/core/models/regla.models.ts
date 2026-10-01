export type CategoriaRegla = 'GENERAL' | 'PUNTUACION' | 'DESEMPATE' | 'PREMIOS' | 'PAGOS';

export const CATEGORIAS_REGLA: CategoriaRegla[] = ['GENERAL', 'PUNTUACION', 'DESEMPATE', 'PREMIOS', 'PAGOS'];

export const CATEGORIA_REGLA_LABELS: Record<CategoriaRegla, string> = {
  GENERAL:    'General',
  PUNTUACION: 'Puntuación',
  DESEMPATE:  'Desempate',
  PREMIOS:    'Premios',
  PAGOS:      'Pagos',
};

export interface ReglaJuego {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: CategoriaRegla;
  orden: number;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ReglaJuegoDto {
  titulo: string;
  descripcion: string;
  categoria: CategoriaRegla;
  orden: number;
  activo: boolean;
}
