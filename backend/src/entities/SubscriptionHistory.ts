import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Subscription } from './Subscription';

export type EventType = 'created' | 'updated' | 'canceled' | 'renewed' | 'payment_failed' | 'refunded' | 'suspended' | 'activated';

@Entity('subscription_history')
export class SubscriptionHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Subscription, subscription => subscription.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription!: Subscription;

  @Column('integer', { name: 'subscription_id' })
  subscriptionId!: number;

  @Column({ type: 'varchar', length: 50, name: 'event_type' })
  eventType!: EventType;

  @Column({ type: 'jsonb', nullable: true, name: 'old_value' })
  oldValue?: any;

  @Column({ type: 'jsonb', nullable: true, name: 'new_value' })
  newValue?: any;

  @Column('varchar', { nullable: true, unique: true, name: 'paypal_event_id' })
  paypalEventId?: string;

  @Column('varchar', { nullable: true, name: 'paypal_resource_id' })
  paypalResourceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}