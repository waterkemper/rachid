import { 
  SugestaoPagamento, 
  Participante, 
  Despesa, 
  GrupoParticipantesEvento,
  Grupo 
} from '../types';

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

  const participantesIds = subgrupo.participantes.map(p => p.participante_id);
  const participantesComPix = participantes.filter(p => 
    participantesIds.includes(p.id) && p.chavePix && p.chavePix.trim() !== ''
  );
  
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
 * Gera o detalhamento das despesas
 */
const gerarDetalhamento = (
  despesas: Despesa[],
  subgrupos: GrupoParticipantesEvento[],
  participantes: Participante[]
): string => {
  if (despesas.length === 0) {
    return '';
  }

  let detalhamento = '\n📋 *Detalhamento:*\n\n';
  
  despesas.forEach((despesa, index) => {
    const pagadorNome = despesa.pagador?.nome || 'Desconhecido';
    const valorTotal = formatCurrency(despesa.valorTotal);
    const dataFormatada = formatDate(despesa.data);
    const descricaoLimpa = (despesa.descricao || '').trim();
    
    detalhamento += `*${descricaoLimpa}* - ${valorTotal}\n`;
    detalhamento += `  Data: ${dataFormatada}\n`;
    detalhamento += `  Pagou: *${pagadorNome.trim()}*\n`;
    
    if (despesa.participacoes && despesa.participacoes.length > 0) {
      const participantesNomes: string[] = [];
      despesa.participacoes.forEach(participacao => {
        const participante = participantes.find(p => p.id === participacao.participante_id);
        if (participante) {
          participantesNomes.push(participante.nome.trim());
        }
      });
      
      detalhamento += `  Dividido entre: ${participantesNomes.join(', ')}\n`;
      const valorPorPessoa = despesa.valorTotal / despesa.participacoes.length;
      detalhamento += `  Valor por pessoa: *${formatCurrency(valorPorPessoa)}*\n`;
    }
    
    if (index < despesas.length - 1) {
      detalhamento += '\n';
    }
  });
  
  return detalhamento;
};

/**
 * Gera informações de PIX para participantes individuais
 */
const gerarPixParticipantes = (
  sugestoes: SugestaoPagamento[],
  participantes: Participante[]
): string => {
  const recebedores = new Set<string>();
  sugestoes.forEach(sugestao => {
    recebedores.add(sugestao.para);
  });

  const participantesComPix: Array<{ nome: string; pix: string }> = [];
  recebedores.forEach(nome => {
    const participante = encontrarParticipantePorNome(nome, participantes);
    if (participante && participante.chavePix && participante.chavePix.trim() !== '') {
      participantesComPix.push({ nome: participante.nome, pix: participante.chavePix });
    }
  });

  if (participantesComPix.length === 0) {
    return '';
  }

  let pixInfo = '\n💳 *PIX para recebimento:*\n';
  participantesComPix.forEach(({ nome, pix }) => {
    pixInfo += `• *${nome.trim()}*: ${pix.trim()}\n`;
  });

  return pixInfo;
};

/**
 * Gera informações de PIX para subgrupos
 */
const gerarPixSubgrupos = (
  sugestoes: SugestaoPagamento[],
  subgrupos: GrupoParticipantesEvento[],
  participantes: Participante[]
): string => {
  const recebedores = new Set<string>();
  sugestoes.forEach(sugestao => {
    if (sugestao.para) {
      recebedores.add(sugestao.para.trim());
    }
  });

  let pixInfo = '';
  const gruposProcessados = new Set<string>();
  
  recebedores.forEach(grupoNome => {
    const participantesComPix = encontrarParticipantesComPix(grupoNome, subgrupos, participantes);
    
    if (participantesComPix.length > 0) {
      const grupoKey = grupoNome.toLowerCase();
      if (!gruposProcessados.has(grupoKey)) {
        pixInfo += `\n👥 *Membros do grupo "${grupoNome.trim()}" com PIX:*\n`;
        participantesComPix.forEach(participante => {
          pixInfo += `• *${participante.nome.trim()}*: ${participante.chavePix.trim()}\n`;
        });
        gruposProcessados.add(grupoKey);
      }
    } else {
      const participanteIndividual = encontrarParticipantePorNome(grupoNome, participantes);
      if (participanteIndividual && participanteIndividual.chavePix && participanteIndividual.chavePix.trim() !== '') {
        if (!pixInfo.includes(`*${participanteIndividual.nome.trim()}*`)) {
          if (!pixInfo) {
            pixInfo += '\n💳 *PIX para recebimento:*\n';
          }
          pixInfo += `• *${participanteIndividual.nome.trim()}*: ${participanteIndividual.chavePix.trim()}\n`;
        }
      }
    }
  });

  return pixInfo;
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
  incluirDetalhamento: boolean = true
): string => {
  // Calcular total de despesas
  const totalDespesas = despesas.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);
  const totalFormatado = formatCurrency(totalDespesas);

  if (sugestoes.length === 0) {
    return `💰 *Sugestões de Pagamento - ${evento.nome.trim()}*\n\n*Total do evento: ${totalFormatado}*\n\nNenhum pagamento necessário. Todos os saldos estão quitados!`;
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
      mensagem += `• *${deLimpo}* deve pagar *${valorFormatado}* para *${paraLimpo}* (${pixFormatado})\n`;
    } else {
      mensagem += `• *${deLimpo}* deve pagar *${valorFormatado}* para *${paraLimpo}*\n`;
    }
  });

  if (incluirDetalhamento) {
    mensagem += gerarDetalhamento(despesas, [], participantes);
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
  incluirDetalhamento: boolean = true
): string => {
  // Calcular total de despesas
  const totalDespesas = despesas.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);
  const totalFormatado = formatCurrency(totalDespesas);

  if (sugestoes.length === 0) {
    return `💰 *Sugestões de Pagamento - ${evento.nome.trim()}*\n\n*Total do evento: ${totalFormatado}*\n\nNenhum pagamento necessário. Todos os saldos estão quitados!`;
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
      mensagem += `• *${deLimpo}* deve pagar *${valorFormatado}* para *${paraLimpo}* (${pixFormatado})\n`;
    } else {
      mensagem += `• *${deLimpo}* deve pagar *${valorFormatado}* para *${paraLimpo}*\n`;
    }
  });

  if (incluirDetalhamento) {
    mensagem += gerarDetalhamento(despesas, subgrupos, participantes);
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
  subgrupos?: GrupoParticipantesEvento[],
  incluirDetalhamento: boolean = true
): string => {
  const temSubgrupos = subgrupos && subgrupos.length > 0;
  
  if (temSubgrupos) {
    const nomesGrupos = new Set(subgrupos.map(sg => sg.nome));
    const sugestoesEntreGrupos = sugestoes.some(s => 
      nomesGrupos.has(s.de) || nomesGrupos.has(s.para)
    );
    
    if (sugestoesEntreGrupos) {
      return formatarSugestoesPagamentoSubgrupos(
        evento,
        sugestoes,
        despesas,
        subgrupos,
        participantes,
        incluirDetalhamento
      );
    }
  }

  return formatarSugestoesPagamentoIndividual(
    evento,
    sugestoes,
    despesas,
    participantes,
    incluirDetalhamento
  );
};

