import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import './RecuperarSenha.css';

const RecuperarSenha: React.FC = () => {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);
    setCarregando(true);

    try {
      await authApi.solicitarRecuperacaoSenha(email);
      setSucesso(true);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao solicitar recuperação de senha');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Rachid</h1>
        <h2>Recuperar Senha</h2>
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
              Se o email estiver cadastrado, você receberá um link para recuperar sua senha.
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/login')}
              style={{ width: '100%' }}
            >
              Voltar para o login
            </button>
          </div>
        ) : (
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
                placeholder="Digite seu email"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={carregando}>
              {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
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

export default RecuperarSenha;

