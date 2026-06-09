import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

@Entity({ name: 'vl_credenciales' })
@Index(['usuario'], { unique: true })
export class VlCredencial {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  usuario: Usuario;

  @Column({ type: 'text' })
  token_encriptado: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  vl_api_base_url: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}
