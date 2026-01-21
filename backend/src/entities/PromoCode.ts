import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('promo_codes')
@Unique(['code'])
export class PromoCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar', { unique: true, length: 50 })
  @Index()
  code!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'discount_percent' })
  discountPercent?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'valid_from' })
  validFrom?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'valid_until' })
  validUntil?: Date;

  @Column({ type: 'integer', default: 0, name: 'max_uses' })
  maxUses!: number;

  @Column({ type: 'integer', default: 0, name: 'current_uses' })
  currentUses!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'min_amount' })
  minAmount?: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}