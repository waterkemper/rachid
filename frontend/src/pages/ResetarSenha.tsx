import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import './RecuperarSenha.css';

const ResetarSenha: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [validandoToken, setValidandoToken] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);

  useEffect(() => {
    const validarToken = async () => {
      if (!token) {
        setValidandoToken(false);
        setTokenValido(false);
        setErro('Token não fornecido');
        return;
      }

      try {
        const valido = await authApi.validarTokenRecuperacao(token);
        setTokenValido(valido);
      } catch (error: any) {
        setTokenValido(false);
        setErro(error.response?.data?.error || 'Token inválido ou expirado');
      } finally {
        setValidandoToken(false);
      }
    };

    validarToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!senha || !confirmarSenha) {
      setErro('Preencha todos os campos');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    if (!token) {
      setErro('Token não fornecido');
      return;
    }

    setCarregando(true);

    try {
      await authApi.resetarSenha(token, senha);
      setSucesso(true);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao resetar senha');
    } finally {
      setCarregando(false);
    }
  };

  if (validandoToken) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Rachid</h1>
          <h2>Validando token...</h2>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="loading">Carregando...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValido) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Rachid</h1>
          <h2>Token Inválido</h2>
          {erro && <div className="error-message">{erro}</div>}
          <p style={{ marginBottom: '20px', color: 'rgba(226, 232, 240, 0.7)' }}>
            O token de recuperação é inválido ou expirou. Por favor, solicite um novo link.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/recuperar-senha')}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            Solicitar novo link
          </button>
          <button
            type="button"
            className="btn btn-link"
            onClick={() => navigate('/login')}
            style={{ width: '100%', textAlign: 'center' }}
          >
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Rachid</h1>
        <h2>Redefinir Senha</h2>
        {sucesso ? (
          <div>
            <div style={{ 
              background: 'rgba(34, 197, 94, 0.14)', 
              border: '1px solid rgba(34, 197, 94, 0.28)', 
              color: 'rgba(220, 252, 231, 0.98)', 
              padding: '12px', 
              borderRadius: '12px', 
              marginBottom: '20px' 
            }}>
              Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/login')}
              style={{ width: '100%' }}
            >
              Ir para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {erro && <div className="error-message">{erro}</div>}
            <div className="form-group">
              <label htmlFor="senha">Nova Senha</label>
              <input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                disabled={carregando}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
              <input
                type="password"
                id="confirmarSenha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                disabled={carregando}
                placeholder="Digite a senha novamente"
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={carregando}>
              {carregando ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
            <div className="login-links">
              <button
                type="button"
                className="btn btn-link"
                onClick={() => navigate('/login')}
                style={{ marginTop: '16px', width: '100%', textAlign: 'center' }}
              >
                Voltar para o login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetarSenha;

