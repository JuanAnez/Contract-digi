import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import contractService from '../services/contractService';
import SalesList from '../components/SalesList';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const [searchType, setSearchType] = useState('SIF');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearchResult(null);

    try {
      const result = await contractService.search(searchType, searchValue);
      console.log('Search result:', result);

      if (result && result.data) {
        setSearchResult(result.data);
      } else {
        setError('No se encontraron resultados');
      }
    } catch (err: any) {
      setError(err.message || 'Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = () => {
    if (searchResult) {
      navigate(`/contract?searchType=${searchType}&orderNumber=${searchValue}`);
    }
  };

  const handleViewContract = (contractUid: string) => {
    navigate(`/contract/${contractUid}`);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Contratos Digitales</h1>
          <div className="user-info">
            <span>Bienvenido, {user?.username}</span>
            <button onClick={handleLogout} className="btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="search-container">
          <div className="search-header">
            <h2>
              <svg className="search-icon-black" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Búsqueda Avanzada de Ventas
            </h2>
            <p>Selecciona el tipo de búsqueda e ingresa los datos requeridos</p>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="search-type-section">
              <label className="search-type-label">Tipo de Búsqueda:</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="searchType"
                    value="SIF"
                    checked={searchType === 'SIF'}
                    onChange={(e) => setSearchType(e.target.value)}
                  />
                  <span>Venta Nueva (SIF)</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="searchType"
                    value="COPS"
                    checked={searchType === 'COPS'}
                    onChange={(e) => setSearchType(e.target.value)}
                  />
                  <span>Venta Nueva (COPS)</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="searchType"
                    value="HISTORY"
                    checked={searchType === 'HISTORY'}
                    onChange={(e) => setSearchType(e.target.value)}
                  />
                  <span>Historial</span>
                </label>
              </div>
            </div>

            <div className="input-section">
              <div className="input-group">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchType === 'SIF' ? 'Número de orden SIF' : searchType === 'COPS' ? 'Número de orden COPS' : 'Contract UID'}
                  className="main-input"
                  required
                />
                {searchType === 'COPS' && (
                  <input
                    type="text"
                    placeholder="Número de orden COPS"
                    className="secondary-input"
                  />
                )}
              </div>
              <button type="submit" disabled={loading} className="btn-search">
                <span className="search-icon"></span> Buscar
              </button>
            </div>
          </form>

          <div className="search-examples">
            <h3>Ejemplos:</h3>
            <ul>
              <li><strong>SIF:</strong> 709491212</li>
              <li><strong>COPS:</strong> 757-123-14574</li>
              <li><strong>HISTORY:</strong> CBRO-I-12345</li>
            </ul>
          </div>

          {/* Resultados de búsqueda */}
          {searchResult && (
            <div className="search-results">
              <h3>Resultado de Búsqueda:</h3>
              <div className="result-details">
                <div className="result-item">
                  <strong>Cliente:</strong> {searchResult.customer?.fullName || 'N/A'}
                </div>
                <div className="result-item">
                  <strong>Estado:</strong> {searchResult.status || 'N/A'}
                </div>
                <div className="result-item">
                  <strong>Plan:</strong> {searchResult.planAndServices?.plan?.name || 'N/A'}
                </div>
                <div className="result-item">
                  <strong>Fecha:</strong> {searchResult.saleInfo?.saleDate || 'N/A'}
                </div>
                <div className="result-item">
                  <strong>Fuente:</strong> {searchResult.source || 'N/A'}
                </div>
              </div>
              
              <button 
                onClick={handleCreateContract}
                className="btn-create-contract"
                disabled={!searchResult}
              >
                Crear Contrato
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Sales List Card */}
        <div className="mt-8">
          <SalesList onViewContract={handleViewContract} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

