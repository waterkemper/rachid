import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Despesa } from './Despesa';

@Entity('despesa_anexos')
export class DespesaAnexo {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Despesa)
  @JoinColumn({ name: 'despesa_id' })
  despesa!: Despesa;

  @Column('integer')
  @Index()
  despesa_id!: number;

  @Column('varchar', { length: 255 })
  nome_original!: string;

  @Column('varchar', { length: 255 })
  nome_arquivo!: string; // Nome no S3

  @Column('varchar', { length: 100 })
  tipo_mime!: string;

  @Column('bigint')
  tamanho_original!: number; // bytes do arquivo original

  @Column('bigint', { nullable: true })
  tamanho_otimizado?: number; // bytes após otimização

  @Column('integer', { nullable: true })
  largura?: number; // largura da imagem (se for imagem)

  @Column('integer', { nullable: true })
  altura?: number; // altura da imagem (se for imagem)

  @Column('boolean', { default: false })
  otimizado!: boolean; // indica se foi otimizado

  @Column('text')
  url_s3!: string; // URL direta do S3

  @Column('text')
  url_cloudfront!: string; // URL via CloudFront CDN

  @Column('integer')
  @Index()
  usuario_id!: number;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;
}
