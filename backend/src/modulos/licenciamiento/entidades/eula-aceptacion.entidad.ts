import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

@Entity({ name: 'eula_aceptaciones' })
@Index(['usuario', 'aceptado_en'])
export class EulaAceptacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  usuario: Usuario;

  @CreateDateColumn({ type: 'timestamptz' })
  aceptado_en: Date;

  @Column({ type: 'varchar', length: 128, nullable: true })
  ip: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  plataforma: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  hostname: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  app_version: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  eula_version: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  hash_aceptacion_local: string | null;

  @Column({ type: 'jsonb', nullable: true })
  dispositivo: Record<string, any> | null;
}
