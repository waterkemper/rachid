import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PaywallModal from './components/PaywallModal';
import { isPro } from './utils/plan';
import { track } from './services/analytics';
import { FaBars, FaTimes } from 'react-icons/fa';
import Login from './pages/Login';
import Home from './pages/Home';
import Cadastro from './pages/Cadastro';
import RecuperarSenha from './pages/RecuperarSenha';
import ResetarSenha from './pages/ResetarSenha';
import EventoPublico from './pages/EventoPublico';
import Participantes from './pages/Participantes';
import Grupos from './pages/Grupos';
import NovoEvento from './pages/NovoEvento';
import AdicionarParticipantesEvento from './pages/AdicionarParticipantesEvento';
import Despesas from './pages/Despesas';
import Participacoes from './pages/Participacoes';
import TotaisGrupos from './pages/TotaisGrupos';
import Relatorio from './pages/Relatorio';
import Conta from './pages/Conta';
import Ajuda from './pages/Ajuda';
import ConvidarAmigos from './pages/ConvidarAmigos';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);
  const [isPaywallOpen, setIsPaywallOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    // Tentar carregar o logo de forma assíncrona
    // Se o arquivo não existir, apenas não será exibido
    import('./assets/logo.png')
      .then((module) => setLogoSrc(module.default))
      .catch(() => {
        // Logo não encontrado - não faz nada, apenas não exibe
      });
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Não mostrar navbar na tela de login, cadastro, recuperar senha, resetar senha, home ou evento público
  if (location.pathname === '/login' || 
      location.pathname === '/cadastro' || 
      location.pathname === '/home' || 
      location.pathname === '/' ||
      location.pathname === '/recuperar-senha' ||
      location.pathname === '/resetar-senha' ||
      location.pathname.startsWith('/evento/')) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          {logoSrc && <img src={logoSrc} alt="Logo Racha Contas" className="navbar-logo" />}
          <h1>Rachid</h1>
        </div>
        <button 
          className="navbar-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className={`navbar-menu ${isMenuOpen ? 'navbar-menu-open' : ''}`}>
          <ul className="navbar-nav">
            <li>
              <Link 
                to="/participantes" 
                className={isActive('/participantes') ? 'active' : ''}
                onClick={() => setIsMenuOpen(false)}
              >
                Participantes
              </Link>
            </li>
            <li>
              <Link 
                to="/eventos" 
                className={isActive('/eventos') ? 'active' : ''}
                onClick={() => setIsMenuOpen(false)}
              >
                Meus eventos
              </Link>
            </li>
            <li>
              <Link 
                to="/novo-evento" 
                className={isActive('/novo-evento') ? 'active' : ''}
                onClick={() => setIsMenuOpen(false)}
              >
                Criar evento
              </Link>
            </li>
            <li>
              <a
                href="/relatorio"
                className={isActive('/relatorio') ? 'active' : ''}
                onClick={(e) => {
                  setIsMenuOpen(false);
                  if (!isPro(usuario)) {
                    e.preventDefault();
                    track('paywall_view', { feature: 'relatorios', source: 'navbar_relatorios' });
                    setIsPaywallOpen(true);
                    return;
                  }
                  navigate('/relatorio');
                }}
                style={{ cursor: 'pointer' }}
              >
                Relatórios {isPro(usuario) ? '' : '(Pro)'}
              </a>
            </li>
            <li>
              <Link 
                to="/conta" 
                className={isActive('/conta') ? 'active' : ''}
                onClick={() => setIsMenuOpen(false)}
              >
                Conta
              </Link>
            </li>
            <li>
              <Link 
                to="/ajuda" 
                className={isActive('/ajuda') ? 'active' : ''}
                onClick={() => setIsMenuOpen(false)}
              >
                Ajuda
              </Link>
            </li>
          </ul>
          <div className="navbar-user">
            <span className="user-name">{usuario?.nome}</span>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
              Sair
            </button>
          </div>
        </div>
      </div>

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        title="Relatórios no Pro"
        bullets={[
          'Relatórios por pessoa e por grupo',
          'Exportar PDF/CSV do resultado',
          'Grupos reutilizáveis ilimitados',
        ]}
        onCta={() => {
          track('paywall_click_cta', { feature: 'relatorios', source: 'navbar' });
          window.location.href = '/conta';
        }}
      />
    </nav>
  );
}

function AppContent() {
  function AppLayout() {
    const location = useLocation();
    const isPublicPage =
      location.pathname === '/' ||
      location.pathname === '/home' ||
      location.pathname === '/login' ||
      location.pathname === '/cadastro' ||
      location.pathname === '/recuperar-senha' ||
      location.pathname === '/resetar-senha' ||
      location.pathname.startsWith('/evento/');

    // Páginas com layout "full bleed" (fundo e card centralizado sem container)
    const isFullBleedPage =
      isPublicPage ||
      location.pathname === '/novo-evento' ||
      location.pathname.startsWith('/adicionar-participantes') ||
      location.pathname.startsWith('/evento/');

    const routes = (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/resetar-senha" element={<ResetarSenha />} />
        <Route path="/evento/:token" element={<EventoPublico />} />
        <Route
          path="/participantes"
          element={
            <ProtectedRoute>
              <Participantes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/eventos"
          element={
            <ProtectedRoute>
              <Grupos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/novo-evento"
          element={
            <ProtectedRoute>
              <NovoEvento />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adicionar-participantes/:eventoId"
          element={
            <ProtectedRoute>
              <AdicionarParticipantesEvento />
            </ProtectedRoute>
          }
        />
        <Route
          path="/despesas"
          element={
            <ProtectedRoute>
              <Despesas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participacoes"
          element={
            <ProtectedRoute>
              <Participacoes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/totais-grupos"
          element={
            <ProtectedRoute>
              <TotaisGrupos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorio"
          element={
            <ProtectedRoute>
              <Relatorio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conta"
          element={
            <ProtectedRoute>
              <Conta />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ajuda"
          element={
            <ProtectedRoute>
              <Ajuda />
            </ProtectedRoute>
          }
        />
        <Route
          path="/convidar-amigos/:eventoId"
          element={
            <ProtectedRoute>
              <ConvidarAmigos />
            </ProtectedRoute>
          }
        />
      </Routes>
    );

    if (isFullBleedPage) return routes;
    return <div className="container">{routes}</div>;
  }

  return (
    <Router>
      <Navbar />
      <AppLayout />
    </Router>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;

