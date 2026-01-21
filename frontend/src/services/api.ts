import axios from 'axios';
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
  Subscription,
  Plan,
  FeatureLimit,
  Usage,
  GraficoPizzaPagador,
  PontoTemporal,
  GraficoGastosParticipante,
  TopDespesa,
  GastosMensais,
  GastosPorEvento,
  DistribuicaoMensalPorEvento,
  SaldosEvolucao,
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

  loginWithGoogle: async (tokenId: string): Promise<Usuario> => {
    const response = await api.post('/auth/google', { tokenId });
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
    referralCode?: string;
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
    chavePix?: string;
  }): Promise<Usuario> => {
    const response = await api.put('/auth/me', data);
    return response.data.usuario;
  },
};

export const participanteApi = {
  getAll: async (): Promise<Participante[]> => {
    const response = await api.get('/participantes', { params: { _t: Date.now() } });
    return response.data;
  },

  getById: async (id: number): Promise<Participante> => {
    const response = await api.get(`/participantes/${id}`, { params: { _t: Date.now() } });
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
    const response = await api.get('/grupos', { params: { _t: Date.now() } });
    return response.data;
  },

  getById: async (id: number): Promise<Grupo> => {
    const response = await api.get(`/grupos/${id}`, { params: { _t: Date.now() } });
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

  updateStatus: async (id: number, status: 'CONCLUIDO' | 'CANCELADO' | 'EM_ABERTO'): Promise<Grupo> => {
    const response = await api.put(`/grupos/${id}/status`, { status });
    return response.data;
  },
};

export const despesaApi = {
  getAll: async (grupoId?: number): Promise<Despesa[]> => {
    const params: any = grupoId ? { grupoId } : {};
    // Adicionar timestamp para evitar cache do navegador
    params._t = Date.now();
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
            // Preservar a relação participante se vier do backend
            participante: p.participante || undefined,
          }))
        : d?.participacoes,
    });

    return Array.isArray(response.data) ? response.data.map(normalizeDespesa) : [];
  },

  getById: async (id: number): Promise<Despesa> => {
    const response = await api.get(`/despesas/${id}`, { params: { _t: Date.now() } });
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

  // Anexos
  uploadAnexo: async (despesaId: number, file: File): Promise<DespesaAnexo> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/despesas/${despesaId}/anexos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  listAnexos: async (despesaId: number): Promise<DespesaAnexo[]> => {
    const response = await api.get(`/despesas/${despesaId}/anexos`);
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
    const response = await api.get(`/grupos/${grupoId}/saldos`, { params: { _t: Date.now() } });
    return response.data;
  },

  getSaldosPorGrupo: async (grupoId: number): Promise<SaldoGrupo[]> => {
    const response = await api.get(`/grupos/${grupoId}/saldos-por-grupo`, { params: { _t: Date.now() } });
    return response.data;
  },

  getSugestoesPagamento: async (grupoId: number): Promise<SugestaoPagamento[]> => {
    const response = await api.get(`/grupos/${grupoId}/sugestoes-pagamento`, { params: { _t: Date.now() } });
    return response.data;
  },

  getSugestoesPagamentoGrupos: async (grupoId: number): Promise<SugestaoPagamento[]> => {
    const response = await api.get(`/grupos/${grupoId}/sugestoes-pagamento-grupos`, { params: { _t: Date.now() } });
    return response.data;
  },
};

