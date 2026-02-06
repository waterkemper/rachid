import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario } from '../../shared/types';
import { authApi } from '../services/api';
import { saveToken, getToken, removeToken } from '../services/secureStorage';

interface AuthContextType {
  usuario: Usuario | null;
  carregando: boolean;
  login: (usuario: Usuario, token: string) => Promise<void>;
  logout: () => Promise<void>;
  verificarAutenticacao: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const verificarAutenticacao = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setUsuario(null);
        setCarregando(false);
        return;
      }

      const usuarioAtual = await authApi.me();
      setUsuario(usuarioAtual);
    } catch (error) {
      // Se não estiver autenticado, limpar token e usuário
      await removeToken();
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  const login = async (usuarioData: Usuario, token: string) => {
    await saveToken(token);
    setUsuario(usuarioData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      await removeToken();
      setUsuario(null);
    }
  };

  const refreshUser = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const usuarioAtual = await authApi.me();
      setUsuario(usuarioAtual);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout, verificarAutenticacao, refreshUser }}>
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

