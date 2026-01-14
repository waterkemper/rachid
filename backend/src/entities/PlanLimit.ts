import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

export type PlanLimitType = 'FREE' | 'PRO' | 'LIFETIME';
export type FeatureLimitKey = 'max_events' | 'max_participants_per_event' | 'pdf_export_enabled' | 'public_sharing_enabled' | 'templates_enabled' | 'email_notifications_enabled' | 'analytics_enabled';

@Entity('plan_limits')
@Unique(['planType', 'featureKey'])
export class PlanLimit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 20, name: 'plan_type' })
  @Index()
  planType!: PlanLimitType;

  @Column({ type: 'varchar', length: 50, name: 'feature_key' })
  @Index()
  featureKey!: FeatureLimitKey;

  @Column({ type: 'integer', nullable: true, name: 'limit_value' })
  limitValue?: number;

  @Column({ type: 'boolean', nullable: true })
  enabled?: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}