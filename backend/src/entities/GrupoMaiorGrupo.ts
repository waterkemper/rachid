import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GrupoMaior } from './GrupoMaior';
import { Grupo } from './Grupo';

@Entity('grupos_maiores_grupos')
export class GrupoMaiorGrupo {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => GrupoMaior, grupoMaior => grupoMaior.grupos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grupo_maior_id' })
  grupoMaior!: GrupoMaior;

  @Column('integer')
  grupo_maior_id!: number;

  @ManyToOne(() => Grupo)
  @JoinColumn({ name: 'grupo_id' })
  grupo!: Grupo;

  @Column('integer')
  grupo_id!: number;
}
