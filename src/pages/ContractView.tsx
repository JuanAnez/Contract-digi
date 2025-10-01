import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SignaturePad from 'signature_pad';
import authService from '../services/authService';
import contractService, { ContractPayload } from '../services/contractService';
import '../styles/ContractView.css';

const ContractView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchType = searchParams.get('searchType') || 'SIF';
  const orderNumber = searchParams.get('orderNumber') || '';

  const [contractData, setContractData] = useState<ContractPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadContractData();
  }, [searchType, orderNumber]);

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
      const data = await contractService.getPrefillByType(searchType, orderNumber);
      setContractData(data);
    } catch (err: any) {
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
      await contractService.saveSignature(contractData.contractUid, signatureData);
      alert('Firma guardada exitosamente');
      setShowSignature(false);

      // Descargar PDF firmado
      const pdfBlob = await contractService.downloadSignedPdf(contractData.contractUid);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato_${contractData.contractUid}_firmado.pdf`;
      link.click();
    } catch (err: any) {
      setError(err.message || 'Error guardando firma');
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
    <div className="contract-view-container">
      <header className="contract-header">
        <h1>Contrato Digital</h1>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Volver
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {contractData && (
        <div className="contract-content">
          <div className="contract-info">
            <h2>Información del Contrato</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Fuente:</label>
                <span>{contractData.source}</span>
              </div>
              <div className="info-item">
                <label>Contract UID:</label>
                <span>{contractData.contractUid}</span>
              </div>
              <div className="info-item">
                <label>Orden:</label>
                <span>{contractData.orderId}</span>
              </div>
              <div className="info-item">
                <label>BAN:</label>
                <span>{contractData.ban}</span>
              </div>
            </div>

            {contractData.customer && (
              <>
                <h3>Información del Cliente</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nombre:</label>
                    <span>{contractData.customer.fullName}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{contractData.customer.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Teléfono:</label>
                    <span>{contractData.customer.phone}</span>
                  </div>
                </div>
              </>
            )}

            {contractData.planAndServices?.plan && (
              <>
                <h3>Plan</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nombre:</label>
                    <span>{contractData.planAndServices.plan.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Precio Base:</label>
                    <span>${contractData.planAndServices.plan.basePrice}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="contract-actions">
            <button onClick={handleGeneratePdf} className="btn-generate">
              Generar PDF
            </button>

            {pdfUrl && (
              <>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-view">
                  Ver PDF
                </a>
                <button onClick={() => setShowSignature(true)} className="btn-sign">
                  Firmar Contrato
                </button>
              </>
            )}
          </div>

          {showSignature && (
            <div className="signature-modal">
              <div className="signature-content">
                <h3>Firma del Cliente</h3>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  style={{ border: '1px solid #ccc', cursor: 'crosshair' }}
                />
                <div className="signature-actions">
                  <button onClick={handleClearSignature} className="btn-clear">
                    Limpiar
                  </button>
                  <button onClick={handleSaveSignature} className="btn-save">
                    Guardar Firma
                  </button>
                  <button onClick={() => setShowSignature(false)} className="btn-cancel">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractView;

