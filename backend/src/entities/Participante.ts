import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ParticipacaoDespesa } from './ParticipacaoDespesa';
import { Despesa } from './Despesa';
import { ParticipanteGrupo } from './ParticipanteGrupo';
import { Usuario } from './Usuario';

@Entity('participantes')
export class Participante {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Usuario, usuario => usuario.participantes)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column('integer')
  usuario_id!: number;

  @Column('varchar')
  nome!: string;

  @Column('varchar', { nullable: true })
  email?: string;

  @Column('varchar', { nullable: true })
  chavePix?: string;

  @CreateDateColumn()
  criadoEm!: Date;

  @OneToMany(() => ParticipacaoDespesa, participacao => participacao.participante)
  participacoes!: ParticipacaoDespesa[];

  @OneToMany(() => Despesa, despesa => despesa.pagador)
  despesasPagas!: Despesa[];

  @OneToMany(() => ParticipanteGrupo, participanteGrupo => participanteGrupo.participante)
  grupos!: ParticipanteGrupo[];
}

