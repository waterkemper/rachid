import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GrupoMaior } from './GrupoMaior';
import { Participante } from './Participante';

@Entity('grupos_maiores_participantes')
export class GrupoMaiorParticipante {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => GrupoMaior, grupoMaior => grupoMaior.participantes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grupo_maior_id' })
  grupoMaior!: GrupoMaior;

  @Column('integer')
  grupo_maior_id!: number;

  @ManyToOne(() => Participante)
  @JoinColumn({ name: 'participante_id' })
  participante!: Participante;

  @Column('integer')
  participante_id!: number;
}
