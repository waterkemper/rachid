import axios from 'axios';
import {
  Participante,
  Grupo,
  Despesa,
  SaldoParticipante,
  SugestaoPagamento,
  GrupoParticipantesEvento,
  SaldoGrupo,
  Usuario,
} from '../types';

// URL da API: usa variável de ambiente em produção ou proxy em desenvolvimento
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://api.orachid.com.br');

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api', // Se API_URL estiver definida, usa ela, senão usa proxy do Vite
  withCredentials: true, // Importante para enviar cookies
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Não redirecionar se já estiver na página de login
      // Não redirecionar se a requisição for para /auth/me (verificação de autenticação)
      const url = error.config?.url || '';
      const path = window.location.pathname;
      const isPublicPage = path === '/login' || path === '/cadastro' || path === '/home' || path === '/';
      const isAuthMe = url.includes('/auth/me');
      
      if (!isPublicPage && !isAuthMe) {
        // Token inválido ou expirado - redirecionar apenas se não estiver em página pública
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, senha: string): Promise<Usuario> => {
    const response = await api.post('/auth/login', { email, senha });
    return response.data.usuario;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
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

  solicitarRecuperacaoSenha: async (email: string): Promise<void> => {
    await api.post('/auth/solicitar-recuperacao-senha', { email });
  },

  validarTokenRecuperacao: async (token: string): Promise<boolean> => {
    const response = await api.post('/auth/validar-token-recuperacao', { token });
    return response.data.valido;
  },

  resetarSenha: async (token: string, senha: string): Promise<void> => {
    await api.post('/auth/resetar-senha', { token, senha });
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

  create: async (data: { nome: string; email?: string; chavePix?: string; telefone?: string }): Promise<Participante> => {
    const response = await api.post('/participantes', data);
    return response.data;
  },

  update: async (id: number, data: { nome?: string; email?: string; chavePix?: string; telefone?: string }): Promise<Participante> => {
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

export const analyticsApi = {
  track: async (event: string, props?: Record<string, any>): Promise<void> => {
    await api.post('/analytics/event', { event, props });
  },
};

