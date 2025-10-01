import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/LoginForm';
import Dashboard from '../components/Dashboard';

const Home: React.FC = () => {
  const { isAuthenticated, handleAzureCallback, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay parámetros de callback de Azure AD en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
      handleAzureCallback(code, state || undefined);
    }
  }, [handleAzureCallback]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirigir al Dashboard original después del login
    navigate('/dashboard');
    return null;
  }

  return <LoginForm />;
};

export default Home;
