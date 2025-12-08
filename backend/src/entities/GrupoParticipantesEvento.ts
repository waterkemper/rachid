import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Grupo } from './Grupo';
import { ParticipanteGrupoEvento } from './ParticipanteGrupoEvento';

@Entity('grupos_participantes_evento')
export class GrupoParticipantesEvento {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Grupo)
  @JoinColumn({ name: 'grupo_id' })
  grupo!: Grupo;

  @Column('integer')
  grupo_id!: number;

  @Column('varchar')
  nome!: string;

  @Column('text', { nullable: true })
  descricao?: string;

  @CreateDateColumn()
  criadoEm!: Date;

  @OneToMany(() => ParticipanteGrupoEvento, participanteGrupo => participanteGrupo.grupoParticipantes)
  participantes!: ParticipanteGrupoEvento[];
}

