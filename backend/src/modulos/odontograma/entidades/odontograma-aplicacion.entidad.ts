import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Odontograma } from './odontograma.entidad';
import { SimboloOdontograma } from './simbolo-odontograma.entidad';

export interface PiezaAfectada {
  numero_pieza: number;
  partes: string[];
}

export interface TransformacionSimbolo {
  x: number;
  y: number;
  escala: number;
  espejo_x: boolean;
  espejo_y: boolean;
  rotacion: number;

  color?: string;
  hover_color?: string;
  estado?: 'REALIZADO' | 'POR_REALIZAR';
}

@Entity()
export class OdontogramaAplicacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Odontograma, (odontograma) => odontograma.aplicaciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'odontograma_id' })
  odontograma: Odontograma;

  @Column({ nullable: true })
  odontograma_id: number;

  @ManyToOne(() => SimboloOdontograma, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'simbolo_id' })
  simbolo: SimboloOdontograma;

  @Column({ nullable: true })
  simbolo_id: number;

  @Column({ nullable: true, type: 'text' })
  comentario: string;

  @Column({ type: 'simple-json' })
  piezas_afectadas: PiezaAfectada[];

  @Column({ type: 'simple-json', nullable: true })
  transformacion: TransformacionSimbolo;

  @CreateDateColumn()
  fecha_creacion: Date;
}
