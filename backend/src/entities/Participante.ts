import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ParticipacaoDespesa } from './ParticipacaoDespesa';
import { Despesa } from './Despesa';
import { ParticipanteGrupo } from './ParticipanteGrupo';

@Entity('participantes')
export class Participante {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar')
  nome!: string;

  @Column('varchar', { nullable: true })
  email?: string;

  @CreateDateColumn()
  criadoEm!: Date;

  @OneToMany(() => ParticipacaoDespesa, participacao => participacao.participante)
  participacoes!: ParticipacaoDespesa[];

  @OneToMany(() => Despesa, despesa => despesa.pagador)
  despesasPagas!: Despesa[];

  @OneToMany(() => ParticipanteGrupo, participanteGrupo => participanteGrupo.participante)
  grupos!: ParticipanteGrupo[];
}

