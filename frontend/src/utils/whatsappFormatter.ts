import { 
  SugestaoPagamento, 
  Participante, 
  Despesa, 
  GrupoParticipantesEvento,
  Grupo,
  SaldoParticipante,
  SaldoGrupo
} from '../types';

/**
 * Verifica se uma despesa é placeholder (zerada ou sem participantes válidos)
 * Despesas placeholder são criadas a partir de templates e não foram editadas/preenchidas
 */
export const isDespesaPlaceholder = (despesa: Despesa): boolean => {
  // Se não tem pagador definido, é placeholder (despesas de template não têm pagador até serem editadas)
  // Verificar tanto participante_pagador_id quanto pagador.id (para compatibilidade com API pública)
  const temPagador = despesa.participante_pagador_id || despesa.pagador?.id;
  if (!temPagador) {
    return true;
  }
  
  // Se tem valor zero, é placeholder
  if (!despesa.valorTotal || despesa.valorTotal === 0) {
    return true;
  }
  
  // Se tem participações mas todas estão zeradas, é placeholder
  if (despesa.participacoes && despesa.participacoes.length > 0) {
    const temParticipacaoValida = despesa.participacoes.some(
      p => p.valorDevePagar && p.valorDevePagar > 0
    );
    if (!temParticipacaoValida) {
      return true;
    }
  }
  
  return false;
};

/**
 * Filtra despesas placeholder de um array de despesas
 */
export const filtrarDespesasPlaceholder = (despesas: Despesa[]): Despesa[] => {
  return despesas.filter(d => !isDespesaPlaceholder(d));
};

/**
 * Formata um valor monetário para exibição
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata uma data para exibição
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Encontra participantes com PIX em um subgrupo
 */
const encontrarParticipantesComPix = (
  grupoNome: string,
  subgrupos: GrupoParticipantesEvento[],
  participantes: Participante[]
): Participante[] => {
  const grupoNomeNormalizado = grupoNome.trim().toLowerCase();
  
  let subgrupo = subgrupos.find(sg => {
    if (!sg.nome) return false;
    return sg.nome.trim().toLowerCase() === grupoNomeNormalizado;
  });
  
  if (!subgrupo) {
    subgrupo = subgrupos.find(sg => {
      if (!sg.nome) return false;
      const nomeSubgrupoNormalizado = sg.nome.trim().toLowerCase();
      return nomeSubgrupoNormalizado.includes(grupoNomeNormalizado) ||
             grupoNomeNormalizado.includes(nomeSubgrupoNormalizado);
    });
  }
  
  if (!subgrupo) {
    const grupoNomeSemPrefixo = grupoNomeNormalizado.replace(/^(fam|familia)\s*/i, '').trim();
    if (grupoNomeSemPrefixo !== grupoNomeNormalizado) {
      subgrupo = subgrupos.find(sg => {
        if (!sg.nome) return false;
        const nomeSubgrupoNormalizado = sg.nome.trim().toLowerCase();
        const nomeSemPrefixo = nomeSubgrupoNormalizado.replace(/^(fam|familia)\s*/i, '').trim();
        return nomeSemPrefixo === grupoNomeSemPrefixo ||
               nomeSubgrupoNormalizado.includes(grupoNomeSemPrefixo) ||
               grupoNomeSemPrefixo.includes(nomeSemPrefixo);
      });
    }
  }
  
  if (!subgrupo || !subgrupo.participantes) {
    return [];
  }

  // Coletar participantes com PIX, tentando usar p.participante primeiro
  const participantesComPix: Participante[] = [];
  subgrupo.participantes.forEach(p => {
    // Tentar usar participante diretamente (se backend enviou)
    let participante = p.participante;
    // Se não tiver, buscar no array de participantes
    if (!participante) {
      const participanteId = p.participante_id;
      participante = participantes.find(part => part.id === participanteId);
    }
    if (participante && participante.chavePix && participante.chavePix.trim() !== '') {
      participantesComPix.push(participante);
    }
  });
  
  return participantesComPix;
};

/**
 * Encontra um participante pelo nome
 */
const encontrarParticipantePorNome = (
  nome: string,
  participantes: Participante[]
): Participante | undefined => {
  return participantes.find(p => p.nome === nome);
};

