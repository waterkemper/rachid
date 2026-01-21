import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from './Usuario';
import { Grupo } from './Grupo';
import { Email } from './Email';

// Tipos de notificação que podem ser agregadas
// Simplificado: resumo-evento substitui nova-despesa, despesa-editada, mudanca-saldo
export type TipoNotificacao = 
  | 'inclusao-evento'
  | 'resumo-evento'
  | 'evento-finalizado';

// Dados específicos por tipo de notificação
export interface DadosNotificacao {
  // Comum
  eventoNome?: string;
  eventoId?: number;
  nomeDestinatario?: string;
  linkEvento?: string;
  
  // Nova despesa / Despesa editada
  despesaId?: number;
  despesaDescricao?: string;
  despesaValorTotal?: string;
  despesaData?: string;
  mudancas?: string[];
  
  // Mudança de saldo
  saldoAtual?: string;
  direcao?: 'aumentou' | 'diminuiu';
  diferenca?: string;
  
  // Inclusão em evento
  criadoPor?: string;
  linkEventoPublico?: string;
}

@Entity('email_pendentes')
@Index(['processado', 'processarApos'])
@Index(['destinatario', 'eventoId', 'processado'])
@Index(['tipoNotificacao', 'processado'])
export class EmailPendente {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar', { length: 255 })
  destinatario!: string;

  @Column('integer', { nullable: true, name: 'usuario_id' })
  usuarioId?: number;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;

  @Column('integer', { nullable: true, name: 'evento_id' })
  eventoId?: number;

  @ManyToOne(() => Grupo, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evento_id' })
  evento?: Grupo;

  @Column('varchar', { length: 50, name: 'tipo_notificacao' })
  tipoNotificacao!: TipoNotificacao;

  @Column('jsonb', { default: {} })
  dados!: DadosNotificacao;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @Column('timestamp with time zone', { name: 'processar_apos' })
  processarApos!: Date;

  @Column('boolean', { default: false })
  processado!: boolean;

  @Column('timestamp with time zone', { nullable: true, name: 'processado_em' })
  processadoEm?: Date;

  @Column('integer', { nullable: true, name: 'email_enviado_id' })
  emailEnviadoId?: number;

  @ManyToOne(() => Email, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'email_enviado_id' })
  emailEnviado?: Email;
}
