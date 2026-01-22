import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Participante } from './Participante';
import { Grupo } from './Grupo';
import { Despesa } from './Despesa';
import { Subscription } from './Subscription';

export type PlanoUsuario = 'FREE' | 'PRO' | 'LIFETIME';
export type RoleUsuario = 'USER' | 'ADMIN';

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

  @Column('varchar', { nullable: true, name: 'cpf_cnpj' })
  cpfCnpj?: string;

  @Column('varchar', { nullable: true, name: 'chavepix' })
  chavePix?: string;

  @Column('varchar', { default: 'FREE' })
  plano!: PlanoUsuario;

  @Column({ type: 'timestamp', nullable: true })
  planoValidoAte?: Date;

  @Column('varchar', { nullable: true, unique: true, name: 'paypal_payer_id' })
  paypalPayerId?: string;

  @OneToOne(() => Subscription, subscription => subscription.usuario, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: Subscription;

  @Column('integer', { nullable: true, name: 'subscription_id' })
  subscriptionId?: number;

  @Column('varchar', { default: 'USER' })
  role!: RoleUsuario;

  @Column({ type: 'timestamp', nullable: true, name: 'ultimo_email_reativacao_sem_evento' })
  ultimoEmailReativacaoSemEvento?: Date;

  @Column({ type: 'integer', default: 0, name: 'tentativa_email_reativacao_sem_evento' })
  tentativaEmailReativacaoSemEvento!: number;

  @Column({ type: 'boolean', default: true, name: 'receber_emails' })
  receberEmails!: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'email_opt_out_data' })
  emailOptOutData?: Date;

  @Column({ type: 'varchar', nullable: true, length: 255, name: 'email_opt_out_reason' })
  emailOptOutReason?: string;

  @CreateDateColumn()
  criadoEm!: Date;

  @OneToMany(() => Participante, participante => participante.usuario)
  participantes!: Participante[];

  @OneToMany(() => Grupo, grupo => grupo.usuario)
  grupos!: Grupo[];

  @OneToMany(() => Despesa, despesa => despesa.usuario)
  despesas!: Despesa[];
}

