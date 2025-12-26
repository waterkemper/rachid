import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { grupoApi, templateApi } from '../services/api';
import { EventTemplate } from '../types';
import './NovoEvento.css';
import TemplateSelector from '../components/TemplateSelector';

const NovoEvento: React.FC = () => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [carregandoTemplates, setCarregandoTemplates] = useState(true);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    // Quando template é selecionado, preencher nome e descrição
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        if (!nome) setNome(template.nome);
        if (!descricao) setDescricao(template.descricao);
      }
    }
  }, [selectedTemplateId, templates]);

  const loadTemplates = async () => {
    try {
      const data = await templateApi.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setCarregandoTemplates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Nome do evento é obrigatório');
      return;
    }

    setCarregando(true);

    try {
      // Criar o evento (com templateId se selecionado)
      const evento = await grupoApi.create({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        data: data,
        templateId: selectedTemplateId || undefined,
      });

      // Sempre redirecionar para adicionar participantes primeiro
      navigate(`/adicionar-participantes/${evento.id}`);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar evento');
      setCarregando(false);
    }
  };

  return (
    <div className="novo-evento-container">
      <div className="novo-evento-card">
        <h1>Criar Novo Evento</h1>
        {!carregandoTemplates && (
          <TemplateSelector
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
          />
        )}

        <form onSubmit={handleSubmit}>
          {erro && <div className="error-message">{erro}</div>}

          <div className="form-group">
            <label htmlFor="nome">Nome do Evento *</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              disabled={carregando}
              placeholder="Ex: Churrasco dia 12/11"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="descricao">Descrição (opcional)</label>
            <input
              type="text"
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={carregando}
              placeholder="Descrição do evento"
            />
          </div>

          <div className="form-group">
            <label htmlFor="data">Data *</label>
            <input
              type="date"
              id="data"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
              disabled={carregando}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/eventos')}
              disabled={carregando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={carregando}>
              {carregando ? 'Criando...' : 'Próximo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovoEvento;
