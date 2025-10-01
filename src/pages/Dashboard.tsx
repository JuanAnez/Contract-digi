import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import contractService from '../services/contractService';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const [searchType, setSearchType] = useState('SIF');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await contractService.search(searchType, searchValue);
      console.log('Search result:', result);

      if (result && result.data) {
        // Navegar a ContractView con los parámetros de búsqueda
        navigate(`/contract?searchType=${searchType}&orderNumber=${searchValue}`);
      } else {
        setError('No se encontraron resultados');
      }
    } catch (err: any) {
      setError(err.message || 'Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>DigitaContract</h1>
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
          <h2>Búsqueda de Contratos</h2>

          <form onSubmit={handleSearch} className="search-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="searchType">Tipo de Búsqueda</label>
                <select
                  id="searchType"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="form-select"
                >
                  <option value="SIF">SIF (Sales Input Form)</option>
                  <option value="COPS">COPS</option>
                  <option value="HISTORY">Historial</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="searchValue">
                  {searchType === 'SIF' && 'Número de Orden'}
                  {searchType === 'COPS' && 'BAN'}
                  {searchType === 'HISTORY' && 'Contract UID'}
                </label>
                <input
                  id="searchValue"
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={`Ingrese ${searchType === 'SIF' ? 'número de orden' : searchType === 'COPS' ? 'BAN' : 'Contract UID'}`}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-search">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          <div className="search-examples">
            <h3>Ejemplos:</h3>
            <ul>
              <li><strong>SIF:</strong> 709491212</li>
              <li><strong>COPS:</strong> 757-123-14574</li>
              <li><strong>HISTORY:</strong> CBRO-I-12345</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

