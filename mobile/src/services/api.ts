import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../constants/config';
import {
  Participante,
  Grupo,
  Despesa,
  SaldoParticipante,
  SugestaoPagamento,
  GrupoParticipantesEvento,
  SaldoGrupo,
  Usuario,
} from '../../shared/types';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao obter token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, senha: string): Promise<{ usuario: Usuario; token: string }> => {
    const response = await api.post('/auth/login', { email, senha });
    const token = response.data.token;
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
    return { usuario: response.data.usuario, token: token || '' };
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  },

  me: async (): Promise<Usuario> => {
    const response = await api.get('/auth/me');
    return response.data.usuario;
  },

  createUser: async (data: {
    nome: string;
    email: string;
    senha: string;
    ddd?: string;
    telefone?: string;
  }): Promise<Usuario> => {
    const response = await api.post('/auth/create-user', data);
    return response.data.usuario;
  },
};

export const participanteApi = {
  getAll: async (): Promise<Participante[]> => {
    const response = await api.get('/participantes');
    return response.data;
  },

  getById: async (id: number): Promise<Participante> => {
    const response = await api.get(`/participantes/${id}`);
    return response.data;
  },

  create: async (data: { nome: string; email?: string; chavePix?: string }): Promise<Participante> => {
    const response = await api.post('/participantes', data);
    return response.data;
  },

  update: async (id: number, data: { nome?: string; email?: string; chavePix?: string }): Promise<Participante> => {
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

  duplicar: async (id: number): Promise<Grupo> => {
    const response = await api.post(`/grupos/${id}/duplicar`);
    return response.data;
  },
};

export const despesaApi = {
  getAll: async (grupoId?: number): Promise<Despesa[]> => {
    const params = grupoId ? { grupoId } : {};
    const response = await api.get('/despesas', { params });
    const toNumber = (v: unknown): number => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = Number(v.replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };

    const normalizeDespesa = (d: any): Despesa => ({
      ...d,
      valorTotal: toNumber(d?.valorTotal),
      participacoes: Array.isArray(d?.participacoes)
        ? d.participacoes.map((p: any) => ({
            ...p,
            valorDevePagar: toNumber(p?.valorDevePagar),
          }))
        : d?.participacoes,
    });

    return Array.isArray(response.data) ? response.data.map(normalizeDespesa) : [];
  },

  getById: async (id: number): Promise<Despesa> => {
    const response = await api.get(`/despesas/${id}`);
    const toNumber = (v: unknown): number => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = Number(v.replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };
    const d: any = response.data;
    return {
      ...d,
      valorTotal: toNumber(d?.valorTotal),
      participacoes: Array.isArray(d?.participacoes)
        ? d.participacoes.map((p: any) => ({
            ...p,
            valorDevePagar: toNumber(p?.valorDevePagar),
          }))
        : d?.participacoes,
    };
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
    const toNumber = (v: unknown): number => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = Number(v.replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };
    const d: any = response.data;
    return {
      ...d,
      valorTotal: toNumber(d?.valorTotal),
      participacoes: Array.isArray(d?.participacoes)
        ? d.participacoes.map((p: any) => ({
            ...p,
            valorDevePagar: toNumber(p?.valorDevePagar),
          }))
        : d?.participacoes,
    };
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
    const toNumber = (v: unknown): number => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = Number(v.replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };
    const d: any = response.data;
    return {
      ...d,
      valorTotal: toNumber(d?.valorTotal),
      participacoes: Array.isArray(d?.participacoes)
        ? d.participacoes.map((p: any) => ({
            ...p,
            valorDevePagar: toNumber(p?.valorDevePagar),
          }))
        : d?.participacoes,
    };
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

export const participacaoApi = {
  toggle: async (despesaId: number, participanteId: number): Promise<void> => {
    await api.post(`/despesas/${despesaId}/participacoes`, { participanteId });
  },

  recalcular: async (despesaId: number): Promise<void> => {
    await api.post(`/despesas/${despesaId}/recalcular`);
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

export interface GrupoMaior {
  id: number;
  nome: string;
  descricao?: string;
  usuario_id: number;
  criadoEm: string;
  ultimoUsoEm?: string | null;
  grupos?: Array<{
    id: number;
    grupo_maior_id: number;
    grupo_id: number;
    grupo?: Grupo;
  }>;
  participantes?: Array<{
    id: number;
    grupo_maior_id: number;
    participante_id: number;
    participante?: Participante;
  }>;
}

export const grupoMaiorApi = {
  getAll: async (): Promise<GrupoMaior[]> => {
    const response = await api.get('/grupos-maiores');
    return response.data;
  },

  getRecentes: async (limit?: number): Promise<GrupoMaior[]> => {
    const response = await api.get('/grupos-maiores/recentes', {
      params: typeof limit === 'number' ? { limit } : undefined,
    });
    return response.data;
  },

  getById: async (id: number): Promise<GrupoMaior> => {
    const response = await api.get(`/grupos-maiores/${id}`);
    return response.data;
  },

  create: async (data: {
    nome: string;
    descricao?: string;
    grupoIds?: number[];
    participanteIds?: number[];
  }): Promise<GrupoMaior> => {
    const response = await api.post('/grupos-maiores', data);
    return response.data;
  },

  update: async (id: number, data: {
    nome?: string;
    descricao?: string;
  }): Promise<GrupoMaior> => {
    const response = await api.put(`/grupos-maiores/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/grupos-maiores/${id}`);
  },

  adicionarGrupo: async (id: number, grupoId: number): Promise<void> => {
    await api.post(`/grupos-maiores/${id}/grupos`, { grupoId });
  },

  removerGrupo: async (id: number, grupoId: number): Promise<void> => {
    await api.delete(`/grupos-maiores/${id}/grupos`, { data: { grupoId } });
  },

  adicionarParticipante: async (id: number, participanteId: number): Promise<void> => {
    await api.post(`/grupos-maiores/${id}/participantes`, { participanteId });
  },

  removerParticipante: async (id: number, participanteId: number): Promise<void> => {
    await api.delete(`/grupos-maiores/${id}/participantes/${participanteId}`);
  },

  obterTodosParticipantes: async (id: number): Promise<{ participanteIds: number[] }> => {
    const response = await api.get(`/grupos-maiores/${id}/participantes`);
    return response.data;
  },
};

