import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../constants/config';
import {
  Participante,
  Grupo,
  Despesa,
  DespesaAnexo,
  SaldoParticipante,
  SugestaoPagamento,
  GrupoParticipantesEvento,
  SaldoGrupo,
  Usuario,
  EventTemplate,
  EventoPublico,
} from '../../shared/types';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

if (__DEV__) {
  console.log('🔧 API URL configurada:', API_URL);
}

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (__DEV__) {
        console.log('📤 REQUEST:', config.method?.toUpperCase(), config.url);
        if (config.data) {
          console.log('Request Data:', JSON.stringify(config.data, null, 2));
        }
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
  (response) => {
    if (__DEV__) {
      console.log('✅ RESPONSE:', response.status, response.config.url);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
    }
    return response;
  },
  (error: AxiosError) => {
    if (__DEV__) {
      console.error('❌ ERROR:', error.response?.status, error.config?.url);
      console.error('Error Data:', error.response?.data);
      if (error.message) {
        console.error('Error Message:', error.message);
      }
    }
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

  loginWithGoogle: async (tokenId: string): Promise<{ usuario: Usuario; token: string }> => {
    const response = await api.post('/auth/google', { tokenId });
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

  updateUser: async (data: {
    nome?: string;
    email?: string;
    ddd?: string;
    telefone?: string;
  }): Promise<Usuario> => {
    const response = await api.put('/auth/me', data);
    return response.data.usuario;
  },

  getEmailPreferences: async (): Promise<{
    receberEmails: boolean;
    emailOptOutData?: string | null;
    emailOptOutReason?: string | null;
  }> => {
    const response = await api.get('/auth/email-preferences');
    return response.data;
  },

  updateEmailPreferences: async (data: {
    receberEmails: boolean;
    emailOptOutReason?: string;
  }): Promise<{ message: string; receberEmails: boolean }> => {
    const response = await api.put('/auth/email-preferences', data);
    return response.data;
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
    templateId?: string;
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

  gerarLink: async (id: number): Promise<{ token: string; link: string }> => {
    const response = await api.post(`/grupos/${id}/gerar-link`);
    return response.data;
  },

  obterLink: async (id: number): Promise<{ token: string | null; link: string | null }> => {
    const response = await api.get(`/grupos/${id}/link`);
    return response.data;
  },

  updateStatus: async (id: number, status: 'EM_ABERTO' | 'CONCLUIDO' | 'CANCELADO'): Promise<Grupo> => {
    const response = await api.put(`/grupos/${id}/status`, { status });
    return response.data;
  },
};

export interface Pagamento {
  id: number;
  grupoId: number;
  tipo: 'INDIVIDUAL' | 'ENTRE_GRUPOS';
  deParticipanteId?: number;
  paraParticipanteId?: number;
  deGrupoId?: number;
  paraGrupoId?: number;
  valor: number;
  pagoPorParticipanteId: number;
  confirmadoPorParticipanteId?: number | null;
  confirmadoEm?: string | null;
  criadoEm: string;
}

export const pagamentoApi = {
  getPorEvento: async (grupoId: number, tipo?: 'INDIVIDUAL' | 'ENTRE_GRUPOS'): Promise<Pagamento[]> => {
    const params = tipo ? { tipo } : {};
    const response = await api.get(`/grupos/${grupoId}/pagamentos`, { params });
    return response.data;
  },

  marcarComoPago: async (grupoId: number, body: {
    sugestaoIndex: number;
    deParticipanteId: number;
    paraParticipanteId: number;
    sugestaoValor: number;
    pagoPorParticipanteId: number;
    valor: number;
    deNome?: string;
    paraNome?: string;
  }): Promise<Pagamento> => {
    const response = await api.post(`/grupos/${grupoId}/pagamentos`, body);
    return response.data;
  },

  marcarComoPagoEntreGrupos: async (grupoId: number, body: {
    sugestaoIndex: number;
    deGrupoId: number;
    paraGrupoId: number;
    sugestaoValor: number;
    pagoPorParticipanteId: number;
    valor: number;
    deNome?: string;
    paraNome?: string;
  }): Promise<Pagamento> => {
    const response = await api.post(`/grupos/${grupoId}/pagamentos-grupos`, body);
    return response.data;
  },

  confirmar: async (pagamentoId: number, confirmadoPorParticipanteId: number): Promise<Pagamento> => {
    const response = await api.put(`/pagamentos/${pagamentoId}/confirmar`, { confirmadoPorParticipanteId });
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
    participante_pagador_id?: number;
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
    participante_pagador_id?: number;
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

  listAnexos: async (despesaId: number): Promise<DespesaAnexo[]> => {
    const response = await api.get(`/despesas/${despesaId}/anexos`);
    return response.data;
  },

  uploadAnexo: async (despesaId: number, file: { uri: string; name?: string; type?: string }): Promise<DespesaAnexo> => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name || 'anexo',
      type: file.type || 'image/jpeg',
    } as any);
    const response = await api.post(`/despesas/${despesaId}/anexos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteAnexo: async (despesaId: number, anexoId: number): Promise<void> => {
    await api.delete(`/despesas/${despesaId}/anexos/${anexoId}`);
  },

  getDownloadUrl: async (despesaId: number, anexoId: number): Promise<string> => {
    const response = await api.get(`/despesas/${despesaId}/anexos/${anexoId}/download`);
    return response.data.url;
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

export const templateApi = {
  getAll: async (): Promise<EventTemplate[]> => {
    const response = await api.get('/templates');
    return response.data;
  },

  getById: async (id: string): Promise<EventTemplate> => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },
};

/** API pública de eventos (sem autenticação) */
export const publicEventoApi = {
  getByToken: async (token: string): Promise<EventoPublico> => {
    const response = await api.get(`/public/eventos/${token}`);
    return response.data;
  },
  getSaldos: async (token: string): Promise<SaldoParticipante[]> => {
    const response = await api.get(`/public/eventos/${token}/saldos`);
    return response.data;
  },
  getSaldosPorGrupo: async (token: string): Promise<SaldoGrupo[]> => {
    const response = await api.get(`/public/eventos/${token}/saldos-por-grupo`);
    return response.data;
  },
  getSugestoes: async (token: string): Promise<SugestaoPagamento[]> => {
    const response = await api.get(`/public/eventos/${token}/sugestoes`);
    return response.data;
  },
  getDespesas: async (token: string): Promise<Despesa[]> => {
    const response = await api.get(`/public/eventos/${token}/despesas`);
    return response.data;
  },
  getAnexos: async (token: string, despesaId: number): Promise<DespesaAnexo[]> => {
    const response = await api.get(`/public/eventos/${token}/despesas/${despesaId}/anexos`);
    return response.data;
  },
  reivindicar: async (token: string, email: string): Promise<{ message: string; transferidos: number }> => {
    const response = await api.post(`/public/eventos/${token}/reivindicar`, { email });
    return response.data;
  },
};

export interface Plan {
  id: string;
  name: string;
  type: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  price: number;
  priceFormatted?: string;
  features?: string[];
}

export interface Subscription {
  id: number;
  planType: string;
  status: string;
  validUntil?: string | null;
  cancelledAt?: string | null;
}

export interface Usage {
  eventos?: number;
  participantes?: number;
  anexos?: number;
  [key: string]: number | undefined;
}

export const subscriptionApi = {
  getPlans: async (): Promise<{ plans: Record<string, Plan> }> => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },
  getMe: async (): Promise<{ subscription: Subscription | null; limits: Record<string, unknown>; usage: Usage }> => {
    const response = await api.get('/subscriptions/me');
    return response.data;
  },
  getUsage: async (): Promise<Usage> => {
    const response = await api.get('/subscriptions/usage');
    return response.data;
  },
  create: async (data: {
    planType: 'MONTHLY' | 'YEARLY';
    paymentMethod: 'PIX' | 'CREDIT_CARD';
    userCpfCnpj?: string;
  }): Promise<{
    subscriptionId: number;
    asaasSubscriptionId: string;
    pixQrCode?: { encodedImage: string; payload: string; expirationDate: string };
    status: string;
  }> => {
    const response = await api.post('/subscriptions', data);
    return response.data;
  },
  activate: async (data: {
    subscriptionId?: number;
    payerId?: string;
    subscription_id?: string;
    ba_token?: string;
    subscription_token?: string;
  }): Promise<{ subscription: Subscription; message: string }> => {
    const response = await api.post('/subscriptions/activate', data);
    return response.data;
  },
  cancel: async (id: number, immediately?: boolean): Promise<{ subscription: Subscription; message: string }> => {
    const response = await api.post(`/subscriptions/${id}/cancel`, { immediately });
    return response.data;
  },
  resume: async (id: number): Promise<{ subscription: Subscription; message: string }> => {
    const response = await api.post(`/subscriptions/${id}/resume`);
    return response.data;
  },
  createLifetime: async (data: {
    paymentMethod: 'PIX' | 'CREDIT_CARD';
    userCpfCnpj?: string;
    installmentCount?: number;
  }): Promise<{ subscriptionId: number; pixQrCode?: { encodedImage: string; payload: string }; status: string }> => {
    const response = await api.post('/subscriptions/lifetime', data);
    return response.data;
  },
};

/** Dados para gráficos (backend retorna formatos variados) */
export interface GraficoPizzaItem {
  label: string;
  value: number;
  percentage: number;
}
export interface GraficoBarraItem {
  participanteId: number;
  participanteNome: string;
  totalPagou: number;
  totalDeve: number;
  saldo: number;
}
export interface PontoTemporal {
  data: string;
  valor: number;
  quantidade: number;
}
export interface TopDespesaItem {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  pagadorNome: string;
}
export interface SaldoEvolucaoItem {
  participanteId: number;
  participanteNome: string;
  pontos: Array<{ data: string; saldo: number }>;
}

export const graficosApi = {
  getPorPagador: async (grupoId: number): Promise<GraficoPizzaItem[]> => {
    const response = await api.get(`/grupos/${grupoId}/graficos/por-pagador`);
    return response.data;
  },
  getGastosParticipantes: async (grupoId: number): Promise<GraficoBarraItem[]> => {
    const response = await api.get(`/grupos/${grupoId}/graficos/gastos-participantes`);
    return response.data;
  },
  getEvolucaoTempo: async (grupoId: number): Promise<PontoTemporal[]> => {
    const response = await api.get(`/grupos/${grupoId}/graficos/evolucao-tempo`);
    return response.data;
  },
  getTopDespesas: async (grupoId: number, limite?: number): Promise<TopDespesaItem[]> => {
    const response = await api.get(`/grupos/${grupoId}/graficos/top-despesas`, {
      params: limite ? { limite } : undefined,
    });
    return response.data;
  },
  getSaldosEvolucao: async (grupoId: number): Promise<SaldoEvolucaoItem[]> => {
    const response = await api.get(`/grupos/${grupoId}/graficos/saldos-evolucao`);
    return response.data;
  },
};
