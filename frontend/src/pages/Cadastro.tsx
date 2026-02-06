import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authApi, publicEventoApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import logoUrl from '../assets/logo.png';
import './Cadastro.css';

const Cadastro: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [ddd, setDdd] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // Validações
    if (!nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    if (!email.trim()) {
      setErro('Email é obrigatório');
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

    setCarregando(true);

    try {
      // Capturar parâmetro de referral da URL
      const referralCode = searchParams.get('ref');
      
      await authApi.createUser({
        nome: nome.trim(),
        email: email.trim(),
        ddd: ddd.trim() || undefined,
        telefone: telefone.trim() || undefined,
        senha,
        referralCode: referralCode || undefined,
      });

      // Login automático
      const usuario = await authApi.login(email.trim(), senha);
      login(usuario);

      // Verificar se há token de reivindicação na URL
      const token = searchParams.get('token');
      if (token) {
        try {
          const resultado = await publicEventoApi.reivindicar(token, email.trim());
          if (resultado.transferidos > 0) {
            // Redirecionar para eventos com mensagem de sucesso
            navigate('/eventos?reivindicado=true');
            return;
          }
        } catch (err) {
          // Se falhar a reivindicação, continua normalmente
          console.error('Erro ao reivindicar participação:', err);
        }
      }

      // Redirecionar para criar evento
      navigate('/novo-evento');
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setCarregando(false);
    }
  };

  const handleGoogleSignIn = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;

    setErro('');
    setCarregando(true);

    try {
      const usuario = await authApi.loginWithGoogle(credentialResponse.credential);
      login(usuario);

      // Verificar se há token de reivindicação na URL
      const token = searchParams.get('token');
      if (token) {
        try {
          const resultado = await publicEventoApi.reivindicar(token, usuario.email);
          if (resultado.transferidos > 0) {
            // Redirecionar para eventos com mensagem de sucesso
            navigate('/eventos?reivindicado=true');
            return;
          }
        } catch (err) {
          // Se falhar a reivindicação, continua normalmente
          console.error('Erro ao reivindicar participação:', err);
        }
      }

      // Redirecionar para criar evento
      navigate('/novo-evento');
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao fazer login com Google');
    } finally {
      setCarregando(false);
    }
  };

  const handleBrandKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/');
    }
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-bg" aria-hidden="true" />

      <header className="cadastro-top">
        <div className="cadastro-top-inner">
          <div
            className="cadastro-brand"
            onClick={() => navigate('/')}
            onKeyDown={handleBrandKeyDown}
            role="button"
            tabIndex={0}
          >
            <img className="cadastro-logo" src={logoUrl} alt="Logo do Rachid" />
            <div className="cadastro-brand-text">
              <div className="cadastro-brand-name">Rachid</div>
              <div className="cadastro-brand-tagline">Crie sua conta para começar</div>
            </div>
          </div>

          <button className="btn btn-secondary cadastro-top-btn" onClick={() => navigate('/login')}>
            Já tenho conta
          </button>
        </div>
      </header>

      <main className="cadastro-main">
        <div className="cadastro-card">
          <div className="cadastro-card-header">
            <h1>Criar conta</h1>
            <p>Leva menos de 1 minuto. Depois você já cria seu primeiro evento.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {erro && <div className="cadastro-error">{erro}</div>}

            <div className="cadastro-form-grid">
              <div className="form-group">
                <label htmlFor="nome">Nome *</label>
                <input
                  type="text"
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  disabled={carregando}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="form-group cadastro-span-2">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={carregando}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ddd">DDD (opcional)</label>
                <input
                  type="text"
                  id="ddd"
                  value={ddd}
                  onChange={(e) => setDdd(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  disabled={carregando}
                  placeholder="11"
                  maxLength={2}
                  inputMode="numeric"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefone">Telefone (opcional)</label>
                <input
                  type="text"
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  disabled={carregando}
                  placeholder="987654321"
                  maxLength={9}
                  inputMode="numeric"
                />
              </div>

              <div className="form-group">
                <label htmlFor="senha">Senha *</label>
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
                <label htmlFor="confirmarSenha">Confirmar senha *</label>
                <input
                  type="password"
                  id="confirmarSenha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  disabled={carregando}
                  placeholder="Digite a senha novamente"
                />
              </div>
            </div>

            <button type="submit" className="btn cadastro-btn-primary" disabled={carregando}>
              {carregando ? 'Criando conta...' : 'Criar conta e continuar'}
            </button>

            <div style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ marginBottom: '12px', color: 'rgba(226, 232, 240, 0.7)', fontSize: '14px' }}>
                ou
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSignIn}
                  onError={() => {
                    setErro('Erro ao fazer login com Google');
                  }}
                  useOneTap={false}
                />
              </div>
            </div>

            <div className="cadastro-footer">
              <span>
                Ao criar sua conta, voce concorda com nossos{' '}
                <button
                  type="button"
                  className="cadastro-link"
                  onClick={() => navigate('/termos')}
                >
                  Termos de Uso
                </button>
                {' '}e{' '}
                <button
                  type="button"
                  className="cadastro-link"
                  onClick={() => navigate('/privacidade')}
                >
                  Politica de Privacidade
                </button>
              </span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Cadastro;
