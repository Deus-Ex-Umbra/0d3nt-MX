import { NotaDiaria } from '../../notas/entidades/nota-diaria.entidad';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  correo: string;

  @Column()
  contrasena: string;

  @Column({ nullable: true })
  pais: string;

  @Column({ nullable: true, default: '+591' })
  codigo_pais: string;

  @Column({ nullable: true, default: '$' })
  moneda: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  moneda_pais_iso?: string | null;

  @Column({ type: 'text', nullable: true })
  avatar_ruta: string | null;

  @Column({ type: 'boolean', default: false })
  modo_edicion_historica: boolean;

  @OneToMany(() => NotaDiaria, (nota) => nota.usuario)
  notas: NotaDiaria[];

  @DeleteDateColumn({ select: false })
  eliminado_en: Date;
}
