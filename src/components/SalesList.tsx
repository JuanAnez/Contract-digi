import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, ChevronLeft, ChevronRight, Eye, FileText } from 'lucide-react';
import contractService from '../services/contractService';

interface SalesContract {
  id: string;
  contractUid: string;
  contractType: string;
  accountType: string;
  banNumber: string;
  subscriberNumber: string;
  sourceSystem: string;
  externalId: string;
  templateId: string;
  version: number;
  status: string;
  statusMessage: string;
  fileUri: string;
  fileSha256: string;
  signedPdfUri: string;
  signedPdfSha256: string;
  signedPdfPath: string;
  pdfStorageType: string;
  pdfGeneratedAt: string;
  customerSignedAt: string;
  agentSignedAt: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

interface SalesListProps {
  onViewContract: (contractUid: string) => void;
}

const SalesList: React.FC<SalesListProps> = ({ onViewContract }) => {
  const [contracts, setContracts] = useState<SalesContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    loadContracts();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      console.log('Loading contracts...');
      
      const response = await contractService.getContractsPaginated(
        currentPage - 1, // Backend uses 0-based indexing
        itemsPerPage,
        searchTerm || undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      
      console.log('Contracts response:', response);
      
      if (response.success && response.data) {
        console.log('Contracts data:', response.data);
        setContracts(response.data.contracts || []);
        setTotalItems(response.data.totalItems || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        console.log('No contracts found or error in response');
        console.log('Response success:', response.success);
        console.log('Response data:', response.data);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  // No need for client-side filtering since we're using server-side pagination

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'signed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'signed': return 'Firmado';
      case 'pending': return 'Pendiente';
      case 'draft': return 'Borrador';
      case 'delivered': return 'Entregado';
      default: return status;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lista de Contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando ventas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <FileText className="h-5 w-5" />
          Lista de Contratos
        </h2>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por UID del contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="pending">Pendiente</option>
              <option value="signed">Firmado</option>
              <option value="delivered">Entregado</option>
            </select>
            <Button 
              type="submit" 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              Buscar
            </Button>
          </form>
        </div>



        {/* Contracts List */}
        {contracts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'No se encontraron ventas que coincidan con los filtros.'
                : 'No hay ventas disponibles.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div key={contract.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg">Contrato {contract.contractUid}</h3>
                        <Badge className={getStatusColor(contract.status)}>
                          {getStatusText(contract.status)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">UID:</span> 
                          <span className="text-gray-900">{contract.contractUid}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">Tipo:</span> 
                          <span className="text-gray-900">{contract.contractType}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">BAN:</span> 
                          <span className="text-gray-900">{contract.banNumber}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">Fuente:</span> 
                          <span className="text-gray-900">{contract.sourceSystem}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">Creado:</span> 
                          <span className="text-gray-900">{new Date(contract.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-col sm:col-span-2 lg:col-span-1">
                          <span className="font-medium text-gray-700">Estado:</span> 
                          <span className="text-gray-900">{contract.statusMessage || 'Sin mensaje'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end sm:ml-4 sm:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewContract(contract.contractUid)}
                        className="flex items-center gap-2 w-full sm:w-auto hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Results Summary - Pie de página */}
            <div className="mt-4 text-center text-sm text-gray-500">
              Mostrando {contracts.length} de {totalItems} contratos
              {searchTerm && ` (filtrado por "${searchTerm}")`}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesList;
