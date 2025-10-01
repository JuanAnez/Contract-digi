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
  // Campos adicionales para contratos existentes
  contractType?: string;
  status?: string;
  statusMessage?: string;
  createdAt?: string;
  updatedAt?: string;
  sourceSystem?: string;
  externalId?: string;
  equipment?: any[];
  services?: any[];
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

  // Obtener datos de un contrato existente por UID
  async getContractByUid(contractUid: string): Promise<ContractPayload> {
    try {
      console.log('ContractService: Getting complete contract data for UID:', contractUid);
      
      const response = await axios.get(
        `${API_URL}/api/contracts/${contractUid}/complete`,
        { headers: authService.getAuthHeader() }
      );
      
      console.log('ContractService: Complete contract response:', response.data);
      
      // El backend devuelve {status: 200, message: "Success", data: {...}}
      if (response.data && response.data.status === 200 && response.data.data) {
        // El backend ya devuelve SalesContractPayload, solo necesitamos convertirlo
        const salesContractPayload = response.data.data;
        return this.convertSalesContractPayloadToContractPayload(salesContractPayload);
      }
      
      throw new Error('Invalid response format from contract endpoint');
    } catch (error: any) {
      console.error('Get contract by UID error:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo datos del contrato');
    }
  }

  // Convertir SalesContractPayload a ContractPayload
  private convertSalesContractPayloadToContractPayload(salesPayload: any): ContractPayload {
    return {
      // Campos requeridos
      source: salesPayload.source || 'DATABASE',
      contractUid: salesPayload.contractUid,
      orderId: salesPayload.orderId,
      ban: salesPayload.ban,
      
      // Campos opcionales
      subscriberNumber: salesPayload.subscriberNumber,
      accountType: salesPayload.accountType,
      lob: salesPayload.lob,
      customer: salesPayload.customer,
      saleInfo: salesPayload.saleInfo,
      planAndServices: salesPayload.planAndServices,
      devices: salesPayload.devices,
      totals: salesPayload.totals,
      flags: salesPayload.flags,
      legal: salesPayload.legal,
      // Campos adicionales para contratos existentes
      sourceSystem: salesPayload.source,
      externalId: salesPayload.orderId,
      equipment: salesPayload.devices || [],
      services: salesPayload.planAndServices ? [salesPayload.planAndServices] : []
    };
  }

  // Convertir ContractRecord a ContractPayload
  private convertContractRecordToPayload(contractRecord: any): ContractPayload {
    return {
      // Campos requeridos
      source: contractRecord.sourceSystem || 'DATABASE',
      contractUid: contractRecord.contractUid,
      orderId: contractRecord.externalId || contractRecord.contractUid,
      ban: contractRecord.banNumber,
      
      // Campos opcionales
      subscriberNumber: contractRecord.subscriberNumber,
      accountType: contractRecord.accountType,
      customer: {
        fullName: 'Cliente del Contrato', // TODO: Obtener de ContractParty
        email: 'cliente@example.com',
        phone: '+17870000000',
        idType: 'SSN',
        idNumber: '000-00-0000',
        billingAddress: {
          line1: 'Dirección del Cliente',
          city: 'Ciudad',
          state: 'PR',
          zip: '00000'
        }
      },
      saleInfo: {
        saleDate: contractRecord.createdAt,
        totalAmount: 0 // TODO: Calcular desde equipment y services
      },
      equipment: [], // TODO: Obtener de tabla de equipment
      services: [], // TODO: Obtener de tabla de services
      sourceSystem: contractRecord.sourceSystem,
      externalId: contractRecord.externalId,
      // Campos adicionales para mostrar información del contrato
      contractType: contractRecord.contractType,
      status: contractRecord.status,
      statusMessage: contractRecord.statusMessage,
      createdAt: contractRecord.createdAt,
      updatedAt: contractRecord.updatedAt
    };
  }

  // Obtener prefill data por tipo
  async getPrefillByType(searchType: string, identifier: string): Promise<ContractPayload> {
    try {
      console.log('ContractService: Getting prefill for:', identifier, 'searchType:', searchType);
      
      let endpoint: string;
      
      // Usar endpoints específicos según el tipo de búsqueda
      switch (searchType.toLowerCase()) {
        case 'sif':
          endpoint = `${API_URL}/api/search/sif/${identifier}`;
          break;
        case 'cops':
          endpoint = `${API_URL}/api/search/cops/${identifier}`;
          break;
        case 'history':
          endpoint = `${API_URL}/api/search/history/${identifier}`;
          break;
        default:
          // Fallback al endpoint unificado
          endpoint = `${API_URL}/api/contracts/${identifier}/prefill`;
      }
      
      console.log('ContractService: Using endpoint:', endpoint);
      
      const response = await axios.get(
        endpoint,
        { headers: authService.getAuthHeader() }
      );
      
      console.log('ContractService: Prefill response:', response.data);
      
      // El backend devuelve {status: 200, message: "Success", data: {...}}
      if (response.data && response.data.status === 200 && response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format from prefill endpoint');
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

  // Obtener todos los contratos
  async getAllContracts(): Promise<any> {
    try {
      console.log('ContractService: Getting all contracts from:', `${API_URL}/api/contracts/list`);
      const response = await axios.get(
        `${API_URL}/api/contracts/list`,
        { headers: authService.getAuthHeader() }
      );
      console.log('ContractService: Response received:', response.data);
      
      // El backend devuelve {status: 200, message: "Success", data: [...]}
      // Necesitamos convertir esto al formato esperado por el frontend
      if (response.data && response.data.status === 200 && response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Get all contracts error:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo lista de contratos');
    }
  }

  // Obtener contratos paginados
  async getContractsPaginated(page: number, size: number, search?: string, status?: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      
      const response = await axios.get(
        `${API_URL}/api/contracts/list/paginated?${params.toString()}`,
        { headers: authService.getAuthHeader() }
      );
      
      // El backend devuelve {status: 200, message: "Success", data: {...}}
      if (response.data && response.data.status === 200 && response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Get paginated contracts error:', error);
      throw new Error(error.response?.data?.message || 'Error obteniendo lista paginada de contratos');
    }
  }


  // Generar y enviar contrato con firmas
  async generateAndSendContract(contractUid: string, signatures: {customerSignature: string, consultantSignature: string}): Promise<Blob> {
    try {
      console.log('ContractService: generateAndSendContract called with contractUid =', contractUid);
      const url = `${API_URL}/api/contracts/${contractUid}/generate-and-send`;
      console.log('ContractService: Request URL =', url);
      
      const response = await axios.post(
        url,
        signatures,
        {
          headers: authService.getAuthHeader(),
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Generate and send contract error:', error);
      throw new Error(error.response?.data?.message || 'Error generando y enviando contrato');
    }
  }

  // Descargar PDF existente
  async downloadExistingPdf(contractUid: string): Promise<Blob> {
    try {
      console.log('ContractService: downloadExistingPdf called with contractUid =', contractUid);
      const response = await axios.get(
        `${API_URL}/api/contracts/${contractUid}/signed-pdf`,
        {
          headers: authService.getAuthHeader(),
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Download existing PDF error:', error);
      throw new Error(error.response?.data?.message || 'Error descargando PDF existente');
    }
  }

  // Ver PDF existente (abrir en nueva ventana)
  async viewExistingPdf(contractUid: string): Promise<void> {
    try {
      const pdfBlob = await this.downloadExistingPdf(contractUid);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('View existing PDF error:', error);
      throw new Error(error.message || 'Error abriendo PDF');
    }
  }

  // Reenviar email (usar el endpoint generate-and-send pero solo para email)
  async resendEmail(contractUid: string): Promise<void> {
    try {
      console.log('ContractService: resendEmail called with contractUid =', contractUid);
      // Por ahora, usamos el mismo endpoint pero solo para reenviar email
      // TODO: Crear endpoint específico para reenvío de email
      const signatures = {
        customerSignature: 'existing',
        consultantSignature: 'existing'
      };
      
      await axios.post(
        `${API_URL}/api/contracts/${contractUid}/generate-and-send`,
        signatures,
        { headers: authService.getAuthHeader() }
      );
    } catch (error: any) {
      console.error('Resend email error:', error);
      throw new Error(error.response?.data?.message || 'Error reenviando email');
    }
  }
}

export default new ContractService();

