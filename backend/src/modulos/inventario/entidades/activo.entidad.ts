import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Producto } from './producto.entidad';
import { Bitacora } from './bitacora.entidad';

export enum EstadoActivo {
  DISPONIBLE = 'disponible',
  EN_MANTENIMIENTO = 'en_mantenimiento',
  DESECHADO = 'desechado',
  VENDIDO = 'vendido',
}

@Entity()
export class Activo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  codigo_interno: string;

  @Column({ nullable: true })
  nro_serie: string;

  @Column({ nullable: true })
  nombre_asignado: string;

  @Column('decimal', { precision: 10, scale: 2 })
  costo_compra: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  costo_compra_usd: number;

  @Column()
  fecha_compra: Date;

  @Column({ nullable: true, select: false })
  ubicacion: string;

  @Column({
    type: 'varchar',
    enum: EstadoActivo,
    default: EstadoActivo.DISPONIBLE,
  })
  estado: EstadoActivo;

  @ManyToOne(() => Producto, (producto) => producto.activos, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  producto: Producto;

  @OneToMany(() => Bitacora, (bitacora) => bitacora.activo)
  historial: Bitacora[];

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;

  @DeleteDateColumn({ nullable: true })
  eliminado_en?: Date | null;
}
