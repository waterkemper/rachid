import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Usuario } from './Usuario';
import { Grupo } from './Grupo';
import { Despesa } from './Despesa';

export type EmailStatus = 'pendente' | 'enviando' | 'enviado' | 'falhou' | 'cancelado';
export type EmailTipo = 
  | 'boas-vindas'
  | 'boas-vindas-google'
  | 'recuperacao-senha'
  | 'senha-alterada'
  | 'nova-despesa'
  | 'despesa-editada'
  | 'inclusao-evento'
  | 'participante-adicionado-despesa'
  | 'mudanca-saldo'
  | 'evento-finalizado'
  | 'reativacao-sem-evento'
  | 'reativacao-sem-participantes'
  | 'reativacao-sem-despesas'
  | 'resumo-atualizacoes'
  | 'pagamento-falho'
  | 'assinatura-suspensa'
  | 'assinatura-expirada'
  | 'vencimento-proximo';

@Entity('emails')
@Index(['destinatario'])
@Index(['status'])
@Index(['tipoEmail'])
@Index(['usuarioId'])
@Index(['eventoId'])
@Index(['despesaId'])
@Index(['enviadoEm'])
@Index(['criadoEm'])
@Index(['sendgridMessageId'])
export class Email {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar', { length: 255 })
  destinatario!: string;

  @Column('varchar', { length: 500 })
  assunto!: string;

  @Column('varchar', { length: 50, name: 'tipo_email' })
  tipoEmail!: EmailTipo;

  @Column('varchar', { length: 20, default: 'pendente' })
  status!: EmailStatus;

  // Relacionamentos opcionais
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;

  @Column('integer', { nullable: true, name: 'usuario_id' })
  usuarioId?: number;

  @ManyToOne(() => Grupo, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'evento_id' })
  evento?: Grupo;

  @Column('integer', { nullable: true, name: 'evento_id' })
  eventoId?: number;

  @ManyToOne(() => Despesa, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'despesa_id' })
  despesa?: Despesa;

  @Column('integer', { nullable: true, name: 'despesa_id' })
  despesaId?: number;

  // Metadados do email
  @Column('text', { nullable: true, name: 'corpo_html' })
  corpoHtml?: string;

  @Column('text', { nullable: true, name: 'corpo_texto' })
  corpoTexto?: string;

  @Column('varchar', { length: 255, nullable: true, name: 'remetente_email' })
  remetenteEmail?: string;

  @Column('varchar', { length: 255, nullable: true, name: 'remetente_nome' })
  remetenteNome?: string;

  // Tracking e erros
  @Column({ type: 'timestamp', nullable: true, name: 'enviado_em' })
  enviadoEm?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'falhou_em' })
  falhouEm?: Date;

  @Column('integer', { default: 0 })
  tentativas!: number;

  @Column('text', { nullable: true, name: 'erro_message' })
  erroMessage?: string;

  @Column('jsonb', { nullable: true, name: 'erro_detalhes' })
  erroDetalhes?: any;

  // Metadados do SendGrid
  @Column('varchar', { length: 255, nullable: true, name: 'sendgrid_message_id' })
  sendgridMessageId?: string;

  @Column('jsonb', { nullable: true, name: 'sendgrid_response' })
  sendgridResponse?: any;

  // Timestamps
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm!: Date;
}
