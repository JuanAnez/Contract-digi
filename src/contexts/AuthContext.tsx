import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, User } from '../types/auth';
import authService from '../services/authService';

interface AuthContextType extends AuthState {
  loginSSO: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<boolean>;
  handleAzureCallback: (code: string, state?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Verificar si hay token en localStorage al cargar la app
    const token = localStorage.getItem('token');
    if (token) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        token,
        loading: false
      }));
    } else {
      setAuthState(prev => ({
        ...prev,
        loading: false
      }));
    }
  }, []);

  const loginSSO = () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    authService.loginSSO();
  };

  const login = async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const token = await authService.login(username, password);
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: { username, email: username, displayName: username },
        token,
        loading: false,
        error: null
      }));
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error en el login'
      }));
    }
  };

  const handleAzureCallback = async (code: string, state?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const response = await authService.handleAzureCallback(code, state);
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: { username: response.username || 'azure_user', email: response.username || 'azure_user', displayName: response.username || 'Azure User' },
        token: response.accessToken || response.data,
        loading: false,
        error: null
      }));
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error en el callback de Azure AD'
      }));
    }
  };

  const logout = async () => {
    try {
      const success = await authService.logout();
      console.log('Logout exitoso, limpiando estado...');
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      });
      return success;
    } catch (error) {
      console.error('Error en logout:', error);
      // Aún así limpiamos el estado local
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      });
      return false;
    }
  };

  const value: AuthContextType = {
    ...authState,
    loginSSO,
    login,
    logout,
    handleAzureCallback
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
