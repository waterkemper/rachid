import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Subscription } from './Subscription';

export type FeatureKey = 'unlimited_events' | 'unlimited_participants' | 'pdf_export' | 'public_sharing' | 'templates' | 'email_notifications' | 'analytics';

@Entity('subscription_features')
export class SubscriptionFeature {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Subscription, subscription => subscription.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription!: Subscription;

  @Column('integer', { name: 'subscription_id' })
  subscriptionId!: number;

  @Column({ type: 'varchar', length: 50, name: 'feature_key' })
  featureKey!: FeatureKey;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ type: 'integer', nullable: true, name: 'limit_value' })
  limitValue?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}