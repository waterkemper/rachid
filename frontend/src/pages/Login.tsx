import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);
  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Tentar carregar o logo de forma assíncrona
    import('../assets/logo.png')
      .then((module) => setLogoSrc(module.default))
      .catch(() => {
        // Logo não encontrado - não faz nada, apenas não exibe
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const usuario = await authApi.login(email, senha);
      login(usuario);
      navigate('/eventos');
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {logoSrc && (
          <div className="login-logo-container">
            <img src={logoSrc} alt="Rachid Logo" className="login-logo" />
          </div>
        )}
        <h1>Rachid</h1>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          {erro && <div className="error-message">{erro}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={carregando}
            />
          </div>
          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              disabled={carregando}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ marginBottom: '12px', color: 'rgba(226, 232, 240, 0.7)', fontSize: '14px' }}>
            ou
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  setErro('');
                  setCarregando(true);
                  try {
                    const usuario = await authApi.loginWithGoogle(credentialResponse.credential);
                    login(usuario);
                    navigate('/eventos');
                  } catch (error: any) {
                    setErro(error.response?.data?.error || 'Erro ao fazer login com Google');
                  } finally {
                    setCarregando(false);
                  }
                }
              }}
              onError={() => {
                setErro('Erro ao fazer login com Google');
              }}
              useOneTap={false}
            />
          </div>
        </div>
        <div className="login-links">
          <button
            type="button"
            className="btn btn-link"
            onClick={() => navigate('/')}
            style={{ marginTop: '16px', width: '100%', textAlign: 'center' }}
          >
            Voltar para a home
          </button>
          <div style={{ marginTop: '12px', textAlign: 'center', color: 'rgba(226, 232, 240, 0.7)', fontSize: '14px' }}>
            Não tem uma conta?{' '}
            <button
              type="button"
              className="btn btn-link"
              onClick={() => navigate('/cadastro')}
              style={{ padding: 0, textDecoration: 'underline', color: 'rgba(99, 102, 241, 0.9)' }}
            >
              Criar conta nova
            </button>
          </div>
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-link"
              onClick={() => navigate('/recuperar-senha')}
              style={{ padding: 0, textDecoration: 'underline', color: 'rgba(99, 102, 241, 0.9)', fontSize: '14px' }}
            >
              Esqueci minha senha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

