import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, Plus, FileText } from 'lucide-react';
import authService from '../services/authService';

const CreateContract: React.FC = () => {
  const [contractUid, setContractUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractUid.trim()) {
      setError('Por favor ingresa un UID de contrato válido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar si el contrato existe
      const response = await authService.getContractByUid(contractUid);
      if (response.success) {
        // Si el contrato existe, ir a la vista del contrato
        navigate(`/contract/${contractUid}`);
      } else {
        setError('Contrato no encontrado');
      }
    } catch (error: any) {
      console.error('Error verificando contrato:', error);
      setError('Error al verificar el contrato. Verifica que el UID sea correcto.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    // Para crear un nuevo contrato, necesitamos un UID único
    const newUid = `CONTRACT-${Date.now()}`;
    navigate(`/contract/${newUid}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/contracts')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Contratos
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Crear o Buscar Contrato</h1>
          <p className="mt-2 text-gray-600">Ingresa un UID de contrato existente o crea uno nuevo</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Buscar Contrato Existente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Buscar Contrato Existente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contractUid">UID del Contrato</Label>
                  <Input
                    id="contractUid"
                    type="text"
                    value={contractUid}
                    onChange={(e) => setContractUid(e.target.value)}
                    placeholder="Ej: CONTRACT-12345"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Buscando...' : 'Buscar Contrato'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Crear Nuevo Contrato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Crear Nuevo Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Crea un nuevo contrato digital con firmas electrónicas.
                </p>
                
                <div className="space-y-2">
                  <Label>Funcionalidades:</Label>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Captura de datos del cliente</li>
                    <li>• Selección de plan y servicios</li>
                    <li>• Firmas digitales</li>
                    <li>• Generación de PDF</li>
                    <li>• Envío por email</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleCreateNew}
                  className="w-full"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nuevo Contrato
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">¿Cómo funciona?</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Buscar Contrato:</strong> Si ya tienes un UID de contrato, puedes buscarlo y continuar con el proceso de firma.</p>
            <p><strong>Crear Nuevo:</strong> Genera un nuevo contrato con un UID único y comienza el proceso desde cero.</p>
            <p><strong>Proceso:</strong> Una vez creado o encontrado el contrato, podrás capturar las firmas digitales y generar el PDF final.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateContract;

