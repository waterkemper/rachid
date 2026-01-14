import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Participante } from './Participante';
import { GrupoParticipantesEvento } from './GrupoParticipantesEvento';

@Entity('participantes_grupo_evento')
export class ParticipanteGrupoEvento {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => GrupoParticipantesEvento, grupo => grupo.participantes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grupo_participantes_evento_id' })
  grupoParticipantes!: GrupoParticipantesEvento;

  @Column('integer', { name: 'grupo_participantes_evento_id' })
  grupoParticipantesEventoId!: number;

  @ManyToOne(() => Participante)
  @JoinColumn({ name: 'participante_id' })
  participante!: Participante;

  @Column('integer', { name: 'participante_id' })
  participanteId!: number;
}