export const pagamentoApi = {
  marcarComoPago: async (grupoId: number, data: {
    sugestaoIndex: number;
    deParticipanteId: number;
    paraParticipanteId: number;
    sugestaoValor: number;
    pagoPorParticipanteId: number;
    valor: number;
    deNome?: string;
    paraNome?: string;
  }): Promise<any> => {
    const response = await api.post(`/grupos/${grupoId}/pagamentos`, data);
    return response.data;
  },

  marcarComoPagoEntreGrupos: async (grupoId: number, data: {
    sugestaoIndex: number;
    deGrupoId: number;
    paraGrupoId: number;
    sugestaoValor: number;
    pagoPorParticipanteId: number;
    valor: number;
    deNome?: string;
    paraNome?: string;
  }): Promise<any> => {
    const response = await api.post(`/grupos/${grupoId}/pagamentos-grupos`, data);
    return response.data;
  },

  confirmarPagamento: async (pagamentoId: number, confirmadoPorParticipanteId: number): Promise<any> => {
    const response = await api.put(`/pagamentos/${pagamentoId}/confirmar`, { confirmadoPorParticipanteId });
    return response.data;
  },

  desconfirmarPagamento: async (pagamentoId: number): Promise<any> => {
    const response = await api.put(`/pagamentos/${pagamentoId}/desconfirmar`, {});
    return response.data;
  },

  getPagamentosPorEvento: async (grupoId: number, tipo?: 'INDIVIDUAL' | 'ENTRE_GRUPOS'): Promise<any[]> => {
    const params: any = { _t: Date.now() };
    if (tipo) {
      params.tipo = tipo;
    }
    const response = await api.get(`/grupos/${grupoId}/pagamentos`, { params });
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
    const response = await api.get(`/grupos/${eventoId}/grupos-participantes`, { params: { _t: Date.now() } });
    return response.data;
  },

  getById: async (eventoId: number, id: number): Promise<GrupoParticipantesEvento> => {
    const response = await api.get(`/grupos/${eventoId}/grupos-participantes/${id}`, { params: { _t: Date.now() } });
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

export interface EstatisticasUsuarios {
  total: number;
  novosUltimos7Dias: number;
  novosUltimos30Dias: number;
  ativosUltimos30Dias: number;
}

export interface EstatisticasEventos {
  total: number;
  criadosUltimos7Dias: number;
  criadosUltimos30Dias: number;
  comAcessoPublico: number;
}

export interface EstatisticasDespesas {
  total: number;
  valorTotal: number;
  mediaPorEvento: number;
  criadasUltimos7Dias: number;
  criadasUltimos30Dias: number;
}

export interface EstatisticasAcessos {
  total: number;
  ultimos7Dias: number;
  ultimos30Dias: number;
  porEvento: Array<{
    eventoId: number;
    eventoNome: string;
    acessos: number;
  }>;
}

export interface EstatisticasGerais {
  usuarios: EstatisticasUsuarios;
  eventos: EstatisticasEventos;
  despesas: EstatisticasDespesas;
  acessos: EstatisticasAcessos;
}

export const adminApi = {
  getEstatisticasGerais: async (): Promise<EstatisticasGerais> => {
    const response = await api.get('/admin/estatisticas');
    return response.data;
  },
  getEstatisticasUsuarios: async (): Promise<EstatisticasUsuarios> => {
    const response = await api.get('/admin/estatisticas/usuarios');
    return response.data;
  },
  getEstatisticasEventos: async (): Promise<EstatisticasEventos> => {
    const response = await api.get('/admin/estatisticas/eventos');
    return response.data;
  },
  getEstatisticasDespesas: async (): Promise<EstatisticasDespesas> => {
    const response = await api.get('/admin/estatisticas/despesas');
    return response.data;
  },
  getEstatisticasAcessos: async (): Promise<EstatisticasAcessos> => {
    const response = await api.get('/admin/estatisticas/acessos');
    return response.data;
  },
  getAllUsuarios: async (): Promise<Usuario[]> => {
    const response = await api.get('/admin/usuarios');
    return response.data;
  },
  getAllEventos: async (): Promise<Grupo[]> => {
    const response = await api.get('/admin/eventos');
    return response.data;
  },
  getEventoDetalhes: async (eventoId: number): Promise<any> => {
    const response = await api.get(`/admin/eventos/${eventoId}`);
    return response.data;
  },
  getEventoSaldos: async (eventoId: number): Promise<SaldoParticipante[]> => {
    const response = await api.get(`/admin/eventos/${eventoId}/saldos`);
    return response.data;
  },
  getEventoSaldosPorGrupo: async (eventoId: number): Promise<SaldoGrupo[]> => {
    const response = await api.get(`/admin/eventos/${eventoId}/saldos-por-grupo`);
    return response.data;
  },
  getEventoSugestoes: async (eventoId: number): Promise<SugestaoPagamento[]> => {
    const response = await api.get(`/admin/eventos/${eventoId}/sugestoes`);
    return response.data;
  },
  getEventoDespesas: async (eventoId: number): Promise<Despesa[]> => {
    const response = await api.get(`/admin/eventos/${eventoId}/despesas`);
    return response.data;
  },

  getEmailQueueStatus: async (): Promise<Array<{ queue: string; size: number; jobs?: any[] }>> => {
    const response = await api.get('/admin/email-queue/status');
    return response.data;
  },

  getEmailQueueJobs: async (queue: string, limit: number = 50): Promise<{ queue: string; count: number; jobs: any[] }> => {
    const response = await api.get(`/admin/email-queue/${queue}/jobs`, { params: { limit } });
    return response.data;
  },

  cancelEmailQueueJob: async (jobId: string): Promise<{ message: string; jobId: string }> => {
    const response = await api.delete(`/admin/email-queue/jobs/${jobId}`);
    return response.data;
  },

  cancelAllEmailQueueJobs: async (queue: string): Promise<{ message: string; queue: string; count: number }> => {
    const response = await api.delete(`/admin/email-queue/${queue}/jobs`);
    return response.data;
  },

  getEmailAggregationStats: async (): Promise<{
    totalPendentes: number;
    totalProcessados: number;
    proximosAProcessar: number;
    emailsEstimados: number;
    porTipo: Record<string, number>;
    pendentes: Array<{
      id: number;
      destinatario: string;
      eventoId: number;
      tipoNotificacao: string;
      criadoEm: string;
      processarApos: string;
    }>;
    warning?: string;
  }> => {
    const response = await api.get('/admin/email-aggregation/stats');
    return response.data;
  },

  deleteEmailPendente: async (id: number): Promise<{ message: string; id: number }> => {
    const response = await api.delete(`/admin/email-aggregation/pending/${id}`);
    return response.data;
  },

  deleteAllEmailPendentes: async (): Promise<{ message: string; count: number }> => {
    const response = await api.delete('/admin/email-aggregation/pending');
    return response.data;
  },

  deleteEmailPendentesByTipo: async (tipo: string): Promise<{ message: string; tipo: string; count: number }> => {
    const response = await api.delete(`/admin/email-aggregation/pending/tipo/${tipo}`);
    return response.data;
  },

  getEmails: async (params?: {
    status?: string;
    tipo?: string;
    destinatario?: string;
    limit?: number;
    offset?: number;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<{ emails: any[]; total: number; limit: number; offset: number; hasMore: boolean }> => {
    const response = await api.get('/admin/emails', { params });
    return response.data;
  },

  getEmailById: async (id: number): Promise<any> => {
    const response = await api.get(`/admin/emails/${id}`);
    return response.data;
  },

  getEmailStats: async (): Promise<any> => {
    const response = await api.get('/admin/emails/stats');
    return response.data;
  },
  
  // Subscription management
  getAllSubscriptions: async (): Promise<any[]> => {
    const response = await api.get('/admin/subscriptions');
    return response.data;
  },
  
  getSubscriptionById: async (id: number): Promise<any> => {
    const response = await api.get(`/admin/subscriptions/${id}`);
    return response.data;
  },
  
  refundSubscription: async (id: number): Promise<{ message: string; subscription: any }> => {
    const response = await api.post(`/admin/subscriptions/${id}/refund`);
    return response.data;
  },
  
  extendSubscription: async (id: number, days: number): Promise<{
    message: string;
    subscription: any;
  }> => {
    const response = await api.post(`/admin/subscriptions/${id}/extend`, { days });
    return response.data;
  },
  
  updateSubscriptionFeatures: async (id: number, features: any): Promise<{
    message: string;
    subscriptionId: number;
  }> => {
    const response = await api.put(`/admin/subscriptions/${id}/features`, { features });
    return response.data;
  },
  
  getSubscriptionStats: async (): Promise<{
    total: number;
    active: number;
    byPlanType: { monthly: number; yearly: number; lifetime: number };
    cancelled: number;
  }> => {
    const response = await api.get('/admin/subscriptions/stats');
    return response.data;
  },

  syncSubscription: async (id: number): Promise<{ message: string; subscription: any }> => {
    const response = await api.post(`/admin/subscriptions/${id}/sync`);
    return response.data;
  },

  activateSubscriptionForUser: async (userId: number, planType?: 'MONTHLY' | 'YEARLY'): Promise<{
    message: string;
    subscription?: any;
    subscriptionId?: number;
    approvalUrl?: string;
    paypalSubscriptionId?: string;
  }> => {
    const response = await api.post(`/admin/subscriptions/user/${userId}/activate`, { planType });
    return response.data;
  },

  recreateSubscriptionForUser: async (userId: number, planType: 'MONTHLY' | 'YEARLY'): Promise<{
    message: string;
    canceledCount: number;
    subscriptionId: number;
    approvalUrl: string;
    paypalSubscriptionId: string;
    instructions: string;
  }> => {
    const response = await api.post(`/admin/subscriptions/user/${userId}/recreate`, { planType });
    return response.data;
  },
  
  // Feature limits management
  getAllPlanLimits: async (): Promise<Record<string, Record<string, any>>> => {
    const response = await api.get('/admin/feature-limits');
    return response.data;
  },
  
  getPlanLimits: async (planType: 'FREE' | 'PRO' | 'LIFETIME'): Promise<{
    planType: string;
    limits: Record<string, any>;
  }> => {
    const response = await api.get(`/admin/feature-limits/${planType}`);
    return response.data;
  },
  
  updatePlanLimit: async (
    planType: 'FREE' | 'PRO' | 'LIFETIME',
    featureKey: string,
    updates: {
      limitValue?: number | null;
      enabled?: boolean | null;
      description?: string;
    }
  ): Promise<{ message: string; limit: any }> => {
    const response = await api.put(`/admin/feature-limits/${planType}/${featureKey}`, updates);
    return response.data;
  },
  
  getLimitHistory: async (): Promise<{ history: any[] }> => {
    const response = await api.get('/admin/feature-limits/history');
    return response.data;
  },

  // Plans management
  createPlan: async (planData: {
    planType: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
    name: string;
    description?: string;
    price: number;
    currency?: string;
    intervalUnit?: 'month' | 'year';
    intervalCount?: number;
    isOneTime?: boolean;
    enabled?: boolean;
    displayOrder?: number;
    createInPayPal?: boolean;
  }): Promise<any> => {
    const response = await api.post('/admin/plans', planData);
    return response.data;
  },

  getAllPlans: async (): Promise<any[]> => {
    const response = await api.get('/admin/plans');
    return response.data;
  },

  getPlan: async (planType: 'MONTHLY' | 'YEARLY' | 'LIFETIME'): Promise<any> => {
    const response = await api.get(`/admin/plans/${planType}`);
    return response.data;
  },

  updatePlan: async (
    planType: 'MONTHLY' | 'YEARLY' | 'LIFETIME',
    updates: {
      name?: string;
      description?: string;
      price?: number;
      currency?: string;
      intervalUnit?: 'month' | 'year';
      intervalCount?: number;
      isOneTime?: boolean;
      paypalPlanId?: string;
      enabled?: boolean;
      displayOrder?: number;
    }
  ): Promise<any> => {
    const response = await api.put(`/admin/plans/${planType}`, updates);
    return response.data;
  },
};

export interface EventoPublico {
  id: number;
  nome: string;
  descricao?: string;
  data: string;
  participantes: Array<{
    id: number;
    nome: string;
    email?: string;
    chavePix?: string;
  }>;
  totalDespesas: number;
}

export const publicEventoApi = {
  getByToken: async (token: string): Promise<EventoPublico> => {
    const response = await api.get(`/public/eventos/${token}`);
    return response.data;
  },

  getSaldos: async (token: string): Promise<SaldoParticipante[]> => {
    const response = await api.get(`/public/eventos/${token}/saldos`);
    return response.data;
  },

  getSugestoes: async (token: string): Promise<SugestaoPagamento[]> => {
    const response = await api.get(`/public/eventos/${token}/sugestoes`);
    return response.data;
  },

  getSaldosPorGrupo: async (token: string): Promise<SaldoGrupo[]> => {
    const response = await api.get(`/public/eventos/${token}/saldos-por-grupo`);
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

export const subscriptionApi = {
  create: async (data: {
    planType: 'MONTHLY' | 'YEARLY';
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{ subscriptionId: number; approvalUrl: string }> => {
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

  getMe: async (): Promise<{
    subscription: Subscription | null;
    limits: Record<string, any>;
    usage: Usage;
  }> => {
    const response = await api.get('/subscriptions/me');
    return response.data;
  },

  update: async (id: number, planType: 'MONTHLY' | 'YEARLY'): Promise<{
    subscription: Subscription;
    message: string;
  }> => {
    const response = await api.put(`/subscriptions/${id}`, { planType });
    return response.data;
  },

  cancel: async (id: number, immediately?: boolean): Promise<{
    subscription: Subscription;
    message: string;
  }> => {
    const response = await api.post(`/subscriptions/${id}/cancel`, { immediately });
    return response.data;
  },

  resume: async (id: number): Promise<{
    subscription: Subscription;
    message: string;
  }> => {
    const response = await api.post(`/subscriptions/${id}/resume`);
    return response.data;
  },

  getPlans: async (): Promise<{ plans: Record<string, Plan> }> => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  createLifetime: async (data: {
    promoCode?: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{ orderId: string; approvalUrl: string; amount: number }> => {
    const response = await api.post('/subscriptions/lifetime', data);
    return response.data;
  },

  captureLifetime: async (data: {
    orderId: string;
    promoCode?: string;
  }): Promise<{
    subscription: Subscription;
    order: any;
    message: string;
  }> => {
    const response = await api.post('/subscriptions/lifetime/capture', data);
    return response.data;
  },

  getUsage: async (): Promise<{
    subscription: Subscription | null;
    planType: string;
    limits: Record<string, FeatureLimit>;
    usage: Usage;
  }> => {
    const response = await api.get('/subscriptions/usage');
    return response.data;
  },
};

export const featureApi = {
  check: async (featureKey: string): Promise<{ featureKey: string; hasAccess: boolean }> => {
    const response = await api.get('/features/check', { params: { featureKey } });
    return response.data;
  },

  getLimits: async (): Promise<{
    planType: string;
    limits: Record<string, FeatureLimit>;
    usage: Usage;
  }> => {
    const response = await api.get('/features/limits');
    return response.data;
  },

  getPlanLimits: async (): Promise<Record<string, Record<string, any>>> => {
    const response = await api.get('/features/plan-limits');
    return response.data;
  },
};

export interface EstatisticasPublicas {
  totalUsuarios: number;
  totalEventos: number;
  eventosCompartilhados: number;
  novosEventosUltimos30Dias: number;
}

export const publicApi = {
  getEstatisticas: async (): Promise<EstatisticasPublicas> => {
    const response = await api.get('/public/estatisticas');
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

export const graficosApi = {
  getGastosPorPagador: async (grupoId: number): Promise<GraficoPizzaPagador[]> => {
    const response = await api.get(`/grupos/${grupoId}/graficos/por-pagador`);
    return response.data;
  },

  getGastosParticipantes: async (grupoId: number): Promise<GraficoGastosParticipante[]> => {
    const response = await api.get(`/grupos/${grupoId}/graficos/gastos-participantes`);
    return response.data;
  },

  getEvolucaoTempo: async (grupoId: number): Promise<PontoTemporal[]> => {
    const response = await api.get(`/grupos/${grupoId}/graficos/evolucao-tempo`);
    return response.data;
  },

  getTopDespesas: async (grupoId: number, limite: number = 10): Promise<TopDespesa[]> => {
    const response = await api.get(`/grupos/${grupoId}/graficos/top-despesas`, {
      params: { limite },
    });
    return response.data;
  },

  getSaldosEvolucao: async (grupoId: number): Promise<SaldosEvolucao[]> => {
    const response = await api.get(`/grupos/${grupoId}/graficos/saldos-evolucao`);
    return response.data;
  },

  getGastosMensais: async (): Promise<GastosMensais[]> => {
    const response = await api.get('/graficos/gastos-mensais');
    return response.data;
  },

  getGastosPorEvento: async (): Promise<GastosPorEvento[]> => {
    const response = await api.get('/graficos/gastos-por-evento');
    return response.data;
  },

  getDistribuicaoMensalPorEvento: async (): Promise<DistribuicaoMensalPorEvento[]> => {
    const response = await api.get('/graficos/distribuicao-mensal-por-evento');
    return response.data;
  },
};

