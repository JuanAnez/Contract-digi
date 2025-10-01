import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:7001/contract';

export interface ContractPayload {
  source: string;
  contractUid: string;
  orderId: string;
  ban: string;
  subscriberNumber?: string;
  accountType?: string;
  lob?: string;
  customer?: any;
  saleInfo?: any;
  planAndServices?: any;
  devices?: any[];
  totals?: any;
  flags?: any;
  legal?: any;
}

class ContractService {
  // Búsqueda por tipo (SIF, COPS, HISTORY)
  async search(searchType: string, searchValue: string): Promise<any> {
    try {
      const response = await axios.get(
        `${API_URL}/api/search/${searchType.toLowerCase()}/${searchValue}`,
        { headers: authService.getAuthHeader() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Search error:', error);
      throw new Error(error.response?.data?.message || `Error buscando en ${searchType}`);
    }
  }

  // Obtener prefill data por tipo
  async getPrefillByType(searchType: string, identifier: string): Promise<ContractPayload> {
    try {
      const response = await axios.get(
        `${API_URL}/api/contracts/${identifier}/prefill?source=${searchType}`,
        { headers: authService.getAuthHeader() }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Get prefill error:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo datos del contrato');
    }
  }

  // Crear contrato
  async createContract(payload: ContractPayload): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/api/contracts`,
        payload,
        { headers: authService.getAuthHeader() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Create contract error:', error);
      throw new Error(error.response?.data?.message || 'Error creando contrato');
    }
  }

  // Generar PDF
  async generatePdf(contractUid: string): Promise<Blob> {
    try {
      const response = await axios.post(
        `${API_URL}/api/contracts/${contractUid}/generate-pdf`,
        {},
        {
          headers: authService.getAuthHeader(),
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Generate PDF error:', error);
      throw new Error(error.response?.data?.message || 'Error generando PDF');
    }
  }

  // Guardar firma
  async saveSignature(contractUid: string, signatureData: string): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/api/contracts/${contractUid}/signature`,
        { signatureData },
        { headers: authService.getAuthHeader() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Save signature error:', error);
      throw new Error(error.response?.data?.message || 'Error guardando firma');
    }
  }

  // Descargar PDF firmado
  async downloadSignedPdf(contractUid: string): Promise<Blob> {
    try {
      const response = await axios.get(
        `${API_URL}/api/contracts/${contractUid}/signed-pdf`,
        {
          headers: authService.getAuthHeader(),
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Download PDF error:', error);
      throw new Error(error.response?.data?.message || 'Error descargando PDF');
    }
  }
}

export default new ContractService();

