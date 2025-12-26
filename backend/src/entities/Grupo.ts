import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Despesa } from './Despesa';
import { ParticipanteGrupo } from './ParticipanteGrupo';
import { Usuario } from './Usuario';

@Entity('grupos')
export class Grupo {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Usuario, usuario => usuario.grupos)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column('integer')
  usuario_id!: number;

  @Column('varchar')
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data!: Date;

  @CreateDateColumn()
  criadoEm!: Date;

  @Column({ type: 'varchar', nullable: true, unique: true, name: 'share_token' })
  shareToken?: string;

  @OneToMany(() => Despesa, despesa => despesa.grupo)
  despesas!: Despesa[];

  @OneToMany(() => ParticipanteGrupo, participanteGrupo => participanteGrupo.grupo)
  participantes!: ParticipanteGrupo[];
}

