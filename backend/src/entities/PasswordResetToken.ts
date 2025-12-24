import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './Usuario';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar', { unique: true })
  token!: string;

  @Column('int')
  usuario_id!: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column({ type: 'timestamp' })
  expiraEm!: Date;

  @Column({ type: 'boolean', default: false })
  usado!: boolean;

  @CreateDateColumn()
  criadoEm!: Date;
}

