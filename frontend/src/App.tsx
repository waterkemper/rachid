import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Participantes from './pages/Participantes';
import Grupos from './pages/Grupos';
import Despesas from './pages/Despesas';
import Participacoes from './pages/Participacoes';
import TotaisGrupos from './pages/TotaisGrupos';
import Relatorio from './pages/Relatorio';

function Navbar() {
  const location = useLocation();
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);

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

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          {logoSrc && <img src={logoSrc} alt="Logo Racha Contas" className="navbar-logo" />}
          <h1>Rachid</h1>
        </div>
        <ul className="navbar-nav">
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              Participantes
            </Link>
          </li>
          <li>
            <Link to="/eventos" className={isActive('/eventos') ? 'active' : ''}>
              Eventos
            </Link>
          </li>
          <li>
            <Link to="/despesas" className={isActive('/despesas') ? 'active' : ''}>
              Despesas
            </Link>
          </li>
          <li>
            <Link to="/participacoes" className={isActive('/participacoes') ? 'active' : ''}>
              Participações
            </Link>
          </li>
          <li>
            <Link to="/totais-grupos" className={isActive('/totais-grupos') ? 'active' : ''}>
              Totais por Grupo
            </Link>
          </li>
          <li>
            <Link to="/relatorio" className={isActive('/relatorio') ? 'active' : ''}>
              Relatórios
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Participantes />} />
          <Route path="/eventos" element={<Grupos />} />
          <Route path="/despesas" element={<Despesas />} />
          <Route path="/participacoes" element={<Participacoes />} />
          <Route path="/totais-grupos" element={<TotaisGrupos />} />
          <Route path="/relatorio" element={<Relatorio />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

