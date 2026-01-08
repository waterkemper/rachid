import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Grupo } from './Grupo';

@Entity('evento_acessos')
export class EventoAcesso {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Grupo)
  @JoinColumn({ name: 'evento_id' })
  evento!: Grupo;

  @Column('integer')
  evento_id!: number;

  @Column('varchar', { name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column('text', { name: 'user_agent', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'acessado_em' })
  acessadoEm!: Date;
}

