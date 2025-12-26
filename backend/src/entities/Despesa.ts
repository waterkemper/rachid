import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Grupo } from './Grupo';
import { Participante } from './Participante';
import { ParticipacaoDespesa } from './ParticipacaoDespesa';
import { Usuario } from './Usuario';

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

  @OneToMany(() => ParticipacaoDespesa, participacao => participacao.despesa, { cascade: true })
  participacoes!: ParticipacaoDespesa[];
}

