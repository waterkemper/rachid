import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  usuario: Usuario | null;
  carregando: boolean;
  login: (usuario: Usuario) => void;
  logout: () => void;
  verificarAutenticacao: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const verificarAutenticacao = async () => {
    try {
      const usuarioAtual = await authApi.me();
      setUsuario(usuarioAtual);
    } catch (error) {
      // Se nÃ£o estiver autenticado, apenas limpar o usuÃ¡rio
      // NÃ£o fazer nada mais, pois o interceptor jÃ¡ trata o redirecionamento
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    // Só verificar autenticação se não estiver na página de login, cadastro ou home
    // Isso evita loops infinitos
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/cadastro' && path !== '/home' && path !== '/') {
      verificarAutenticacao();
    } else {
      // Se estiver em página pública, apenas marcar como não carregando
      setCarregando(false);
    }
  }, []);

  const login = (usuarioData: Usuario) => {
    setUsuario(usuarioData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUsuario(null);
    }
  };

  const isAdmin = () => {
    return usuario?.role === 'ADMIN';
  };

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout, verificarAutenticacao, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

