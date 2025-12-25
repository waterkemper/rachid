import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Participante } from './Participante';
import { Grupo } from './Grupo';
import { Despesa } from './Despesa';

export type PlanoUsuario = 'FREE' | 'PRO';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar', { unique: true })
  email!: string;

  @Column('varchar', { nullable: true })
  senha?: string;

  @Column('varchar', { nullable: true, unique: true })
  google_id?: string;

  @Column('varchar', { default: 'local' })
  auth_provider!: string;

  @Column('varchar')
  nome!: string;

  @Column('varchar', { nullable: true })
  ddd?: string;

  @Column('varchar', { nullable: true })
  telefone?: string;

  @Column('varchar', { default: 'FREE' })
  plano!: PlanoUsuario;

  @Column({ type: 'timestamp', nullable: true })
  planoValidoAte?: Date;

  @CreateDateColumn()
  criadoEm!: Date;

  @OneToMany(() => Participante, participante => participante.usuario)
  participantes!: Participante[];

  @OneToMany(() => Grupo, grupo => grupo.usuario)
  grupos!: Grupo[];

  @OneToMany(() => Despesa, despesa => despesa.usuario)
  despesas!: Despesa[];
}

