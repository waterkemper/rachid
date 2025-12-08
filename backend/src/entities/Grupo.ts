import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Despesa } from './Despesa';
import { ParticipanteGrupo } from './ParticipanteGrupo';

@Entity('grupos')
export class Grupo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar')
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  data!: Date;

  @CreateDateColumn()
  criadoEm!: Date;

  @OneToMany(() => Despesa, despesa => despesa.grupo)
  despesas!: Despesa[];

  @OneToMany(() => ParticipanteGrupo, participanteGrupo => participanteGrupo.grupo)
  participantes!: ParticipanteGrupo[];
}

