export interface Participante {
  id: number;
  nome: string;
  email?: string;
  chavePix?: string;
  telefone?: string;
  criadoEm: string;
}

export interface Grupo {
  id: number;
  nome: string;
  descricao?: string;
  data: string;
  criadoEm: string;
  status?: 'EM_ABERTO' | 'CONCLUIDO' | 'CANCELADO';
  usuario_id?: number;
  usuario?: Usuario;
  participantes?: ParticipanteGrupo[];
  totalDespesas?: number;
}

export interface ParticipanteGrupo {
  id: number;
  participante_id: number;
  grupo_id: number;
  participante?: Participante;
}

export interface DespesaAnexo {
  id: number;
  despesa_id: number;
  nome_original: string;
  nome_arquivo: string;
  tipo_mime: string;
  tamanho_original: number;
  tamanho_otimizado?: number;
  largura?: number;
  altura?: number;
  otimizado: boolean;
  url_s3: string;
  url_cloudfront: string;
  criado_em: string;
}

export interface Despesa {
  id: number;
  grupo_id: number;
  descricao: string;
  valorTotal: number;
  participante_pagador_id?: number;
  data: string;
  criadoEm: string;
  updatedAt?: string;
  updated_by?: number;
  grupo?: Grupo;
  pagador?: Participante;
  participacoes?: ParticipacaoDespesa[];
  anexos?: DespesaAnexo[];
}

export interface ParticipacaoDespesa {
  id: number;
  despesa_id: number;
  participante_id: number;
  valorDevePagar: number;
  participante?: Participante;
}

export interface SaldoParticipante {
  participanteId: number;
  participanteNome: string;
  totalPagou: number;
  totalDeve: number;
  saldo: number;
}

export interface SugestaoPagamento {
  de: string; // Nome - mantido para compatibilidade e exibição
  para: string; // Nome - mantido para compatibilidade e exibição
  valor: number;
  // IDs para identificação única (obrigatórios para matching)
  deParticipanteId?: number; // ID do participante devedor (se tipo INDIVIDUAL)
  paraParticipanteId?: number; // ID do participante credor (se tipo INDIVIDUAL)
  deGrupoId?: number; // ID do GrupoParticipantesEvento devedor (se tipo ENTRE_GRUPOS)
  paraGrupoId?: number; // ID do GrupoParticipantesEvento credor (se tipo ENTRE_GRUPOS)
  tipo?: 'INDIVIDUAL' | 'ENTRE_GRUPOS'; // Tipo da sugestão
  // Campos de status de pagamento (adicionados no RelatorioController)
  pago?: boolean; // se foi marcado como pago
  confirmado?: boolean; // se foi confirmado pelo credor
  pagamentoId?: number; // ID do registro de pagamento (se existir)
  pagoPor?: string; // nome de quem marcou como pago
  confirmadoPor?: string; // nome de quem confirmou
  dataPagamento?: string; // data/hora do pagamento
  dataConfirmacao?: string; // data/hora da confirmação
}

export interface GrupoParticipantesEvento {
  id: number;
  grupo_id: number;
  nome: string;
  descricao?: string;
  criadoEm: string;
  participantes?: ParticipanteGrupoEvento[];
}

export interface ParticipanteGrupoEvento {
  id: number;
  grupo_participantes_evento_id: number;
  participante_id: number;
  participante?: Participante;
}

export interface SaldoGrupo {
  grupoId: number;
  grupoNome: string;
  participantes: Array<{
    participanteId: number;
    participanteNome: string;
  }>;
  totalPagou: number;
  totalDeve: number;
  saldo: number;
}

export interface Usuario {
  id: number;
  email: string;
  nome: string;
  ddd?: string;
  telefone?: string;
  chavePix?: string;
  criadoEm: string;
  plano?: 'FREE' | 'PRO' | 'LIFETIME';
  planoValidoAte?: string | null;
  role?: 'USER' | 'ADMIN';
  auth_provider?: string;
  subscriptionId?: number;
}

export interface Subscription {
  id: number;
  usuarioId: number;
  paypalSubscriptionId?: string;
  paypalPayerId?: string;
  paymentMethod?: 'PIX' | 'CREDIT_CARD';
  planType: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialEnd?: string;
  nextBillingTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  name: string;
  price: number;
  currency: string;
  interval?: string;
  savings?: string;
  oneTime?: boolean;
}

export interface FeatureLimit {
  limitValue?: number | null;
  enabled?: boolean | null;
  description?: string;
}

export interface Usage {
  events: number;
}

export interface EventTemplate {
  id: string;
  nome: string;
  descricao: string;
  despesas: string[];
}

export interface DespesaHistorico {
  id: number;
  despesa_id: number;
  usuario_id: number;
  campo_alterado: string;
  valor_anterior?: string;
  valor_novo?: string;
  criadoEm: string;
  usuario?: Usuario;
}

// Tipos para gráficos
export interface GraficoPizzaPagador {
  label: string;
  value: number;
  percentage: number;
}

export interface PontoTemporal {
  data: string; // YYYY-MM-DD
  valor: number;
  quantidade: number;
}

export interface GraficoGastosParticipante {
  participanteId: number;
  participanteNome: string;
  totalPagou: number;
  totalDeve: number;
  saldo: number;
}

export interface TopDespesa {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  pagadorNome: string;
}

export interface GastosMensais {
  mes: string; // YYYY-MM
  ano: number;
  mesNumero: number;
  valor: number;
  quantidade: number;
}

export interface GastosPorEvento {
  eventoId: number;
  eventoNome: string;
  valor: number;
  quantidadeDespesas: number;
  dataEvento: string;
}

export interface DistribuicaoMensalPorEvento {
  mes: string; // YYYY-MM
  eventos: Array<{
    eventoId: number;
    eventoNome: string;
    valor: number;
  }>;
}

export interface SaldosEvolucao {
  data: string;
  participantes: Array<{
    participanteId: number;
    participanteNome: string;
    saldo: number;
  }>;
}

