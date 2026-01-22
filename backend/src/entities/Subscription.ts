import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from './Usuario';
import { SubscriptionHistory } from './SubscriptionHistory';
import { SubscriptionFeature } from './SubscriptionFeature';

export type PlanType = 'MONTHLY' | 'YEARLY' | 'LIFETIME';
export type SubscriptionStatus = 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Usuario, usuario => usuario.subscription)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column('integer', { name: 'usuario_id' })
  usuarioId!: number;

  @Column('varchar', { nullable: true, unique: true, name: 'asaas_subscription_id' })
  asaasSubscriptionId?: string;

  @Column('varchar', { nullable: true, name: 'asaas_customer_id' })
  asaasCustomerId?: string;

  @Column('varchar', { nullable: true, name: 'asaas_payment_id' })
  asaasPaymentId?: string;

  @Column('varchar', { nullable: true, name: 'payment_method' })
  paymentMethod?: 'PIX' | 'CREDIT_CARD';

  @Column('integer', { nullable: true, name: 'installment_count' })
  installmentCount?: number;

  @Column({ type: 'varchar', length: 20, name: 'plan_type' })
  planType!: PlanType;

  @Column({ type: 'varchar', length: 20, default: 'APPROVAL_PENDING', name: 'status' })
  status!: SubscriptionStatus;

  @Column({ type: 'timestamp', name: 'current_period_start' })
  currentPeriodStart!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'current_period_end' })
  currentPeriodEnd?: Date;

  @Column({ type: 'boolean', default: false, name: 'cancel_at_period_end' })
  cancelAtPeriodEnd!: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'canceled_at' })
  canceledAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'trial_end' })
  trialEnd?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'next_billing_time' })
  nextBillingTime?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => SubscriptionHistory, history => history.subscription)
  history!: SubscriptionHistory[];

  @OneToMany(() => SubscriptionFeature, feature => feature.subscription)
  features!: SubscriptionFeature[];
}