/**
 * Gera a seção de saldos dos participantes (não usado atualmente - mantido para referência)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _gerarSaldosParticipantes = (
  _saldos: SaldoParticipante[],
  _saldosGrupos: SaldoGrupo[]
): string => {
  // Esta função está desabilitada - não usada no formato atual
  return '';
};

/**
 * Gera o detalhamento das despesas (não usado atualmente - mantido para referência)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _gerarDetalhamento = (
  _despesas: Despesa[],
  _subgrupos: GrupoParticipantesEvento[],
  _participantes: Participante[]
): string => {
  // Esta função está desabilitada - não usada no formato atual
  return '';
};

/**
 * Gera informações de PIX para participantes individuais (não usado atualmente - mantido para referência)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _gerarPixParticipantes = (
  _sugestoes: SugestaoPagamento[],
  _participantes: Participante[]
): string => {
  // Esta função está desabilitada - não usada no formato atual
  return '';
};

/**
 * Gera informações de PIX para subgrupos (não usado atualmente - mantido para referência)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _gerarPixSubgrupos = (
  _sugestoes: SugestaoPagamento[],
  _subgrupos: GrupoParticipantesEvento[],
  _participantes: Participante[]
): string => {
  // Esta função está desabilitada - não usada no formato atual
  return '';
};

/**
 * Obtém as chaves PIX de um participante ou grupo
 */
const obterChavesPix = (
  nome: string,
  subgrupos: GrupoParticipantesEvento[],
  participantes: Participante[]
): string[] => {
  // Tentar encontrar como subgrupo primeiro
  const participantesComPix = encontrarParticipantesComPix(nome, subgrupos, participantes);
  
  if (participantesComPix.length > 0) {
    return participantesComPix.map(p => p.chavePix!.trim()).filter(Boolean);
  }
  
  // Tentar encontrar como participante individual
  const participante = encontrarParticipantePorNome(nome, participantes);
  if (participante && participante.chavePix && participante.chavePix.trim() !== '') {
    return [participante.chavePix.trim()];
  }
  
  return [];
};

/**
 * Formata sugestões de pagamento individuais (sem subgrupos)
 */
export const formatarSugestoesPagamentoIndividual = (
  evento: Grupo,
  sugestoes: SugestaoPagamento[],
  despesas: Despesa[],
  participantes: Participante[],
  _saldos: SaldoParticipante[],
  _saldosGrupos: SaldoGrupo[],
  link?: string
): string => {
  // Filtrar despesas placeholder antes de calcular total
  const despesasValidas = filtrarDespesasPlaceholder(despesas);
  
  // Calcular total de despesas
  const totalDespesas = despesasValidas.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);
  const totalFormatado = formatCurrency(totalDespesas);

  if (sugestoes.length === 0) {
    let mensagem = `💰 *Sugestões de Pagamento - ${evento.nome.trim()}*\n\n*Total do evento: ${totalFormatado}*\n\nNenhum pagamento necessário. Todos os saldos estão quitados!`;
    if (link) {
      mensagem += `\n\n📋 Confira o detalhamento:\n${link}`;
    }
    return mensagem;
  }

  let mensagem = `💰 *Sugestões de Pagamento - ${evento.nome.trim()}*\n\n`;
  mensagem += `*Total do evento: ${totalFormatado}*\n\n`;
  mensagem += 'Para quitar todos os débitos:\n\n';

  sugestoes.forEach(sugestao => {
    const valorFormatado = formatCurrency(sugestao.valor);
    const deLimpo = (sugestao.de || '').trim();
    const paraLimpo = (sugestao.para || '').trim();
    
    // Obter chaves PIX do recebedor
    const chavesPix = obterChavesPix(paraLimpo, [], participantes);
    
    if (chavesPix.length > 0) {
      const pixFormatado = chavesPix.length === 1 
        ? chavesPix[0]
        : chavesPix.join(' ou ');
      mensagem += `• *${deLimpo}* deve pagar *${valorFormatado}* para *${paraLimpo}* - *pix:* ${pixFormatado}\n`;
    } else {
      mensagem += `• *${deLimpo}* deve pagar *${valorFormatado}* para *${paraLimpo}*\n`;
    }
  });

  if (link) {
    mensagem += `\n\n📋 Confira o detalhamento:\n${link}`;
  }

  return mensagem;
};

/**
 * Formata sugestões de pagamento entre subgrupos
 */
