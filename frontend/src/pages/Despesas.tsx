import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { despesaApi, grupoApi, participanteApi, grupoParticipantesApi, featureApi } from '../services/api';
import { Despesa, DespesaAnexo, Grupo, Participante } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { FaPlus, FaEdit, FaTrash, FaChartBar, FaUsers, FaShare, FaLock, FaPaperclip, FaDownload, FaImage, FaFilePdf, FaFile, FaCamera, FaTimes } from 'react-icons/fa';
import ShareButtons from '../components/ShareButtons';
import './Despesas.css';

const Despesas: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [participantesDoEvento, setParticipantesDoEvento] = useState<Participante[]>([]);
  const [participanteSubgrupoMap, setParticipanteSubgrupoMap] = useState<Map<number, string>>(new Map());
  // Inicializar filtroGrupo com o valor da URL se existir
  const eventoIdFromUrl = searchParams.get('evento');
  const [filtroGrupo, setFiltroGrupo] = useState<number | ''>(eventoIdFromUrl ? Number(eventoIdFromUrl) : '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [participantesSelecionados, setParticipantesSelecionados] = useState<number[]>([]);
  const [participantesExpandido, setParticipantesExpandido] = useState(false);
  const [formData, setFormData] = useState({
    grupo_id: 0,
    descricao: '',
    valorTotal: '',
    participante_pagador_id: 0,
    data: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [loadingShareLink, setLoadingShareLink] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [anexos, setAnexos] = useState<DespesaAnexo[]>([]);
  const [uploadingAnexos, setUploadingAnexos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Função helper para verificar se usuário pode editar uma despesa
  const canEditDespesa = useCallback((despesa: Despesa): boolean => {
    if (!usuario) return false;
    
    // Se o grupo não está carregado, assumir que pode editar (backend vai validar)
    if (!despesa.grupo) return true;
    
    // Verificar se é dono do grupo
    const grupo = grupos.find(g => g.id === despesa.grupo_id);
    if (grupo) {
      // Se o grupo tem usuario_id, verificar (mas grupos não têm esse campo no tipo)
      // Vamos verificar pelos grupos do usuário
      const grupoDoUsuario = grupos.find(g => g.id === despesa.grupo_id);
      if (grupoDoUsuario) {
        // Se o grupo tem participantes, verificar se algum tem email correspondente
        if (grupoDoUsuario.participantes && grupoDoUsuario.participantes.length > 0) {
          const temParticipanteComEmail = grupoDoUsuario.participantes.some(
            pg => pg.participante?.email?.toLowerCase() === usuario.email.toLowerCase()
          );
          if (temParticipanteComEmail) {
            return true;
          }
        }
      }
    }
    
    // Por padrão, permitir tentar editar (backend vai validar)
    // Mas vamos verificar se temos informação suficiente
    return true;
  }, [usuario, grupos]);

  useEffect(() => {
    loadData();
    // Verificar se há um eventoId na URL (vindo do fluxo guiado)
    const eventoId = searchParams.get('evento');
    if (eventoId) {
      setFiltroGrupo(Number(eventoId));
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gruposData, participantesData] = await Promise.all([
        grupoApi.getAll(),
        participanteApi.getAll(),
      ]);
      setGrupos(gruposData);
      setParticipantes(participantesData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadShareLink = async (eventoId: number) => {
    try {
      setLoadingShareLink(true);
      let linkData = await grupoApi.obterLink(eventoId);
      if (!linkData.link) {
        linkData = await grupoApi.gerarLink(eventoId);
      }
      if (linkData.link) {
        const frontendUrl = window.location.origin;
        // Extrair token do link ou usar o link completo
        const tokenMatch = linkData.link.match(/\/evento\/([^\/]+)$/);
        if (tokenMatch) {
          setShareLink(`${frontendUrl}/evento/${tokenMatch[1]}`);
        } else {
          setShareLink(linkData.link);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar link de compartilhamento:', err);
      setShareLink(null);
    } finally {
      setLoadingShareLink(false);
    }
  };

  const loadDespesas = useCallback(async () => {
    try {
      const grupoId = filtroGrupo === '' ? undefined : filtroGrupo;
      // Sempre buscar dados frescos do servidor (sem cache)
      const data = await despesaApi.getAll(grupoId);
      setDespesas(data);
      
      // Carregar link de compartilhamento se houver evento selecionado
      if (grupoId) {
        loadShareLink(grupoId);
      } else {
        setShareLink(null);
      }
    } catch (err) {
      setError('Erro ao carregar despesas');
    }
  }, [filtroGrupo]);

  useEffect(() => {
    loadDespesas();
  }, [loadDespesas]);


  const loadParticipantesDoEvento = async (eventoId: number, incluirPagadorAtual?: number, participantesAdicionais?: Participante[]): Promise<Participante[]> => {
    try {
      const evento = await grupoApi.getById(eventoId);
      
      // Carregar subgrupos do evento e criar mapeamento
      try {
        const subgrupos = await grupoParticipantesApi.getAll(eventoId);
        const map = new Map<number, string>();
        subgrupos.forEach(subgrupo => {
          if (subgrupo.participantes) {
            subgrupo.participantes.forEach(p => {
              map.set(p.participante_id, subgrupo.nome);
            });
          }
        });
        setParticipanteSubgrupoMap(map);
      } catch (err) {
        setParticipanteSubgrupoMap(new Map());
      }
      
      if (evento.participantes && evento.participantes.length > 0) {
        // IMPORTANTE: Extrair participantes diretamente do evento que já vem com os objetos completos
        // Não filtrar pelo estado global 'participantes' que pode não ter todos os participantes do evento
        let participantesFiltrados: Participante[] = evento.participantes
          .map(pg => pg.participante)
          .filter((p): p is Participante => p !== null && p !== undefined);
        
        // Se estiver editando e o pagador atual não estiver na lista, incluir ele também
        if (incluirPagadorAtual) {
          const pagadorJaNaLista = participantesFiltrados.some(p => p.id === incluirPagadorAtual);
          if (!pagadorJaNaLista) {
            // Tentar encontrar o pagador no estado global primeiro
            let pagadorAtual = participantes.find(p => p.id === incluirPagadorAtual);
            // Se não encontrar no estado global, pode estar nas participações da despesa
            if (!pagadorAtual && participantesAdicionais) {
              pagadorAtual = participantesAdicionais.find(p => p.id === incluirPagadorAtual);
            }
            if (pagadorAtual) {
              participantesFiltrados = [...participantesFiltrados, pagadorAtual];
            }
          }
        }
        
        // Se houver participantes adicionais (ex: de uma despesa sendo editada), incluí-los
        // Isso garante que participantes que não estão mais no evento mas estão na despesa sejam exibidos
        if (participantesAdicionais && participantesAdicionais.length > 0) {
          const idsExistentes = new Set(participantesFiltrados.map(p => p.id));
          const novosParticipantes = participantesAdicionais.filter(p => !idsExistentes.has(p.id));
          if (novosParticipantes.length > 0) {
            participantesFiltrados = [...participantesFiltrados, ...novosParticipantes];
          }
        }
        
        setParticipantesDoEvento(participantesFiltrados);
        return participantesFiltrados;
      } else {
        // Se não houver participantes no evento mas houver um pagador atual, incluir ele
        let participantesFiltrados: Participante[] = [];
        if (incluirPagadorAtual) {
          const pagadorAtual = participantes.find(p => p.id === incluirPagadorAtual);
          if (pagadorAtual) {
            participantesFiltrados = [pagadorAtual];
          }
        }
        setParticipantesDoEvento(participantesFiltrados);
        return participantesFiltrados;
      }
    } catch (err) {
      console.error('Erro ao carregar participantes do evento:', err);
      // Em caso de erro, ainda permitir que o campo seja exibido (pode ser problema de permissão temporário)
      // Se houver um pagador atual, incluir ele
      let participantesFiltrados: Participante[] = [];
      if (incluirPagadorAtual) {
        const pagadorAtual = participantes.find(p => p.id === incluirPagadorAtual);
        if (pagadorAtual) {
          participantesFiltrados = [pagadorAtual];
        }
      }
      setParticipantesDoEvento(participantesFiltrados);
      setParticipanteSubgrupoMap(new Map());
      return participantesFiltrados;
    }
  };

  const formatValue = (value: string | number): string => {
    if (!value && value !== 0) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(numValue)) return '';
    return numValue.toFixed(2).replace('.', ',');
  };

  const parseValue = (value: string): string => {
    // Remove tudo exceto números, vírgula e ponto
    let cleaned = value.replace(/[^\d,.-]/g, '');
    // Se tiver vírgula, assume que é o separador decimal brasileiro
    if (cleaned.includes(',')) {
      // Remove pontos (milhares) e mantém apenas a vírgula decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    // Se não tiver vírgula mas tiver ponto, mantém o ponto
    // Se não tiver nenhum, retorna como está (será tratado como inteiro)
    return cleaned;
  };

  const loadAnexos = async (despesaId: number) => {
    try {
      const anexosData = await despesaApi.listAnexos(despesaId);
      setAnexos(anexosData);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
      setAnexos([]);
    }
  };

  const handleOpenModal = async (despesa?: Despesa) => {
    if (despesa) {
      setEditingDespesa(despesa);
      setFormData({
        grupo_id: despesa.grupo_id,
        descricao: despesa.descricao,
        valorTotal: formatValue(despesa.valorTotal),
        participante_pagador_id: despesa.participante_pagador_id || 0,
        data: despesa.data.split('T')[0],
      });
      // Carregar participantes já selecionados da despesa
      const participantesIds = despesa.participacoes?.map(p => p.participante_id) || [];
      setParticipantesSelecionados(participantesIds);
      
      // IMPORTANTE: Extrair participantes das participacoes da despesa
      // Isso garante que todos os participantes selecionados sejam visíveis, mesmo que não estejam mais no evento
      const participantesDasParticipacoes: Participante[] = [];
      if (despesa.participacoes && despesa.participacoes.length > 0) {
        for (const participacao of despesa.participacoes) {
          // Tentar pegar do objeto participacao.participante (se o backend enviou)
          if (participacao.participante) {
            participantesDasParticipacoes.push(participacao.participante);
          } else {
            // Se não tiver o objeto completo, buscar do estado global de participantes
            const participanteEncontrado = participantes.find(p => p.id === participacao.participante_id);
            if (participanteEncontrado) {
              participantesDasParticipacoes.push(participanteEncontrado);
            }
          }
        }
      }
      
      // Carregar participantes do evento da despesa sendo editada
      // Incluir o pagador atual caso ele não esteja mais no evento
      // E incluir participantes das participacoes da despesa
      await loadParticipantesDoEvento(despesa.grupo_id, despesa.participante_pagador_id, participantesDasParticipacoes);
      
      // Carregar anexos da despesa
      await loadAnexos(despesa.id);
      
      setParticipantesExpandido(true); // Expandir ao editar
    } else {
      setEditingDespesa(null);
      const grupoId = filtroGrupo ? Number(filtroGrupo) : 0;
      setFormData({
        grupo_id: grupoId,
        descricao: '',
        valorTotal: '',
        participante_pagador_id: 0,
        data: new Date().toISOString().split('T')[0],
      });
      // Carregar participantes do evento selecionado (ou do filtro)
      if (grupoId > 0) {
        const participantesCarregados = await loadParticipantesDoEvento(grupoId);
        // Por padrão, selecionar todos os participantes do evento ao criar
        setParticipantesSelecionados(participantesCarregados.map(p => p.id));
      } else {
        setParticipantesDoEvento([]);
        setParticipantesSelecionados([]);
      }
      setAnexos([]);
      setParticipantesExpandido(false); // Colapsado por padrão ao criar
    }
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDespesa(null);
    setParticipantesDoEvento([]);
    setParticipantesSelecionados([]);
    setParticipantesExpandido(false);
    setParticipanteSubgrupoMap(new Map());
    setSelectedFiles([]);
    setAnexos([]);
    setFormData({
      grupo_id: 0,
      descricao: '',
      valorTotal: '',
      participante_pagador_id: 0,
      data: new Date().toISOString().split('T')[0],
    });
  };

  const handleUploadAnexos = async (despesaId: number) => {
    if (selectedFiles.length === 0) return;

    try {
      setUploadingAnexos(true);
      setError(null);

      for (const file of selectedFiles) {
        await despesaApi.uploadAnexo(despesaId, file);
      }

      // Recarregar anexos
      await loadAnexos(despesaId);
      setSelectedFiles([]);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Erro ao fazer upload de anexos';
      setError(errorMessage);
      
      if (err?.response?.status === 402) {
        // Erro de plano PRO necessário
        setError('Upload de anexos disponível apenas para plano PRO. Faça upgrade para continuar.');
      }
    } finally {
      setUploadingAnexos(false);
    }
  };

  const handleDeleteAnexo = async (despesaId: number, anexoId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este anexo?')) {
      return;
    }

    try {
      await despesaApi.deleteAnexo(despesaId, anexoId);
      await loadAnexos(despesaId);
    } catch (error) {
      console.error('Erro ao deletar anexo:', error);
      setError('Erro ao deletar anexo');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FaImage />;
    }
    if (mimeType === 'application/pdf') {
      return <FaFilePdf />;
    }
    return <FaFile />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Validar tamanho
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Arquivo muito grande. Máximo: 5 MB`);
        return;
      }

      // Validar tipo
      const validTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!validTypes.includes(file.type)) {
        errors.push(`${file.name}: Tipo de arquivo não permitido`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      setTimeout(() => setError(null), 5000);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) {
      return; // Prevenir múltiplos cliques
    }

    if (!formData.grupo_id || formData.grupo_id === 0) {
      setError('Selecione um evento no topo da tela antes de criar uma despesa');
      return;
    }

    if (participantesSelecionados.length === 0) {
      setError('Selecione pelo menos um participante para a despesa');
      return;
    }

    // Remover duplicatas dos participantes selecionados
    const participantesUnicos = [...new Set(participantesSelecionados)];

    try {
      setSaving(true);
      setError(null);
      const valorTotal = Number(String(formData.valorTotal).replace(',', '.'));
      const valorPorParticipante = valorTotal / participantesUnicos.length;
      
      const despesaData: any = {
        grupo_id: formData.grupo_id,
        descricao: formData.descricao,
        valorTotal: valorTotal,
        data: formData.data,
        participacoes: participantesUnicos.map(participanteId => ({
          participante_id: participanteId,
          valorDevePagar: valorPorParticipante,
        })),
      };
      
      // Sempre enviar participante_pagador_id quando for edição
      if (editingDespesa) {
        despesaData.participante_pagador_id = Number(formData.participante_pagador_id);
      } else if (formData.participante_pagador_id > 0) {
        despesaData.participante_pagador_id = Number(formData.participante_pagador_id);
      }
      
      if (editingDespesa) {
        const despesaAtualizada = await despesaApi.update(editingDespesa.id, despesaData);
        // Atualizar o estado local imediatamente
        setDespesas(prev => prev.map(d => d.id === editingDespesa.id ? despesaAtualizada : d));
      } else {
        await despesaApi.create(despesaData);
      }
      handleCloseModal();
      // Recarregar despesas para garantir que os dados atualizados sejam exibidos
      await loadDespesas();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Erro ao salvar despesa';
      setError(errorMessage);
      // Se for erro de permissão, mostrar mensagem mais clara
      if (err?.response?.status === 403) {
        setError('Você não tem permissão para editar esta despesa. Apenas participantes do evento podem editar.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      return;
    }
    try {
      await despesaApi.delete(id);
      loadDespesas();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError('Você não tem permissão para excluir esta despesa. Apenas participantes do evento podem excluir.');
      } else {
        setError('Erro ao excluir despesa');
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular valor por participante
  const valorPorParticipante = useMemo(() => {
    if (participantesSelecionados.length === 0) return 0;
    const valorTotal = Number(String(formData.valorTotal).replace(',', '.'));
    if (isNaN(valorTotal) || valorTotal <= 0) return 0;
    return valorTotal / participantesSelecionados.length;
  }, [formData.valorTotal, participantesSelecionados.length]);

  const formatDate = (dateString: string) => {
    // Se a data já está no formato YYYY-MM-DD (sem hora), usar diretamente sem conversão de timezone
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    // Se a data tem hora (formato ISO), extrair apenas a parte da data
    if (dateString.includes('T')) {
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year}`;
    }
    // Caso contrário, tentar usar a conversão padrão
    try {
      const date = new Date(dateString);
      // Ajustar para o fuso horário local para evitar problemas de timezone
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return localDate.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const calcularTotalDespesas = (): number => {
    return despesas.reduce((total, despesa) => total + Number(despesa.valorTotal), 0);
  };


  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div className="despesas-header">
        <h2>Despesas</h2>
        <div className="despesas-header-actions">
          {filtroGrupo && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate(`/adicionar-participantes/${filtroGrupo}`)}>
                <FaUsers /> <span>Participantes</span>
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(`/participacoes?evento=${filtroGrupo}`)}>
                <FaChartBar /> <span>Ver resultado</span>
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(`/convidar-amigos/${filtroGrupo}`)}>
                <FaShare /> <span>Convidar amigos</span>
              </button>
              {shareLink && !loadingShareLink && filtroGrupo && (
                <ShareButtons
                  shareUrl={shareLink}
                  shareText={`Confira as despesas do evento "${grupos.find(g => g.id === filtroGrupo)?.nome || 'Evento'}" no Rachid`}
                  eventName={grupos.find(g => g.id === filtroGrupo)?.nome || 'Evento'}
                  showQRCode={true}
                  showEmail={true}
                  showWhatsApp={true}
                  showCopy={true}
                />
              )}
            </>
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <FaPlus /> <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label>Filtrar por Evento</label>
            <select
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Todos os eventos</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </option>
              ))}
            </select>
          </div>
          {filtroGrupo && despesas.length > 0 && (
            <div style={{ 
              padding: '10px 14px', 
              background: 'rgba(99, 102, 241, 0.12)', 
              borderRadius: '10px',
              border: '1px solid rgba(99, 102, 241, 0.20)',
              display: 'inline-flex',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.78)', marginRight: '8px' }}>
                Total do evento:
              </span>
              <strong style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.95)' }}>
                {formatCurrency(calcularTotalDespesas())}
              </strong>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        {/* Desktop Table View */}
        <div className="despesas-table-wrapper">
          <table className="despesas-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Pagador</th>
                <th>Data</th>
                <th>Participações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {despesas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                    Nenhuma despesa cadastrada
                  </td>
                </tr>
              ) : (
                despesas.map((despesa) => (
                  <tr key={despesa.id}>
                    <td>{despesa.descricao}</td>
                    <td>{formatCurrency(despesa.valorTotal)}</td>
                    <td>{despesa.pagador?.nome || '-'}</td>
                    <td>{formatDate(despesa.data)}</td>
                    <td>{despesa.participacoes?.length || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                        {canEditDespesa(despesa) ? (
                          <>
                            <button
                              className="btn btn-secondary btn-icon"
                              onClick={() => handleOpenModal(despesa)}
                              title="Editar"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-danger btn-icon"
                              onClick={() => handleDelete(despesa.id)}
                              title="Excluir"
                            >
                              <FaTrash />
                            </button>
                          </>
                        ) : (
                          <span 
                            style={{ 
                              color: 'rgba(226, 232, 240, 0.6)', 
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            title="Você não tem permissão para editar esta despesa"
                          >
                            <FaLock /> Somente leitura
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="despesas-cards">
          {despesas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(226, 232, 240, 0.7)' }}>
              Nenhuma despesa cadastrada
            </div>
          ) : (
            despesas.map((despesa) => (
              <div key={despesa.id} className="despesa-card">
                <div className="despesa-card-header">
                  <div className="despesa-card-title">{despesa.descricao}</div>
                  <div className="despesa-card-value">{formatCurrency(despesa.valorTotal)}</div>
                </div>
                <div className="despesa-card-info">
                  <div className="despesa-card-info-item">
                    <span className="despesa-card-info-label">Pagador</span>
                    <span>{despesa.pagador?.nome || '-'}</span>
                  </div>
                  <div className="despesa-card-info-item">
                    <span className="despesa-card-info-label">Data</span>
                    <span>{formatDate(despesa.data)}</span>
                  </div>
                  <div className="despesa-card-info-item">
                    <span className="despesa-card-info-label">Participações</span>
                    <span>{despesa.participacoes?.length || 0}</span>
                  </div>
                </div>
                <div className="despesa-card-actions">
                  {canEditDespesa(despesa) ? (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleOpenModal(despesa)}
                      >
                        <FaEdit /> <span>Editar</span>
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(despesa.id)}
                      >
                        <FaTrash /> <span>Excluir</span>
                      </button>
                    </>
                  ) : (
                    <div style={{ 
                      color: 'rgba(226, 232, 240, 0.6)', 
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px'
                    }}>
                      <FaLock /> <span>Somente leitura</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Evento *</label>
            {formData.grupo_id > 0 ? (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '8px',
                color: 'rgba(226, 232, 240, 0.9)',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {grupos.find(g => g.id === formData.grupo_id)?.nome || 'Evento não encontrado'}
              </div>
            ) : (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: 'rgba(239, 68, 68, 0.9)',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Selecione um evento no topo da tela antes de criar uma despesa
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Descrição *</label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Valor Total *</label>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              alignItems: 'flex-start',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                inputMode="decimal"
                className="valor-despesa-input"
                style={{ maxWidth: '200px', flex: '0 0 auto' }}
                value={formData.valorTotal}
                onChange={(e) => {
                  // Permite digitação livre, apenas remove caracteres inválidos
                  let value = e.target.value;
                  // Permite números, vírgula e ponto
                  value = value.replace(/[^\d,.-]/g, '');
                  // Limita a uma vírgula ou ponto decimal
                  const parts = value.split(/[,.]/);
                  if (parts.length > 2) {
                    // Se tiver mais de um separador, manter apenas o primeiro
                    value = parts[0] + (parts[1] ? ',' + parts.slice(1).join('') : '');
                  }
                  setFormData({ ...formData, valorTotal: value });
                }}
                onBlur={(e) => {
                  // Garantir formatação com 2 casas decimais ao sair do campo
                  const parsed = parseValue(e.target.value);
                  if (parsed && parsed !== '-' && parsed !== '') {
                    const numValue = parseFloat(parsed);
                    if (!isNaN(numValue) && numValue >= 0) {
                      setFormData({ ...formData, valorTotal: formatValue(numValue) });
                    } else {
                      setFormData({ ...formData, valorTotal: '' });
                    }
                  } else if (parsed === '' || parsed === '-') {
                    setFormData({ ...formData, valorTotal: '' });
                  }
                }}
                placeholder="0,00"
                required
              />
              {/* Botão de anexos ao lado do Valor Total */}
              <div style={{ 
                flex: '1 1 auto', 
                minWidth: '200px',
                maxWidth: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={!editingDespesa || uploadingAnexos}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!editingDespesa) {
                      return;
                    }
                    
                    // Verificar se tem acesso premium
                    try {
                      const result = await featureApi.check('receipt_upload_enabled');
                      if (result.hasAccess) {
                        // Tem acesso, abrir seletor de arquivos
                        fileInputRef.current?.click();
                      } else {
                        // Não tem acesso, mostrar modal de upgrade
                        setShowUpgradeModal(true);
                      }
                    } catch (error) {
                      console.error('Erro ao verificar acesso:', error);
                      // Em caso de erro, tentar abrir mesmo assim (backend vai validar)
                      fileInputRef.current?.click();
                    }
                  }}
                  disabled={!editingDespesa || uploadingAnexos}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    color: '#6366f1',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: editingDespesa && !uploadingAnexos ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    opacity: editingDespesa && !uploadingAnexos ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                      if (editingDespesa && !uploadingAnexos) {
                        e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
                        e.currentTarget.style.borderColor = '#6366f1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (editingDespesa && !uploadingAnexos) {
                        e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                      }
                    }}
                >
                  <FaCamera style={{ fontSize: '18px' }} />
                  <span>Adicionar comprovantes</span>
                </button>
                {!editingDespesa && (
                  <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', marginTop: '0', textAlign: 'center' }}>
                    Salve a despesa primeiro para adicionar anexos
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Quem Pagou *</label>
            <select
              value={formData.participante_pagador_id || ''}
              onChange={async (e) => {
                const value = e.target.value === '' ? 0 : Number(e.target.value);
                
                // Se estiver editando uma despesa, verificar se o pagador está nas participações
                if (editingDespesa && value > 0) {
                  const pagadorEstaNasParticipacoes = participantesSelecionados.includes(value);
                  
                  if (!pagadorEstaNasParticipacoes) {
                    // Pagador não está nas participações - avisar e incluir automaticamente
                    const nomePagador = participantesDoEvento.find(p => p.id === value)?.nome || 'o participante';
                    const confirmar = window.confirm(
                      `${nomePagador} não está incluído nesta despesa.\n\nDeseja incluí-lo automaticamente?`
                    );
                    
                    if (confirmar) {
                      // Incluir o pagador nas participações automaticamente
                      setParticipantesSelecionados(prev => {
                        if (!prev.includes(value)) {
                          return [...prev, value];
                        }
                        return prev;
                      });
                      setFormData({ ...formData, participante_pagador_id: value });
                    }
                    // Se o usuário cancelar, não fazer nada - o formData não será atualizado
                    // e o select voltará ao valor anterior automaticamente (controlado pelo React)
                    return;
                  }
                }
                
                setFormData({ ...formData, participante_pagador_id: value });
              }}
              required
              disabled={!formData.grupo_id}
            >
              <option value="">
                {!formData.grupo_id 
                  ? 'Selecione um evento primeiro' 
                  : participantesDoEvento.length === 0 
                    ? 'Carregando participantes...' 
                    : 'Selecione quem pagou'}
              </option>
              {participantesDoEvento.map((participante) => (
                <option key={participante.id} value={participante.id}>
                  {participante.nome}
                </option>
              ))}
            </select>
            {formData.grupo_id && participantesDoEvento.length === 0 && (
              <p style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', marginTop: '4px', marginBottom: 0 }}>
                Nenhum participante encontrado no evento. Verifique se o evento tem participantes cadastrados.
              </p>
            )}
          </div>

          {/* Seção de Anexos - Anexos existentes e arquivos selecionados */}
          {(editingDespesa && anexos.length > 0) || selectedFiles.length > 0 ? (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaPaperclip /> Anexos (Cupons, Recibos, etc.)
              </label>
              
              {/* Anexos existentes */}
              {editingDespesa && anexos.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px' }}>
                      Anexos existentes ({anexos.length}):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                      {anexos.map((anexo) => (
                        <div key={anexo.id} style={{ position: 'relative', border: '1px solid rgba(148, 163, 184, 0.20)', borderRadius: '8px', overflow: 'hidden' }}>
                          {anexo.tipo_mime.startsWith('image/') ? (
                            <div style={{ position: 'relative', width: '100%', aspectRatio: 1 }}>
                              <img 
                                src={anexo.url_cloudfront} 
                                alt={anexo.nome_original}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  // Fallback para URL S3 se CloudFront falhar
                                  (e.target as HTMLImageElement).src = anexo.url_s3;
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteAnexo(editingDespesa.id, anexo.id)}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                }}
                                title="Deletar anexo"
                              >
                                <FaTrash />
                              </button>
                              <a
                                href={anexo.url_cloudfront}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  position: 'absolute',
                                  bottom: '4px',
                                  left: '4px',
                                  background: 'rgba(0, 0, 0, 0.6)',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Abrir em nova aba"
                              >
                                <FaDownload />
                              </a>
                            </div>
                          ) : (
                            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <div style={{ fontSize: '24px', color: '#6366f1' }}>
                                {getFileIcon(anexo.tipo_mime)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.9)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                {anexo.nome_original}
                              </div>
                              <div style={{ fontSize: '10px', color: 'rgba(226, 232, 240, 0.6)' }}>
                                {formatFileSize(anexo.tamanho_otimizado || anexo.tamanho_original)}
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <a
                                  href={anexo.url_cloudfront}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    background: '#6366f1',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title="Download"
                                >
                                  <FaDownload />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnexo(editingDespesa.id, anexo.id)}
                                  style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                  title="Deletar"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Lista de arquivos selecionados */}
              {selectedFiles.length > 0 && (
                <div style={{ marginTop: selectedFiles.length > 0 && editingDespesa && anexos.length > 0 ? '16px' : '0' }}>
                  <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px' }}>
                    Arquivos selecionados ({selectedFiles.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedFiles.map((file, index) => {
                      const isImage = file.type.startsWith('image/');
                      const previewUrl = isImage ? URL.createObjectURL(file) : null;
                      return (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px',
                            backgroundColor: 'rgba(2, 6, 23, 0.3)',
                            borderRadius: '8px',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                          }}
                        >
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt={file.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                              }}
                            />
                          ) : (
                            <div style={{ fontSize: '24px', color: '#6366f1' }}>
                              {getFileIcon(file.type)}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.6)' }}>
                              {formatFileSize(file.size)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: '4px',
                              padding: '6px 8px',
                              cursor: 'pointer',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Remover arquivo"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {editingDespesa && (
                    <button
                      type="button"
                      onClick={() => handleUploadAnexos(editingDespesa.id)}
                      className="btn btn-secondary"
                      disabled={uploadingAnexos}
                      style={{ marginTop: '12px', width: '100%' }}
                    >
                      {uploadingAnexos ? 'Enviando...' : `Enviar ${selectedFiles.length} arquivo(s)`}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : null}

          <div className="form-group">
            <label>Data *</label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>
          {/* Participantes da Despesa */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label>Participantes da Despesa *</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {formData.grupo_id && participantesDoEvento.length > 0 && participantesExpandido && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={() => {
                      const todosSelecionados = participantesDoEvento.every(p => 
                        participantesSelecionados.includes(p.id)
                      );
                      if (todosSelecionados) {
                        // Desmarcar todos
                        setParticipantesSelecionados([]);
                      } else {
                        // Marcar todos
                        setParticipantesSelecionados(participantesDoEvento.map(p => p.id));
                      }
                    }}
                  >
                    {participantesDoEvento.every(p => participantesSelecionados.includes(p.id)) 
                      ? 'Desmarcar todos' 
                      : 'Marcar todos'}
                  </button>
                )}
                {formData.grupo_id && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={() => setParticipantesExpandido(!participantesExpandido)}
                    disabled={participantesDoEvento.length === 0}
                  >
                    {participantesExpandido ? 'Ocultar' : 'Mostrar'}
                  </button>
                )}
              </div>
            </div>
            {participantesSelecionados.length > 0 && (
              <div style={{ 
                fontSize: '13px', 
                color: 'rgba(226, 232, 240, 0.7)', 
                marginBottom: '10px' 
              }}>
                ({participantesSelecionados.length} selecionado{participantesSelecionados.length !== 1 ? 's' : ''})
                {valorPorParticipante > 0 && (
                  <span style={{ marginLeft: '8px', color: 'rgba(34, 197, 94, 0.9)', fontWeight: '600' }}>
                    • {formatCurrency(valorPorParticipante)} por participante
                  </span>
                )}
              </div>
            )}
            {participantesExpandido && (
              participantesDoEvento.length > 0 ? (
                <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid rgba(148, 163, 184, 0.20)',
                borderRadius: '12px',
                padding: '10px',
                background: 'rgba(2, 6, 23, 0.18)',
                marginBottom: '10px'
              }}>
                {participantesDoEvento.length > 4 && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(226, 232, 240, 0.6)', 
                    marginBottom: '8px',
                    textAlign: 'center'
                  }}>
                    ↕ Role para ver mais
                  </div>
                )}
                {participantesDoEvento.map((participante) => {
                  const isSelected = participantesSelecionados.includes(participante.id);
                  const nomeSubgrupo = participanteSubgrupoMap.get(participante.id);
                  return (
                    <label
                      key={participante.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 6px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setParticipantesSelecionados(prev => prev.filter(id => id !== participante.id));
                          } else {
                            setParticipantesSelecionados(prev => [...prev, participante.id]);
                          }
                        }}
                      />
                      <span style={{ color: 'rgba(226, 232, 240, 0.92)', display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span>{participante.nome}</span>
                        {nomeSubgrupo && (
                          <span className="badge-subgrupo-despesa">{nomeSubgrupo}</span>
                        )}
                        {isSelected && valorPorParticipante > 0 && (
                          <span style={{ 
                            marginLeft: 'auto', 
                            fontSize: '12px', 
                            color: 'rgba(34, 197, 94, 0.9)', 
                            fontWeight: '600' 
                          }}>
                            {formatCurrency(valorPorParticipante)}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)', padding: '10px' }}>
                  Nenhum participante encontrado no evento
                </div>
              )
            )}
            {!formData.grupo_id && (
              <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)' }}>
                Selecione um evento primeiro
              </div>
            )}
            {formData.grupo_id && participantesDoEvento.length === 0 && (
              <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)' }}>
                Nenhum participante no evento
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={participantesSelecionados.length === 0 || saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de upgrade premium */}
      {showUpgradeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.98)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '450px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '12px',
                color: '#6366f1',
              }}>
                <FaPaperclip />
              </div>
              <h3 style={{
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '8px',
              }}>
                Recurso Premium
              </h3>
              <p style={{
                color: 'rgba(226, 232, 240, 0.8)',
                fontSize: '14px',
                lineHeight: '1.6',
              }}>
                Este recurso está disponível apenas no plano PRO.
              </p>
            </div>

            <div style={{
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0,
              }}>
                Você será redirecionado para a página de planos para fazer upgrade e desbloquear o recurso de anexar cupons fiscais, recibos e documentos.
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
            }}>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: 'rgba(148, 163, 184, 0.1)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  color: 'rgba(226, 232, 240, 0.9)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/precos';
                }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 30%, #3b82f6 60%, #22c55e 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxShadow: '0 10px 30px rgba(99, 102, 241, 0.35)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(99, 102, 241, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.35)';
                }}
              >
                Ir para Planos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Despesas;

