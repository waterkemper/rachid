import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { grupoApi, grupoMaiorApi } from '../services/api';
import { GrupoMaior } from '../services/api';
import './NovoEvento.css';
import PaywallModal from '../components/PaywallModal';
import { useAuth } from '../contexts/AuthContext';
import { isPro } from '../utils/plan';
import { track } from '../services/analytics';

const NovoEvento: React.FC = () => {
  const [nome, setNome] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [gruposMaiores, setGruposMaiores] = useState<GrupoMaior[]>([]);
  const [grupoMaiorSelecionado, setGrupoMaiorSelecionado] = useState<number | ''>('');
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoGrupos, setCarregandoGrupos] = useState(true);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  useEffect(() => {
    loadGruposMaiores();
  }, []);

  const loadGruposMaiores = async () => {
    try {
      const usuarioPro = isPro(usuario);
      if (usuarioPro) {
      const grupos = await grupoMaiorApi.getAll();
      setGruposMaiores(grupos);
      } else {
        const recentes = await grupoMaiorApi.getRecentes(4);
        setGruposMaiores(recentes.slice(0, 3));
      }
    } catch (error) {
      console.error('Erro ao carregar grupos maiores:', error);
    } finally {
      setCarregandoGrupos(false);
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
      // Criar o evento
      const evento = await grupoApi.create({
        nome: nome.trim(),
        data: data,
      });

      // Se um grupo maior foi selecionado, redirecionar para adicionar participantes com o grupo pré-selecionado
      if (grupoMaiorSelecionado) {
        navigate(`/adicionar-participantes/${evento.id}?grupoMaior=${grupoMaiorSelecionado}`);
      } else {
        navigate(`/adicionar-participantes/${evento.id}`);
      }
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar evento');
      setCarregando(false);
    }
  };

  return (
    <div className="novo-evento-container">
      <div className="novo-evento-card">
        <div className="breadcrumb">
          <span>Evento</span>
        </div>
        <h1>Criar Novo Evento</h1>
        <p className="subtitle">Dê um nome ao seu evento e escolha a data</p>

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

          {!carregandoGrupos && gruposMaiores.length > 0 && (
            <div className="form-group">
              <label htmlFor="grupoMaior">Usar grupo salvo (opcional)</label>
              <select
                id="grupoMaior"
                value={grupoMaiorSelecionado}
                onChange={(e) => setGrupoMaiorSelecionado(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={carregando}
              >
                <option value="">Criar evento do zero</option>
                {gruposMaiores.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </option>
                ))}
              </select>
              {!isPro(usuario) && (
                <p className="help-text" style={{ marginTop: '8px' }}>
                  No grátis, mostramos apenas seus 3 grupos mais recentes.{' '}
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => {
                      track('paywall_view', { feature: 'grupos_recentes', source: 'novo_evento_ver_todos' });
                      setIsPaywallOpen(true);
                    }}
                    style={{ padding: 0, height: 'auto' }}
                  >
                    Ver todos no Pro
                  </button>
                </p>
              )}
              {grupoMaiorSelecionado && (
                <p className="help-text">
                  Os participantes do grupo "{gruposMaiores.find(g => g.id === Number(grupoMaiorSelecionado))?.nome}" serão adicionados automaticamente.
                </p>
              )}
            </div>
          )}

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

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        title="Grupos ilimitados no Pro"
        bullets={[
          'Grupos reutilizáveis ilimitados',
          'Reuso rápido com lista completa de recentes',
          'Exportar PDF/CSV e relatórios',
        ]}
        onCta={() => {
          track('paywall_click_cta', { feature: 'grupos_recentes', source: 'novo_evento' });
          window.location.href = '/conta';
        }}
      />
    </div>
  );
};

export default NovoEvento;
