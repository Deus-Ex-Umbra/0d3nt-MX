import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Paciente } from '../../pacientes/entidades/paciente.entidad';
import { Tratamiento } from './tratamiento.entidad';
import { Cita } from '../../agenda/entidades/cita.entidad';
import { Pago } from '../../finanzas/entidades/pago.entidad';
import { Egreso } from '../../finanzas/entidades/egreso.entidad';
import { ArchivoAdjunto } from '../../archivos-adjuntos/entidades/archivo-adjunto.entidad';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

export enum EstadoPlanTratamiento {
  PENDIENTE = 'pendiente',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

@Entity()
export class PlanTratamiento {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  usuario: Usuario;

  @ManyToOne(() => Paciente, (paciente) => paciente.planes_tratamiento, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  paciente: Paciente;

  @ManyToOne(() => Tratamiento, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  tratamiento: Tratamiento;

  @Column('decimal', { precision: 40, scale: 2 })
  costo_total: number;

  @Column('decimal', { precision: 40, scale: 2, default: 0 })
  costo_total_usd: number;

  @Column('decimal', { precision: 40, scale: 2 })
  total_abonado: number;

  @Column('decimal', { precision: 40, scale: 2, default: 0 })
  total_abonado_usd: number;

  @Column({ default: false })
  materiales_inicio_confirmados: boolean;

  @Column({ default: false })
  materiales_finales_confirmados: boolean;

  @Column({ type: 'varchar', default: EstadoPlanTratamiento.PENDIENTE })
  estado: EstadoPlanTratamiento;

  @Column({ default: false })
  paciente_eliminado: boolean;

  @Column({ default: true })
  auto_completar_al_100: boolean;

  @OneToMany(() => Cita, (cita) => cita.plan_tratamiento)
  citas: Cita[];

  @OneToMany(() => Pago, (pago) => pago.plan_tratamiento)
  pagos: Pago[];

  @OneToMany(() => Egreso, (egreso) => egreso.plan_tratamiento)
  egresos: Egreso[];

  @OneToMany(() => ArchivoAdjunto, (archivo) => archivo.plan_tratamiento)
  archivos_adjuntos: ArchivoAdjunto[];

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;

  @DeleteDateColumn({ nullable: true })
  eliminado_en?: Date | null;
}
