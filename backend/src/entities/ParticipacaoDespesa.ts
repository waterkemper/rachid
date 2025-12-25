import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Despesa } from './Despesa';
import { Participante } from './Participante';

@Entity('participacoes_despesa')
@Unique(['despesa_id', 'participante_id'])
export class ParticipacaoDespesa {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Despesa, despesa => despesa.participacoes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'despesa_id' })
  despesa!: Despesa;

  @Column('integer')
  despesa_id!: number;

  @ManyToOne(() => Participante, participante => participante.participacoes)
  @JoinColumn({ name: 'participante_id' })
  participante!: Participante;

  @Column('integer')
  participante_id!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  valorDevePagar!: number;
}

