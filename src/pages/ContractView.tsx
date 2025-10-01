import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import SignaturePad from 'signature_pad';
import authService from '../services/authService';
import contractService, { ContractPayload } from '../services/contractService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Phone, Mail, Calendar, MapPin, User, CreditCard, Package } from 'lucide-react';
import '../styles/ContractView.css';

const ContractView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { uid } = useParams<{ uid: string }>();
  
  // Determinar si es navegación directa por UID o búsqueda
  const isDirectNavigation = !!uid;
  const searchType = searchParams.get('searchType') || 'SIF';
  const orderNumber = searchParams.get('orderNumber') || '';

  const [contractData, setContractData] = useState<ContractPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureType, setSignatureType] = useState<'customer' | 'consultant'>('customer');
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [consultantSignature, setConsultantSignature] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<'draft' | 'signed' | 'delivered'>('draft');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadContractData();
  }, [searchType, orderNumber, uid, isDirectNavigation]);

  useEffect(() => {
    if (showSignature && canvasRef.current) {
      signaturePadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
      });
    }
  }, [showSignature]);

  const loadContractData = async () => {
    try {
      setLoading(true);
      setError('');
      
      let data: ContractPayload;
      
      if (isDirectNavigation && uid) {
        // Navegación directa desde lista de contratos
        console.log('Loading contract data for UID:', uid);
        data = await contractService.getContractByUid(uid);
      } else {
        // Búsqueda desde dashboard
        console.log('Loading contract data for search:', searchType, orderNumber);
        data = await contractService.getPrefillByType(searchType, orderNumber);
      }
      
      setContractData(data);
      
      // Debug: Verificar el estado del contrato
      console.log('Frontend: Contract status =', data.status);
      console.log('Frontend: Contract statusMessage =', data.statusMessage);
      console.log('Frontend: Contract data =', data);
      
      // Detectar el estado del contrato
      // Verificar si el contrato ya está firmado basado en el status o statusMessage
      const isSigned = data.status === 'SIGNED' || 
                      data.status === 'DELIVERED' || 
                      (data.statusMessage && data.statusMessage.includes('signed')) ||
                      (data.statusMessage && data.statusMessage.includes('firmado'));
      
      if (isSigned) {
        setContractStatus('signed');
        console.log('Frontend: Contract detected as SIGNED');
        // Si el contrato ya está firmado, cargar las firmas existentes
        if (data.status === 'SIGNED') {
          // TODO: Cargar firmas existentes desde el backend si es necesario
          setCustomerSignature('data:image/png;base64,existing-signature'); // Placeholder
          setConsultantSignature('data:image/png;base64,existing-signature'); // Placeholder
        }
      } else {
        setContractStatus('draft');
        console.log('Frontend: Contract detected as DRAFT');
      }
      
    } catch (err: any) {
      console.error('Error loading contract data:', err);
      setError(err.message || 'Error cargando datos del contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!contractData) return;

    try {
      setError('');
      // Primero crear el contrato si no existe
      if (!contractData.contractUid || contractData.contractUid === '') {
        const createResponse = await contractService.createContract(contractData);
        setContractData({ ...contractData, contractUid: createResponse.data.contractUid });
      }

      // Generar PDF
      const pdfBlob = await contractService.generatePdf(contractData.contractUid);
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (err: any) {
      setError(err.message || 'Error generando PDF');
    }
  };

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const handleSaveSignature = async () => {
    if (!contractData || !signaturePadRef.current) return;

    if (signaturePadRef.current.isEmpty()) {
      alert('Por favor firme el contrato');
      return;
    }

    try {
      const signatureData = signaturePadRef.current.toDataURL();
      
      // Actualizar el estado local (no se guarda en DB)
      if (signatureType === 'customer') {
        setCustomerSignature(signatureData);
      } else {
        setConsultantSignature(signatureData);
      }
      
      alert('Firma capturada exitosamente');
      setShowSignature(false);
    } catch (err: any) {
      setError(err.message || 'Error capturando firma');
    }
  };

  const handleGeneratePdfWithSignatures = async () => {
    if (!contractData) return;

    try {
      setError('');
      setGeneratingPdf(true);
      
      // Crear el contrato si no existe
      if (!contractData.contractUid || contractData.contractUid === '') {
        const createResponse = await contractService.createContract(contractData);
        setContractData({ ...contractData, contractUid: createResponse.data.contractUid });
      }

      // Debug: Verificar el contractUid
      console.log('Frontend: contractData.contractUid =', contractData.contractUid);
      console.log('Frontend: typeof contractData.contractUid =', typeof contractData.contractUid);

      // Generar PDF con las firmas
      const signatures = {
        customerSignature: customerSignature || '',
        consultantSignature: consultantSignature || ''
      };
      
      const pdfBlob = await contractService.generateAndSendContract(contractData.contractUid, signatures);
      
      // Descargar el PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato_${contractData.contractUid}_firmado.pdf`;
      link.click();
      
      // Actualizar estado del contrato
      setContractStatus('signed');
      
      alert('PDF generado y enviado exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error generando PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleResendEmail = async () => {
    if (!contractData?.contractUid) return;
    
    try {
      setError('');
      setGeneratingPdf(true);
      await contractService.resendEmail(contractData.contractUid);
      alert('Email reenviado exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error reenviando email');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!contractData?.contractUid) return;
    
    try {
      setError('');
      const pdfBlob = await contractService.downloadExistingPdf(contractData.contractUid);
      
      // Crear enlace de descarga
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato_${contractData.contractUid}_firmado.pdf`;
      link.click();
      
      // Limpiar URL
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Error descargando PDF');
    }
  };

  const handleViewPdf = async () => {
    if (!contractData?.contractUid) return;
    
    try {
      setError('');
      await contractService.viewExistingPdf(contractData.contractUid);
    } catch (err: any) {
      setError(err.message || 'Error abriendo PDF');
    }
  };

  const handlePrintPdf = async () => {
    if (!contractData?.contractUid) return;
    
    try {
      setError('');
      // Descargar PDF y abrir diálogo de impresión
      const pdfBlob = await contractService.downloadExistingPdf(contractData.contractUid);
      const url = URL.createObjectURL(pdfBlob);
      
      // Crear una nueva ventana para imprimir
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          // Esperar a que el PDF se cargue completamente antes de imprimir
          setTimeout(() => {
            printWindow.print();
            // Cerrar la ventana después de imprimir
            printWindow.onafterprint = () => {
              printWindow.close();
              URL.revokeObjectURL(url);
            };
          }, 1000);
        };
      } else {
        // Fallback: usar iframe si no se puede abrir ventana nueva
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        iframe.src = url;
        document.body.appendChild(iframe);
        
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.print();
            // Esperar más tiempo antes de limpiar
            setTimeout(() => {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(url);
            }, 5000);
          }, 1000);
        };
      }
    } catch (err: any) {
      setError(err.message || 'Error preparando impresión');
    }
  };

  if (loading) {
    return <div className="loading">Cargando datos del contrato...</div>;
  }

  if (error && !contractData) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')}>Volver al Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="dashboard-header">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Contrato Digital</h1>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline" 
            className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600"
          >
            ← Volver
          </Button>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {contractData && (
          <>
            {/* Header con logo de Claro */}
            <Card className="bg-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white text-red-600 px-4 py-2 rounded font-bold text-xl">
                      CLARO
                    </div>
                    <div className="text-sm">
                      <p>{contractData?.saleInfo?.store?.name || 'CENTRO ATENCION CLIENTE'}</p>
                      <p>{contractData?.saleInfo?.store?.address || 'Dirección de la tienda'}</p>
                      <p>{contractData?.saleInfo?.store?.phone || '787-775-0000'} | www.claropr.com</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Título del Contrato */}
            <Card>
              <CardContent className="p-6 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-2">
                  CONTRATO ÚNICO DE SERVICIO MÓVIL POSPAGO
                </h1>
              </CardContent>
            </Card>

            {/* Información del Contrato */}
            <Card>
              <CardHeader className="bg-red-600 text-white">
                <CardTitle className="text-lg font-semibold">Información del Contrato</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Fuente:</p>
                    <p className="font-semibold">{contractData.source}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contract UID:</p>
                    <p className="font-semibold">{contractData.contractUid}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Orden:</p>
                    <p className="font-semibold">{contractData.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">BAN:</p>
                    <p className="font-semibold">{contractData.ban}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información del Cliente */}
            {contractData.customer && (
              <Card>
                <CardHeader className="bg-red-600 text-white">
                  <CardTitle className="text-lg font-semibold">Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nombre Completo:</p>
                      <p className="font-semibold">{contractData.customer.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email:</p>
                      <p className="font-semibold">{contractData.customer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono:</p>
                      <p className="font-semibold">{contractData.customer.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de ID:</p>
                      <p className="font-semibold">{contractData.customer.idType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Número de ID:</p>
                      <p className="font-semibold">{contractData.customer.idNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dirección:</p>
                      <p className="font-semibold">
                        {contractData.customer.billingAddress ? 
                          `${contractData.customer.billingAddress.line1}, ${contractData.customer.billingAddress.city}, ${contractData.customer.billingAddress.state} ${contractData.customer.billingAddress.zip}` :
                          'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fecha de Compra:</p>
                      <p className="font-semibold">
                        {contractData.saleInfo?.saleDate ? 
                          new Date(contractData.saleInfo.saleDate).toLocaleDateString() :
                          'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Número de Cuenta:</p>
                      <p className="font-semibold">{contractData.ban}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Número Suscriptor:</p>
                      <p className="font-semibold">{contractData.subscriberNumber || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Equipos y Accesorios */}
            <Card>
              <CardHeader className="bg-red-600 text-white">
                <CardTitle className="text-lg font-semibold">Equipos y Accesorios</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Código</th>
                        <th className="text-left p-2 font-semibold">Descripción</th>
                        <th className="text-left p-2 font-semibold">Núm. Serie</th>
                        <th className="text-left p-2 font-semibold">Precio</th>
                        <th className="text-left p-2 font-semibold">Impuestos</th>
                        <th className="text-left p-2 font-semibold">Pagos Diferidos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractData.devices?.map((device: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{device.sku}</td>
                          <td className="p-2">{device.description}</td>
                          <td className="p-2">{device.serial}</td>
                          <td className="p-2">${device.price}</td>
                          <td className="p-2">${device.tax}</td>
                          <td className="p-2">{device.financing?.installments || 'N/A'}</td>
                        </tr>
                      )) || (
                        <tr className="border-b">
                          <td className="p-2">32349H</td>
                          <td className="p-2">iPhone 10 Pro Max 1TB</td>
                          <td className="p-2">353548680360432</td>
                          <td className="p-2">$989.39</td>
                          <td className="p-2">$115.00</td>
                          <td className="p-2">36</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Productos y Servicios */}
            <Card>
              <CardHeader className="bg-red-600 text-white">
                <CardTitle className="text-lg font-semibold">Productos y Servicios</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Plan Mensual Primario</h4>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Descripción:</p>
                      <p className="font-semibold">{contractData.planAndServices?.plan?.name || 'Plan mensual postpago'}</p>
                      <p className="text-sm text-gray-600 mt-2">Detalles:</p>
                      <p className="text-sm">
                        {contractData.planAndServices?.plan?.features?.join(', ') || 'Llamadas, Texto, Multimedia, Roaming, Larga Distancia, Data Ilimitada PR/USA/MX/Can'}
                      </p>
                      <p className="text-green-600 font-semibold mt-2">${contractData.planAndServices?.plan?.basePrice || '50.00'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Servicios Adicionales</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {contractData.planAndServices?.addons?.map((addon: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{addon.description}:</span>
                          <span className="font-semibold">${addon.price}</span>
                        </div>
                      )) || (
                        <>
                          <div className="flex justify-between">
                            <span>911:</span>
                            <span className="font-semibold">$0.50</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Geabusbgrb:</span>
                            <span className="font-semibold">$19.99</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Totales */}
            <Card>
              <CardHeader className="bg-red-600 text-white">
                <CardTitle className="text-lg font-semibold">$ Totales</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Mensualidad Total Aproximada:</span>
                    <span className="text-green-600 font-bold text-xl">
                      ${contractData.totals?.estimatedMonthly || '94.28'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Estimado Próxima Factura:</span>
                    <span className="text-blue-600 font-bold text-xl">
                      ${contractData.totals?.nextBillEstimate?.estimatedTotal || '56.92'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Firmas Digitales - Solo mostrar si NO es navegación directa desde lista */}
            {!isDirectNavigation && (
              <Card>
                <CardHeader className="bg-red-600 text-white">
                  <CardTitle className="text-lg font-semibold">Firmas Digitales</CardTitle>
                  <p className="text-sm">
                    {contractStatus === 'signed' ? 
                      'Contrato ya firmado y generado' : 
                      'Capture las firmas del cliente y consultor'
                    }
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {/* Firma del Cliente */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 text-lg">Firma autorizada cliente:</h4>
                      <div className="border-2 border-dashed border-gray-400 rounded-lg p-6 min-h-[120px] flex items-center justify-center">
                        {customerSignature ? (
                          <img src={customerSignature} alt="Firma del cliente" className="max-w-full max-h-24" />
                        ) : (
                          <p className="text-gray-500 text-center">
                            Haga clic en "Capturar Firma" para firmar
                          </p>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{contractData.customer?.fullName}</p>
                        <p className="text-sm text-gray-600">Fecha/Hora: {new Date().toLocaleString()}</p>
                      </div>
                      {contractStatus === 'draft' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSignatureType('customer');
                              setShowSignature(true);
                            }}
                            className="flex-1"
                          >
                            Capturar Firma
                          </Button>
                          {customerSignature && (
                            <Button 
                              variant="outline" 
                              onClick={() => setCustomerSignature(null)}
                              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                              Borrar Firma
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Firma del Consultor */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 text-lg">Firma autorizada consultor:</h4>
                      <div className="border-2 border-dashed border-gray-400 rounded-lg p-6 min-h-[120px] flex items-center justify-center">
                        {consultantSignature ? (
                          <img src={consultantSignature} alt="Firma del consultor" className="max-w-full max-h-24" />
                        ) : (
                          <p className="text-gray-500 text-center">
                            Haga clic en "Capturar Firma" para firmar
                          </p>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">
                          {contractData?.saleInfo?.seller?.name || 'Consultor'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Comp Id. Consultor: {contractData?.saleInfo?.seller?.employeeId || 'N/A'}
                        </p>
                      </div>
                      {contractStatus === 'draft' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSignatureType('consultant');
                              setShowSignature(true);
                            }}
                            className="flex-1"
                          >
                            Capturar Firma
                          </Button>
                          {consultantSignature && (
                            <Button 
                              variant="outline" 
                              onClick={() => setConsultantSignature(null)}
                              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                              Borrar Firma
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Acciones del Contrato */}
            <Card>
              <CardContent className="pt-6">
                {isDirectNavigation ? (
                  // Vista de solo lectura desde lista de contratos - Siempre mostrar botones de acción
                  <>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Vista de Contrato
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Este contrato está en modo de solo lectura.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={handleViewPdf}
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver PDF
                      </Button>
                      
                      <Button 
                        onClick={handleDownloadPdf}
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Descargar PDF
                      </Button>
                      
                      <Button 
                        onClick={handleResendEmail}
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                        disabled={generatingPdf}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {generatingPdf ? 'Reenviando...' : 'Reenviar Email'}
                      </Button>
                      
                      <Button 
                        onClick={handlePrintPdf}
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir
                      </Button>
                    </div>
                  </>
                ) : contractStatus === 'draft' ? (
                  // Estado: Borrador - Mostrar botón para generar PDF (solo en modo edición)
                  <>
                    <Button 
                      onClick={handleGeneratePdfWithSignatures}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg"
                      disabled={!customerSignature || !consultantSignature || generatingPdf}
                    >
                      {generatingPdf ? (
                        <div className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generando PDF...
                        </div>
                      ) : (
                        'Generar PDF'
                      )}
                    </Button>
                    {generatingPdf && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-center gap-3">
                          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <div className="text-center">
                            <p className="text-blue-800 font-medium">Generando contrato...</p>
                            <p className="text-blue-600 text-sm">Guardando firmas, generando PDF y enviando por email</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {(!customerSignature || !consultantSignature) && !generatingPdf && (
                      <p className="text-sm text-gray-600 text-center mt-2">
                        Ambas firmas son requeridas para generar el PDF
                      </p>
                    )}
                  </>
                ) : (
                  // Estado: Firmado - Mostrar opciones para PDF existente (solo en modo edición)
                  <>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Contrato Firmado y Generado
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        El PDF ya ha sido generado. Puedes reenviarlo, descargarlo o verlo.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={handleResendEmail}
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                        disabled={generatingPdf}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {generatingPdf ? 'Reenviando...' : 'Reenviar Email'}
                      </Button>
                      
                      <Button 
                        onClick={handleDownloadPdf}
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Descargar PDF
                      </Button>
                      
                      <Button 
                        onClick={handleViewPdf}
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver PDF
                      </Button>
                      
                      <Button 
                        onClick={handlePrintPdf}
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Modal de Firma */}
        {showSignature && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">
                {signatureType === 'customer' ? 'Firma del Cliente' : 'Firma del Consultor'}
              </h3>
              <div className="space-y-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="border border-gray-300 rounded-lg cursor-crosshair w-full"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleClearSignature}>
                    Borrar Firma
                  </Button>
                  <Button 
                    onClick={handleSaveSignature}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Guardar Firma
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSignature(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContractView;

