import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

@Entity()
export class TutorialCompletado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre_tutorial: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column()
  usuario_id: number;

  @CreateDateColumn()
  fecha_completado: Date;
}
