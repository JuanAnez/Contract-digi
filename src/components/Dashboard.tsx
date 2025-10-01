import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Search, FileText, User, Calendar, Mail, Eye } from 'lucide-react';
import authService from '../services/authService';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Sale {
  uid: string;
  customerName: string;
  date: string;
  status: 'completed' | 'pending' | 'in-progress';
  amount: number;
  plan: string;
}

interface Contract {
  id: string;
  contractUid: string;
  contractType: string;
  status: string;
  statusMessage: string;
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchUid, setSearchUid] = useState('');
  const [searchType, setSearchType] = useState<'sif' | 'cops' | 'history'>('sif');
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Cargar contratos al montar el componente
  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoadingContracts(true);
      const response = await authService.getAllContracts();
      if (response.status === 200 && response.data) {
        setContracts(response.data);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleResendContract = async (contractUid: string) => {
    try {
      // Aquí implementarías la lógica para reenviar el contrato
      // Por ahora solo mostramos un alert
      alert(`Reenviando contrato ${contractUid}...`);
    } catch (error) {
      console.error('Error resending contract:', error);
      alert('Error al reenviar el contrato');
    }
  };

  // Datos quemados de ventas
  const sales: Sale[] = [
    {
      uid: 'CBRO-I-12345',
      customerName: 'Juan Pérez',
      date: '2025-09-12',
      status: 'completed',
      amount: 94.28,
      plan: 'Plan mensual postpago'
    },
    {
      uid: 'CBRO-I-12346',
      customerName: 'María García',
      date: '2025-09-11',
      status: 'pending',
      amount: 89.99,
      plan: 'Plan mensual postpago'
    },
    {
      uid: 'CBRO-I-12347',
      customerName: 'Carlos López',
      date: '2025-09-10',
      status: 'in-progress',
      amount: 79.50,
      plan: 'Plan mensual postpago'
    },
    {
      uid: 'CBRO-I-12348',
      customerName: 'Ana Rodríguez',
      date: '2025-09-09',
      status: 'completed',
      amount: 105.75,
      plan: 'Plan mensual postpago'
    },
    {
      uid: 'CBRO-I-12349',
      customerName: 'Luis Martínez',
      date: '2025-09-08',
      status: 'pending',
      amount: 67.25,
      plan: 'Plan mensual postpago'
    }
  ];

  const handleLogout = () => {
    logout();
  };

  const handleSearch = async () => {
    if (!searchUid.trim()) {
      alert('Por favor ingrese un ID único');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchResults(null);
      
      let response;
      switch (searchType) {
        case 'sif':
          response = await authService.searchNewSaleFromSIF(searchUid);
          break;
        case 'cops':
          response = await authService.searchNewSaleFromCOPS(searchUid, orderNumber);
          break;
        case 'history':
          response = await authService.searchHistory(searchUid);
          break;
        default:
          response = await authService.unifiedSearch(searchUid, searchType, orderNumber);
      }

      if (response.status === 200 && response.data) {
        setSearchResults(response.data);
        console.log('Resultado de búsqueda:', response.data);
      } else {
        alert('No se encontraron resultados para la búsqueda');
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      alert('Error en la búsqueda: ' + (error as any).message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCreateContract = (uid: string, searchType?: string, orderNumber?: string) => {
    if (searchType) {
      if (orderNumber) {
        navigate(`/contract/${uid}/${searchType}/${orderNumber}`);
      } else {
        navigate(`/contract/${uid}/${searchType}`);
      }
    } else {
      navigate(`/contract/${uid}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'in-progress':
        return 'En Proceso';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Ventas</h1>
            <p className="text-gray-600">Bienvenido, {user?.username}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </div>

        {/* Buscador Mejorado */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Búsqueda Avanzada de Ventas
            </CardTitle>
            <CardDescription>Selecciona el tipo de búsqueda e ingresa los datos requeridos</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tipo de búsqueda */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tipo de Búsqueda:</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="searchType"
                    value="sif"
                    checked={searchType === 'sif'}
                    onChange={(e) => setSearchType(e.target.value as 'sif' | 'cops' | 'history')}
                    className="mr-2"
                  />
                  Venta Nueva (SIF)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="searchType"
                    value="cops"
                    checked={searchType === 'cops'}
                    onChange={(e) => setSearchType(e.target.value as 'sif' | 'cops' | 'history')}
                    className="mr-2"
                  />
                  Venta Nueva (COPS)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="searchType"
                    value="history"
                    checked={searchType === 'history'}
                    onChange={(e) => setSearchType(e.target.value as 'sif' | 'cops' | 'history')}
                    className="mr-2"
                  />
                  Historial
                </label>
              </div>
            </div>

            {/* Campos de búsqueda */}
            <div className="flex gap-2">
              <Input
                placeholder="ID único de la venta (Ej: CBRO-I-12345)"
                value={searchUid}
                onChange={(e) => setSearchUid(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              {searchType === 'cops' && (
                <Input
                  placeholder="Número de orden COPS"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-48"
                />
              )}
              <Button 
                onClick={handleSearch}
                disabled={searchLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                {searchLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>

            {/* Resultados de búsqueda */}
            {searchResults && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Resultado de Búsqueda:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Cliente:</strong> {searchResults.saleInfo?.customer?.fullName || 'N/A'}
                  </div>
                  <div>
                    <strong>Plan:</strong> {searchResults.saleInfo?.plan?.planName || 'N/A'}
                  </div>
                  <div>
                    <strong>Estado:</strong> {searchResults.saleInfo?.status || 'N/A'}
                  </div>
                  <div>
                    <strong>Fecha:</strong> {searchResults.saleInfo?.saleDate || 'N/A'}
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    onClick={() => handleCreateContract(searchUid, searchType, orderNumber)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Crear Contrato
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultado de búsqueda */}
        {selectedSale && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contrato Encontrado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">UID del Contrato</p>
                  <p className="text-lg font-bold">{selectedSale.uid}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Cliente</p>
                  <p className="text-lg font-bold">{selectedSale.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha</p>
                  <p className="text-lg">{selectedSale.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <Badge className={getStatusColor(selectedSale.status)}>
                    {getStatusText(selectedSale.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Monto Mensual</p>
                  <p className="text-lg font-bold text-green-600">${selectedSale.amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Plan</p>
                  <p className="text-lg">{selectedSale.plan}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={() => navigate(`/contract/${selectedSale.uid}`)}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Contrato Completo
                </Button>
                <Button 
                  onClick={() => navigate(`/contract/${selectedSale.uid}`)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Crear Contrato
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de ventas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Lista de Contratos
            </CardTitle>
            <CardDescription>Ventas recientes del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sales.map((sale) => (
                <div key={sale.uid} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{sale.uid}</p>
                      <p className="text-sm text-gray-600">{sale.customerName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {sale.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">${sale.amount}</p>
                      <p className="text-sm text-gray-600">{sale.plan}</p>
                    </div>
                    <Badge className={getStatusColor(sale.status)}>
                      {getStatusText(sale.status)}
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSearchUid(sale.uid);
                          setSelectedSale(sale);
                        }}
                      >
                        Ver
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/contract/${sale.uid}`)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Crear Contrato
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lista de contratos creados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contratos Creados
            </CardTitle>
            <CardDescription>Contratos generados y guardados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingContracts ? (
              <div className="text-center py-4">
                <p>Cargando contratos...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay contratos creados aún</p>
                <p className="text-sm">Los contratos aparecerán aquí una vez que se creen desde las ventas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{contract.contractUid}</p>
                        <p className="text-sm text-gray-600">{contract.contractType}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={contract.status === 'SIGNED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {contract.status}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">{contract.statusMessage}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/contract/${contract.contractUid}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver PDF
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleResendContract(contract.contractUid)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Reenviar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;