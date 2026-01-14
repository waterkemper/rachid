import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Despesa } from './Despesa';
import { ParticipanteGrupo } from './ParticipanteGrupo';
import { Usuario } from './Usuario';
import { Pagamento } from './Pagamento';

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

  @Column({ type: 'varchar', length: 20, default: 'EM_ABERTO', name: 'status' })
  status!: 'EM_ABERTO' | 'CONCLUIDO' | 'CANCELADO';

  @Column({ type: 'timestamp', nullable: true, name: 'ultimo_email_reativacao_sem_participantes' })
  ultimoEmailReativacaoSemParticipantes?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'ultimo_email_reativacao_sem_despesas' })
  ultimoEmailReativacaoSemDespesas?: Date;

  @Column({ type: 'integer', default: 0, name: 'tentativa_email_reativacao_sem_participantes' })
  tentativaEmailReativacaoSemParticipantes!: number;

  @Column({ type: 'integer', default: 0, name: 'tentativa_email_reativacao_sem_despesas' })
  tentativaEmailReativacaoSemDespesas!: number;

  @OneToMany(() => Despesa, despesa => despesa.grupo)
  despesas!: Despesa[];

  @OneToMany(() => ParticipanteGrupo, participanteGrupo => participanteGrupo.grupo)
  participantes!: ParticipanteGrupo[];

  @OneToMany(() => Pagamento, pagamento => pagamento.grupo)
  pagamentos!: Pagamento[];
}

