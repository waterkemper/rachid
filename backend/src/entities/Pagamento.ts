import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Grupo } from './Grupo';
import { Participante } from './Participante';
import { GrupoParticipantesEvento } from './GrupoParticipantesEvento';

@Entity('pagamentos')
export class Pagamento {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Grupo, grupo => grupo.pagamentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grupo_id' })
  grupo!: Grupo;

  @Column('integer', { name: 'grupo_id' })
  grupoId!: number;

  @Column({ type: 'varchar', length: 20, default: 'INDIVIDUAL' })
  tipo!: 'INDIVIDUAL' | 'ENTRE_GRUPOS';

  // Campos para pagamentos individuais (tipo INDIVIDUAL)
  @ManyToOne(() => Participante, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'de_participante_id' })
  deParticipante?: Participante;

  @Column('integer', { nullable: true, name: 'de_participante_id' })
  deParticipanteId?: number;

  @ManyToOne(() => Participante, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'para_participante_id' })
  paraParticipante?: Participante;

  @Column('integer', { nullable: true, name: 'para_participante_id' })
  paraParticipanteId?: number;

  // Campos para pagamentos entre grupos (tipo ENTRE_GRUPOS)
  @ManyToOne(() => GrupoParticipantesEvento, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'de_grupo_id' })
  grupoDevedor?: GrupoParticipantesEvento;

  @Column('integer', { nullable: true, name: 'de_grupo_id' })
  deGrupoId?: number;

  @ManyToOne(() => GrupoParticipantesEvento, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'para_grupo_id' })
  grupoCredor?: GrupoParticipantesEvento;

  @Column('integer', { nullable: true, name: 'para_grupo_id' })
  paraGrupoId?: number;

  // Nomes como referência (para exibição/histórico, não para matching)
  @Column('varchar', { length: 255, name: 'sugestao_de_nome' })
  sugestaoDeNome!: string;

  @Column('varchar', { length: 255, name: 'sugestao_para_nome' })
  sugestaoParaNome!: string;

  @Column('decimal', { precision: 10, scale: 2, name: 'sugestao_valor' })
  sugestaoValor!: number;

  @Column('integer', { name: 'sugestao_index' })
  sugestaoIndex!: number;

  @ManyToOne(() => Participante, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pago_por_participante_id' })
  pagoPor!: Participante;

  @Column('integer', { name: 'pago_por_participante_id' })
  pagoPorParticipanteId!: number;

  @ManyToOne(() => Participante, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'confirmado_por_participante_id' })
  confirmadoPor?: Participante;

  @Column('integer', { nullable: true, name: 'confirmado_por_participante_id' })
  confirmadoPorParticipanteId?: number;

  @Column('decimal', { precision: 10, scale: 2 })
  valor!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'data_pagamento' })
  dataPagamento!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'confirmado_em' })
  confirmadoEm?: Date;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;
}
