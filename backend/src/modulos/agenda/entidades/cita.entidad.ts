import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  DeleteDateColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Paciente } from '../../pacientes/entidades/paciente.entidad';
import { PlanTratamiento } from '../../tratamientos/entidades/plan-tratamiento.entidad';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';
import { ReservaMaterial } from '../../inventario/entidades/reserva-material.entidad';

@Entity()
export class Cita {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  usuario: Usuario;

  @Column()
  fecha: Date;

  @Column()
  descripcion: string;

  @Column({ nullable: true })
  estado_pago: string;

  @Column('decimal', { precision: 40, scale: 2, nullable: true })
  monto_esperado: number;

  @Column('decimal', { precision: 40, scale: 2, nullable: true })
  monto_esperado_usd: number;

  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  tasa_cambio: number;

  @Column({ default: 0 })
  horas_aproximadas: number;

  @Column({ default: 30 })
  minutos_aproximados: number;

  @Column({ default: false })
  materiales_confirmados: boolean;

  @ManyToOne(() => Paciente, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  paciente: Paciente;

  @Column({ default: false })
  paciente_eliminado: boolean;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;

  @ManyToOne(() => PlanTratamiento, (plan) => plan.citas, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  plan_tratamiento: PlanTratamiento | null;

  @OneToMany(() => ReservaMaterial, (reserva) => reserva.cita)
  reservas_materiales: ReservaMaterial[];

  @DeleteDateColumn({ nullable: true })
  eliminado_en?: Date | null;
}
