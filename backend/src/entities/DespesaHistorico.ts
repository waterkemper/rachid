import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Despesa } from './Despesa';
import { Usuario } from './Usuario';

@Entity('despesas_historico')
export class DespesaHistorico {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Despesa, despesa => despesa.historico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'despesa_id' })
  despesa!: Despesa;

  @Column('integer')
  despesa_id!: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column('integer')
  usuario_id!: number;

  @Column('varchar')
  campo_alterado!: string;

  @Column('text', { nullable: true })
  valor_anterior?: string;

  @Column('text', { nullable: true })
  valor_novo?: string;

  @CreateDateColumn()
  criadoEm!: Date;
}

