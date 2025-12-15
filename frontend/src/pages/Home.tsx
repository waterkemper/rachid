import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoUrl from '../assets/logo.png';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const handlePrimary = () => {
    if (usuario) {
      navigate('/novo-evento');
      return;
    }

    navigate('/cadastro');
  };

  const handleSecondary = () => {
    if (usuario) {
      navigate('/eventos');
      return;
    }

    navigate('/login');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleBrandKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/');
    }
  };

  return (
    <div className="home-page">
      <div className="home-bg" aria-hidden="true" />

      <header className="home-top">
        <div className="home-top-inner">
          <div
            className="home-brand"
            onClick={() => navigate('/')}
            onKeyDown={handleBrandKeyDown}
            role="button"
            tabIndex={0}
          >
            <img className="home-logo" src={logoUrl} alt="Logo do Rachid" />
            <div className="home-brand-text">
              <div className="home-brand-name">Rachid</div>
              <div className="home-brand-tagline">Divisão simples de despesas</div>
            </div>
          </div>

          <div className="home-top-actions">
            {usuario ? (
              <>
                <div className="home-user">Olá, <strong>{usuario.nome}</strong></div>
                <button className="btn btn-secondary home-top-btn" onClick={handleLogout}>
                  Sair
                </button>
              </>
            ) : (
              <button className="btn btn-secondary home-top-btn" onClick={() => navigate('/login')}>
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <div className="home-hero-left">
            <h1 className="home-hero-title">Racha contas sem dor de cabeça</h1>
            <p className="home-hero-subtitle">
              Crie um evento, adicione quem participou, lance as despesas e veja quem paga ou recebe.
              Um fluxo guiado feito para qualquer pessoa.
            </p>

            <div className="home-hero-cta">
              <button className="btn home-btn home-btn-primary" onClick={handlePrimary}>
                {usuario ? 'Criar novo evento' : 'Começar agora'}
              </button>

              <button className="btn home-btn home-btn-ghost" onClick={handleSecondary}>
                {usuario ? 'Ver meus eventos' : 'Já tenho conta'}
              </button>
            </div>

            <div className="home-pills" aria-label="Destaques">
              <div className="home-pill">Sem planilhas</div>
              <div className="home-pill">Cálculo automático</div>
              <div className="home-pill">Grupos e famílias</div>
              <div className="home-pill">Consumo por padrão</div>
            </div>
          </div>

          <div className="home-hero-right">
            <div className="home-preview">
              <div className="home-preview-header">
                <div className="home-preview-title">Seu evento em poucos cliques</div>
                <div className="home-preview-sub">Exemplo: “Churrasco do sábado”</div>
              </div>

              <div className="home-preview-steps">
                <div className="home-preview-step">
                  <div className="home-preview-dot">1</div>
                  <div className="home-preview-step-content">
                    <div className="home-preview-step-title">Criar evento</div>
                    <div className="home-preview-step-desc">Nome + data</div>
                  </div>
                </div>

                <div className="home-preview-step">
                  <div className="home-preview-dot">2</div>
                  <div className="home-preview-step-content">
                    <div className="home-preview-step-title">Adicionar participantes</div>
                    <div className="home-preview-step-desc">Pessoas, grupos e grupos maiores</div>
                  </div>
                </div>

                <div className="home-preview-step">
                  <div className="home-preview-dot">3</div>
                  <div className="home-preview-step-content">
                    <div className="home-preview-step-title">Lançar despesas</div>
                    <div className="home-preview-step-desc">Quem pagou + valor</div>
                  </div>
                </div>

                <div className="home-preview-step">
                  <div className="home-preview-dot">4</div>
                  <div className="home-preview-step-content">
                    <div className="home-preview-step-title">Ver totais</div>
                    <div className="home-preview-step-desc">Desmarque só as exceções</div>
                  </div>
                </div>
              </div>

              <div className="home-preview-footer">
                <div className="home-preview-note">
                  Dica: por padrão, o sistema assume que <strong>todo mundo consumiu tudo</strong>.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-header">
            <h2>O fluxo em 4 passos</h2>
            <p>Feito para ser rápido: você só preenche o essencial e o sistema faz as contas.</p>
          </div>

          <div className="home-cards-grid">
            <div className="home-card">
              <div className="home-card-top">
                <span className="home-card-kicker">Passo 1</span>
                <span className="home-card-badge">Evento</span>
              </div>
              <div className="home-card-title">Crie o evento</div>
              <div className="home-card-desc">Nome e data. Se quiser, já sugira um grupo maior para preencher a lista.</div>
            </div>

            <div className="home-card">
              <div className="home-card-top">
                <span className="home-card-kicker">Passo 2</span>
                <span className="home-card-badge">Participantes</span>
              </div>
              <div className="home-card-title">Adicione quem participou</div>
              <div className="home-card-desc">Inclua pessoas, reutilize grupos/famílias e crie grupos na hora.</div>
            </div>

            <div className="home-card">
              <div className="home-card-top">
                <span className="home-card-kicker">Passo 3</span>
                <span className="home-card-badge">Despesas</span>
              </div>
              <div className="home-card-title">Cadastre as despesas</div>
              <div className="home-card-desc">Informe descrição, valor e quem pagou. Esqueceu alguém? Adicione rápido.</div>
            </div>

            <div className="home-card">
              <div className="home-card-top">
                <span className="home-card-kicker">Passo 4</span>
                <span className="home-card-badge">Totais</span>
              </div>
              <div className="home-card-title">Confira e ajuste</div>
              <div className="home-card-desc">O sistema assume consumo total e você desmarca apenas as exceções.</div>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-header">
            <h2>O que facilita sua vida</h2>
            <p>Recursos pensados para grupos reais: família, amigos, escola, esporte, viagens.</p>
          </div>

          <div className="home-features-grid">
            <div className="home-feature">
              <div className="home-feature-title">Consumo por padrão</div>
              <div className="home-feature-desc">Comece com tudo marcado e ajuste apenas o que não foi consumido.</div>
            </div>

            <div className="home-feature">
              <div className="home-feature-title">Grupos e famílias</div>
              <div className="home-feature-desc">Agrupe pessoas para visualizar totais por família ou subgrupo do evento.</div>
            </div>

            <div className="home-feature">
              <div className="home-feature-title">Grupos maiores (grupos de grupos)</div>
              <div className="home-feature-desc">Ex.: “Pais da escola” contendo famílias; “Basquete” contendo várias pessoas.</div>
            </div>

            <div className="home-feature">
              <div className="home-feature-title">Adicionar participante durante as despesas</div>
              <div className="home-feature-desc">Se esqueceu alguém, você não perde o fluxo: adiciona rápido e continua.</div>
            </div>

            <div className="home-feature">
              <div className="home-feature-title">Dados separados por usuário</div>
              <div className="home-feature-desc">Cada conta vê apenas os próprios eventos, participantes e grupos.</div>
            </div>

            <div className="home-feature">
              <div className="home-feature-title">Feito para celular</div>
              <div className="home-feature-desc">Layout simples, botões grandes e telas diretas para usar no dia a dia.</div>
            </div>
          </div>
        </section>

        <section className="home-bottom">
          <div className="home-bottom-card">
            <div className="home-bottom-left">
              <div className="home-bottom-title">Pronto para organizar o próximo evento?</div>
              <div className="home-bottom-desc">Leva menos de 1 minuto para começar. O resto é só lançar as despesas.</div>
            </div>

            <div className="home-bottom-actions">
              <button className="btn home-btn home-btn-primary" onClick={handlePrimary}>
                {usuario ? 'Criar novo evento' : 'Criar conta e começar'}
              </button>
              <button className="btn home-btn home-btn-ghost" onClick={handleSecondary}>
                {usuario ? 'Ver meus eventos' : 'Entrar'}
              </button>
            </div>
          </div>
        </section>

        <footer className="home-footer">
          <span>Rachid</span>
          <span className="home-footer-sep">•</span>
          <span>Divisão de despesas em grupo</span>
        </footer>
      </main>
    </div>
  );
};

export default Home;
