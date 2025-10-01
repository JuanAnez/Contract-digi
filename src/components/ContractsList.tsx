import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

interface Contract {
  id: string;
  contractUid: string;
  contractType: string;
  accountType: string;
  banNumber: string;
  subscriberNumber: string;
  status: string;
  statusMessage: string;
  createdAt: string;
  updatedAt: string;
  customerSignedAt?: string;
  agentSignedAt?: string;
}

const ContractsList: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    loadContracts();
  }, [filterStatus]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (filterStatus === 'ALL') {
        response = await authService.getAllContracts();
      } else {
        response = await authService.getContractsByStatus(filterStatus);
      }
      
      if (response.status === 200) {
        setContracts(response.data || []);
      } else {
        setError('Error cargando contratos');
      }
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Error conectando con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING_SIGNATURE':
        return 'bg-yellow-100 text-yellow-800';
      case 'SIGNED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Borrador';
      case 'PENDING_SIGNATURE':
        return 'Pendiente Firma';
      case 'SIGNED':
        return 'Firmado';
      case 'DECLINED':
        return 'Rechazado';
      case 'EXPIRED':
        return 'Expirado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewContract = (uid: string) => {
    navigate(`/contract/${uid}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadContracts}
                className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Contratos Digitales</h1>
        <div className="flex space-x-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="DRAFT">Borrador</option>
            <option value="PENDING_SIGNATURE">Pendiente Firma</option>
            <option value="SIGNED">Firmado</option>
            <option value="DECLINED">Rechazado</option>
            <option value="EXPIRED">Expirado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
          <button
            onClick={loadContracts}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{contracts.length}</div>
          <div className="text-sm text-gray-600">Total Contratos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {contracts.filter(c => c.status === 'SIGNED').length}
          </div>
          <div className="text-sm text-gray-600">Firmados</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {contracts.filter(c => c.status === 'PENDING_SIGNATURE').length}
          </div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-600">
            {contracts.filter(c => c.status === 'DRAFT').length}
          </div>
          <div className="text-sm text-gray-600">Borradores</div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {contracts.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No hay contratos disponibles
            </li>
          ) : (
            contracts.map((contract) => (
              <li key={contract.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                          {getStatusText(contract.status)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contract.contractUid}
                        </p>
                        <p className="text-sm text-gray-500">
                          {contract.contractType} • {contract.accountType}
                        </p>
                        <p className="text-sm text-gray-500">
                          BAN: {contract.banNumber} • Sub: {contract.subscriberNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      <div>Creado: {formatDate(contract.createdAt)}</div>
                      {contract.customerSignedAt && (
                        <div>Firmado: {formatDate(contract.customerSignedAt)}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleViewContract(contract.contractUid)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Ver Contrato
                    </button>
                  </div>
                </div>
                {contract.statusMessage && (
                  <div className="mt-2 text-sm text-gray-600">
                    {contract.statusMessage}
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default ContractsList;

