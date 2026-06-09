import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';
import { Paciente } from '../../pacientes/entidades/paciente.entidad';
import { OdontogramaAplicacion } from './odontograma-aplicacion.entidad';

@Entity()
export class Odontograma {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ nullable: true })
  paciente_id: number;

  @Column({ nullable: true })
  nombre: string;

  @Column({ type: 'enum', enum: ['adulto', 'nino'], default: 'adulto' })
  tipo: 'adulto' | 'nino';

  @Column({ default: 1 })
  version: number;

  @Column({ default: true })
  es_ultima_version: boolean;

  @Column({ type: 'simple-json', nullable: true })
  datos_pintado: any;

  @Column({ type: 'simple-json', nullable: true })
  configuracion_dientes: any;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @OneToMany(
    () => OdontogramaAplicacion,
    (aplicacion) => aplicacion.odontograma,
    { cascade: true },
  )
  aplicaciones: OdontogramaAplicacion[];

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ nullable: true })
  usuario_id: number;

  @DeleteDateColumn({ select: false })
  eliminado_en: Date;
}
