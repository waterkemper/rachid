import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
import Relatorio from './pages/Relatorio';
import Conta from './pages/Conta';
import Ajuda from './pages/Ajuda';
import ConvidarAmigos from './pages/ConvidarAmigos';
import AdminDashboard from './pages/AdminDashboard';
import AdminEvento from './pages/AdminEvento';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout, isAdmin } = useAuth();
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);
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
            {isAdmin() && (
              <li>
                <Link 
                  to="/admin" 
                  className={isActive('/admin') ? 'active' : ''}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              </li>
            )}
          </ul>
          <div className="navbar-user">
            <Link 
              to="/conta" 
              className={`navbar-user-link ${isActive('/conta') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="user-name">{usuario?.nome}</span>
            </Link>
            <Link 
              to="/ajuda" 
              className={`navbar-user-link ${isActive('/ajuda') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Ajuda
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary">
              Sair
            </button>
          </div>
        </div>
      </div>
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
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/evento/:id"
          element={
            <ProtectedRoute>
              <AdminEvento />
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

