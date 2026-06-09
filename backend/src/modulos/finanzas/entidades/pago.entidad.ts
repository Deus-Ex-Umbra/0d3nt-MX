import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlanTratamiento } from '../../tratamientos/entidades/plan-tratamiento.entidad';
import { Cita } from '../../agenda/entidades/cita.entidad';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

@Entity()
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  usuario: Usuario;

  @Column()
  fecha: Date;

  @Column('decimal', { precision: 40, scale: 2 })
  monto: number;

  @Column('decimal', { precision: 40, scale: 2, default: 0 })
  monto_usd: number;

  @Column('decimal', { precision: 10, scale: 4, default: 1 })
  tasa_cambio: number;

  @Column()
  concepto: string;

  @ManyToOne(() => PlanTratamiento, (plan) => plan.pagos, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  plan_tratamiento: PlanTratamiento | null;

  @ManyToOne(() => Cita, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  cita: Cita | null;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;

  @DeleteDateColumn()
  eliminado_en: Date;
}
