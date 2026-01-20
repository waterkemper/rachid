import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

export type PlanType = 'MONTHLY' | 'YEARLY' | 'LIFETIME';

@Entity('plans')
@Unique(['planType'])
export class Plan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 20, name: 'plan_type', unique: true })
  @Index()
  planType!: PlanType;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price' })
  price!: number;

  @Column({ type: 'varchar', length: 3, default: 'BRL' })
  currency!: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'interval_unit' })
  intervalUnit?: 'month' | 'year';

  @Column({ type: 'integer', nullable: true, default: 1, name: 'interval_count' })
  intervalCount?: number;

  @Column({ type: 'integer', nullable: true, default: 0, name: 'trial_days' })
  trialDays?: number; // Trial period in days (0 = no trial, default 7 days)

  @Column({ type: 'boolean', default: false, name: 'is_one_time' })
  isOneTime!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true, name: 'paypal_plan_id' })
  paypalPlanId?: string;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ type: 'integer', default: 0, name: 'display_order' })
  displayOrder!: number;

  @Column({ type: 'jsonb', nullable: true })
  features?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
