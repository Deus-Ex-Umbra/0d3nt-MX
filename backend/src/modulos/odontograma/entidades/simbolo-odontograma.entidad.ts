import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

export enum CategoriaSimboloOdontograma {
  TRATAMIENTO_PATOLOGIA = 'TRATAMIENTO_PATOLOGIA',
  CONDICION_HALLAZGO = 'CONDICION_HALLAZGO',
}

@Entity()
export class SimboloOdontograma {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true, type: 'text' })
  descripcion: string;

  @Column({ type: 'text' })
  imagen_base64: string;

  @Column({
    type: 'varchar',
    default: CategoriaSimboloOdontograma.TRATAMIENTO_PATOLOGIA,
  })
  categoria: CategoriaSimboloOdontograma;
  @Column({ default: '#0000FF' })
  color_hover: string;
  @Column({ type: 'varchar', nullable: true, default: null })
  color_secundario: string | null;

  @Column({ type: 'jsonb', nullable: true })
  datos_canvas: any;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ nullable: true })
  usuario_id: number;

  @CreateDateColumn()
  fecha_creacion: Date;

  @DeleteDateColumn({ select: false })
  eliminado_en: Date;
}
