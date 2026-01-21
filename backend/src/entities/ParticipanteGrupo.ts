import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Participante } from './Participante';
import { Grupo } from './Grupo';

@Entity('participantes_grupos')
export class ParticipanteGrupo {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Participante, participante => participante.grupos)
  @JoinColumn({ name: 'participante_id' })
  participante!: Participante;

  @Column('integer', { name: 'participante_id' })
  participanteId!: number;

  @ManyToOne(() => Grupo, grupo => grupo.participantes)
  @JoinColumn({ name: 'grupo_id' })
  grupo!: Grupo;

  @Column('integer', { name: 'grupo_id' })
  grupoId!: number;
}

