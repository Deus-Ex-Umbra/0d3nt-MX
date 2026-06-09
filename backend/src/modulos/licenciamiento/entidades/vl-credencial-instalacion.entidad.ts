import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'vl_credenciales_instalacion' })
@Index(['hwid'], { unique: true })
export class VlCredencialInstalacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128 })
  hwid: string;

  @Column({ type: 'text' })
  token_encriptado: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  vl_api_base_url: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  validado_en: Date | null;

  @Column({ type: 'text', nullable: true })
  ultimo_error: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}
