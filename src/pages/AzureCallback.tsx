import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AzureCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { handleAzureCallback } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code) {
      handleAzureCallback(code, state || undefined).then(() => {
        navigate('/dashboard');
      }).catch(error => {
        console.error('Azure callback error:', error);
        navigate('/login?error=azure_callback_failed');
      });
    } else {
      console.error('No authorization code received');
      navigate('/login?error=no_code');
    }
  }, [searchParams, handleAzureCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Procesando autenticación...
        </h2>
        <p className="text-gray-600">
          Por favor espera mientras procesamos tu inicio de sesión con Azure AD.
        </p>
      </div>
    </div>
  );
};

export default AzureCallback;
