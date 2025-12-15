import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Usuario } from './Usuario';
import { GrupoMaiorGrupo } from './GrupoMaiorGrupo';
import { GrupoMaiorParticipante } from './GrupoMaiorParticipante';

@Entity('grupos_maiores')
export class GrupoMaior {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column('integer')
  usuario_id!: number;

  @Column('varchar')
  nome!: string;

  @Column('text', { nullable: true })
  descricao?: string;

  @CreateDateColumn()
  criadoEm!: Date;

  @Column({ type: 'timestamp', nullable: true })
  ultimoUsoEm?: Date;

  @OneToMany(() => GrupoMaiorGrupo, grupoMaiorGrupo => grupoMaiorGrupo.grupoMaior)
  grupos!: GrupoMaiorGrupo[];

  @OneToMany(() => GrupoMaiorParticipante, grupoMaiorParticipante => grupoMaiorParticipante.grupoMaior)
  participantes!: GrupoMaiorParticipante[];
}
