import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Grupo } from './Grupo';
import { Participante } from './Participante';
import { ParticipacaoDespesa } from './ParticipacaoDespesa';
import { Usuario } from './Usuario';
import { DespesaHistorico } from './DespesaHistorico';

@Entity('despesas')
export class Despesa {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Usuario, usuario => usuario.despesas)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column('integer')
  usuario_id!: number;

  @ManyToOne(() => Grupo, grupo => grupo.despesas)
  @JoinColumn({ name: 'grupo_id' })
  grupo!: Grupo;

  @Column('integer')
  grupo_id!: number;

  @Column('varchar')
  descricao!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  valorTotal!: number;

  @ManyToOne(() => Participante, participante => participante.despesasPagas)
  @JoinColumn({ name: 'participante_pagador_id' })
  pagador?: Participante;

  @Column('integer', { nullable: true })
  participante_pagador_id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data!: Date;

  @CreateDateColumn()
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy?: Usuario;

  @Column('integer', { nullable: true })
  updated_by?: number;

  @OneToMany(() => ParticipacaoDespesa, participacao => participacao.despesa, { cascade: true })
  participacoes!: ParticipacaoDespesa[];

  @OneToMany(() => DespesaHistorico, historico => historico.despesa)
  historico!: DespesaHistorico[];
}