export const formatarSugestoesPagamentoSubgrupos = (
  evento: Grupo,
  sugestoes: SugestaoPagamento[],
  despesas: Despesa[],
  subgrupos: GrupoParticipantesEvento[],
  participantes: Participante[],
  _saldos: SaldoParticipante[],
  _saldosGrupos: SaldoGrupo[],
  link?: string
): string => {
  // Filtrar despesas placeholder antes de calcular total
  const despesasValidas = filtrarDespesasPlaceholder(despesas);
  
  // Calcular total de despesas
  const totalDespesas = despesasValidas.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);
  const totalFormatado = formatCurrency(totalDespesas);

  if (sugestoes.length === 0) {
    let mensagem = `💰 *Sugestões de Pagamento - ${evento.nome.trim()}*\n\n*Total do evento: ${totalFormatado}*\n\nNenhum pagamento necessário. Todos os saldos estão quitados!`;
    if (link) {
      mensagem += `\n\n📋 Confira o detalhamento:\n${link}`;
    }
    return mensagem;
  }

  let mensagem = `💰 *Sugestões de Pagamento - ${evento.nome.trim()}*\n\n`;
  mensagem += `*Total do evento: ${totalFormatado}*\n\n`;
  mensagem += 'Para quitar todos os débitos:\n\n';

  sugestoes.forEach(sugestao => {
    const valorFormatado = formatCurrency(sugestao.valor);
    const deLimpo = (sugestao.de || '').trim();
    const paraLimpo = (sugestao.para || '').trim();
    
    // Obter chaves PIX do recebedor (pode ser subgrupo ou participante individual)
    const chavesPix = obterChavesPix(paraLimpo, subgrupos, participantes);
    
    if (chavesPix.length > 0) {
      const pixFormatado = chavesPix.length === 1 
        ? chavesPix[0]
        : chavesPix.join(' ou ');
      mensagem += `• *${deLimpo}* deve pagar *${valorFormatado}* para *${paraLimpo}* - *pix:* ${pixFormatado}\n`;
    } else {
      mensagem += `• *${deLimpo}* deve pagar *${valorFormatado}* para *${paraLimpo}*\n`;
    }
  });

  if (link) {
    mensagem += `\n\n📋 Confira o detalhamento:\n${link}`;
  }

  return mensagem;
};

/**
 * Função principal que determina automaticamente se deve usar formatação individual ou de subgrupos
 */
export const formatarSugestoesPagamento = (
  evento: Grupo,
  sugestoes: SugestaoPagamento[],
  despesas: Despesa[],
  participantes: Participante[],
  saldos: SaldoParticipante[],
  saldosGrupos: SaldoGrupo[],
  subgrupos?: GrupoParticipantesEvento[],
  link?: string,
  numeroParticipantes?: number,
  totalDespesas?: number,
  _nomeOrganizador?: string
): string => {
  const temSubgrupos = subgrupos && subgrupos.length > 0;
  
  let mensagemFormatada: string;
  
  // IMPORTANTE: Se houver subgrupos, SEMPRE usar formatação de subgrupos
  // As sugestões passadas já são as corretas (entre grupos se há subgrupos, individuais se não há)
  if (temSubgrupos) {
    // Quando há subgrupos, usar formatação de subgrupos (que inclui PIX)
    mensagemFormatada = formatarSugestoesPagamentoSubgrupos(
      evento,
      sugestoes,
      despesas,
      subgrupos,
      participantes,
      saldos,
      saldosGrupos,
      link
    );
  } else {
    // Quando não há subgrupos, usar formatação individual (que também inclui PIX)
    mensagemFormatada = formatarSugestoesPagamentoIndividual(
      evento,
      sugestoes,
      despesas,
      participantes,
      saldos,
      saldosGrupos,
      link
    );
  }

  // Adicionar header mais atraente e call-to-action conforme plano
  const frontendUrl = window.location.origin;
  const totalFormatado = totalDespesas ? formatCurrency(totalDespesas) : '';
  const participantesTexto = numeroParticipantes ? `${numeroParticipantes}` : '';
  
  let header = '🎉 *Olha só o resultado do nosso evento!*\n\n';
  header += `📊 *${evento.nome.trim()}*\n`;
  if (totalFormatado) {
    header += `💰 Total: ${totalFormatado}\n`;
  }
  if (participantesTexto) {
    header += `👥 ${participantesTexto} ${numeroParticipantes === 1 ? 'participante' : 'participantes'}\n`;
  }
  header += '\n';

  // Call-to-action no final
  let cta = '\n💡 *Use o Rachid para organizar seus eventos também!*\n';
  if (link) {
    cta += `👉 ${link}\n`;
    cta += 'Dá pra ver o resumo e seus saldos sem criar conta.\n\n';
  }
  
  // Link de cadastro com referral (referenciando o evento)
  const linkCadastro = `${frontendUrl}/cadastro?ref=share_${evento.id}`;
  cta += `🚀 *Crie sua conta gratuita:*\n`;
  cta += `${linkCadastro}\n`;
  cta += 'É grátis e sem complicação!\n';

  return header + mensagemFormatada + cta;
};

