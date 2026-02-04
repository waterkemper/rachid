import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario } from '../../shared/types';
import { authApi } from '../services/api';
import { STORAGE_KEYS } from '../constants/config';

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
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        setUsuario(null);
        setCarregando(false);
        return;
      }

      const usuarioAtual = await authApi.me();
      setUsuario(usuarioAtual);
    } catch (error) {
      // Se não estiver autenticado, limpar token e usuário
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  const login = async (usuarioData: Usuario, token: string) => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    setUsuario(usuarioData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      setUsuario(null);
    }
  };

  const refreshUser = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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

