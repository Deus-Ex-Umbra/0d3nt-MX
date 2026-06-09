import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

@Entity()
export class ConfiguracionClinica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  logo: string;

  @Column({ nullable: true })
  logo_enlace: string;

  @Column({ nullable: true })
  nombre_clinica: string;

  @Column({ default: 'Bienvenido,' })
  mensaje_bienvenida_antes: string;

  @Column({ default: '¿qué haremos hoy?' })
  mensaje_bienvenida_despues: string;

  @Column({ type: 'text', nullable: true })
  tema_personalizado: string;

  @Column({ type: 'text', nullable: true })
  horarios_laborales: string;

  @Column({ nullable: true })
  gemini_api_key: string;

  @Column({ nullable: true })
  gemini_url_base: string;

  @Column({ default: false })
  gemini_verificado: boolean;

  @Column({ nullable: true })
  exchange_rate_api_key: string;

  @Column({ default: false })
  exchange_rate_verificado: boolean;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  cambio_dolar: number;

  @Column({ default: 'local' })
  trabajar_con: string;

  @Column({ nullable: true })
  moneda_principal: string;

  @Column({ default: false })
  moneda_configurada: boolean;

  @Column({ default: 'cuadrado' })
  modelo_dientes_odontograma: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column()
  usuario_id: number;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;
}
