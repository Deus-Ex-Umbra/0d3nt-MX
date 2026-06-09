import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('licenciamiento_canal_seguro')
export class LicenciamientoCanalSeguro {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 64, default: 'rsa-oaep-256-v1' })
  canal: string;

  @Column({ type: 'text' })
  private_key_pem_cifrado: string;

  @Column({ type: 'text' })
  public_key_jwk_json: string;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}
