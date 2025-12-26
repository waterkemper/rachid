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
  participantes?: ParticipanteGrupo[];
}

export interface ParticipanteGrupo {
  id: number;
  participante_id: number;
  grupo_id: number;
  participante?: Participante;
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
  de: string;
  para: string;
  valor: number;
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
  criadoEm: string;
  plano?: 'FREE' | 'PRO';
  planoValidoAte?: string | null;
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

