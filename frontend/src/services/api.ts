import axios from 'axios';
import {
  Participante,
  Grupo,
  Despesa,
  SaldoParticipante,
  SugestaoPagamento,
  GrupoParticipantesEvento,
  SaldoGrupo,
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const participanteApi = {
  getAll: async (): Promise<Participante[]> => {
    const response = await api.get('/participantes');
    return response.data;
  },

  getById: async (id: number): Promise<Participante> => {
    const response = await api.get(`/participantes/${id}`);
    return response.data;
  },

  create: async (data: { nome: string; email?: string }): Promise<Participante> => {
    const response = await api.post('/participantes', data);
    return response.data;
  },

  update: async (id: number, data: { nome?: string; email?: string }): Promise<Participante> => {
    const response = await api.put(`/participantes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/participantes/${id}`);
  },
};

export const grupoApi = {
  getAll: async (): Promise<Grupo[]> => {
    const response = await api.get('/grupos');
    return response.data;
  },

  getById: async (id: number): Promise<Grupo> => {
    const response = await api.get(`/grupos/${id}`);
    return response.data;
  },

  create: async (data: {
    nome: string;
    descricao?: string;
    data?: string;
    participanteIds?: number[];
  }): Promise<Grupo> => {
    const response = await api.post('/grupos', data);
    return response.data;
  },

  update: async (id: number, data: {
    nome?: string;
    descricao?: string;
    data?: string;
  }): Promise<Grupo> => {
    const response = await api.put(`/grupos/${id}`, data);
    return response.data;
  },

  adicionarParticipante: async (grupoId: number, participanteId: number): Promise<void> => {
    await api.post(`/grupos/${grupoId}/participantes`, { participanteId });
  },

  removerParticipante: async (grupoId: number, participanteId: number): Promise<void> => {
    await api.delete(`/grupos/${grupoId}/participantes`, {
      data: { participanteId },
    });
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/grupos/${id}`);
  },
};

export const despesaApi = {
  getAll: async (grupoId?: number): Promise<Despesa[]> => {
    const params = grupoId ? { grupoId } : {};
    const response = await api.get('/despesas', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Despesa> => {
    const response = await api.get(`/despesas/${id}`);
    return response.data;
  },

  create: async (data: {
    grupo_id: number;
    descricao: string;
    valorTotal: number;
    participante_pagador_id: number;
    data?: string;
    participacoes?: Array<{
      participante_id: number;
      valorDevePagar: number;
    }>;
  }): Promise<Despesa> => {
    const response = await api.post('/despesas', data);
    return response.data;
  },

  update: async (id: number, data: Partial<{
    grupo_id: number;
    descricao: string;
    valorTotal: number;
    participante_pagador_id: number;
    data: string;
    participacoes?: Array<{
      participante_id: number;
      valorDevePagar: number;
    }>;
  }>): Promise<Despesa> => {
    const response = await api.put(`/despesas/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/despesas/${id}`);
  },
};

export const relatorioApi = {
  getSaldosGrupo: async (grupoId: number): Promise<SaldoParticipante[]> => {
    const response = await api.get(`/grupos/${grupoId}/saldos`);
    return response.data;
  },

  getSaldosPorGrupo: async (grupoId: number): Promise<SaldoGrupo[]> => {
    const response = await api.get(`/grupos/${grupoId}/saldos-por-grupo`);
    return response.data;
  },

  getSugestoesPagamento: async (grupoId: number): Promise<SugestaoPagamento[]> => {
    const response = await api.get(`/grupos/${grupoId}/sugestoes-pagamento`);
    return response.data;
  },

  getSugestoesPagamentoGrupos: async (grupoId: number): Promise<SugestaoPagamento[]> => {
    const response = await api.get(`/grupos/${grupoId}/sugestoes-pagamento-grupos`);
    return response.data;
  },
};

export const grupoParticipantesApi = {
  getAll: async (eventoId: number): Promise<GrupoParticipantesEvento[]> => {
    const response = await api.get(`/grupos/${eventoId}/grupos-participantes`);
    return response.data;
  },

  getById: async (eventoId: number, id: number): Promise<GrupoParticipantesEvento> => {
    const response = await api.get(`/grupos/${eventoId}/grupos-participantes/${id}`);
    return response.data;
  },

  create: async (eventoId: number, data: {
    nome: string;
    descricao?: string;
  }): Promise<GrupoParticipantesEvento> => {
    const response = await api.post(`/grupos/${eventoId}/grupos-participantes`, data);
    return response.data;
  },

  update: async (eventoId: number, id: number, data: {
    nome?: string;
    descricao?: string;
  }): Promise<GrupoParticipantesEvento> => {
    const response = await api.put(`/grupos/${eventoId}/grupos-participantes/${id}`, data);
    return response.data;
  },

  delete: async (eventoId: number, id: number): Promise<void> => {
    await api.delete(`/grupos/${eventoId}/grupos-participantes/${id}`);
  },

  adicionarParticipante: async (eventoId: number, grupoId: number, participanteId: number): Promise<void> => {
    await api.post(`/grupos/${eventoId}/grupos-participantes/${grupoId}/participantes`, { participanteId });
  },

  removerParticipante: async (eventoId: number, grupoId: number, participanteId: number): Promise<void> => {
    await api.delete(`/grupos/${eventoId}/grupos-participantes/${grupoId}/participantes/${participanteId}`);
  },
};

