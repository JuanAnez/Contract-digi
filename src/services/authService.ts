import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:7001/contract';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: number;
  message: string;
  data: string; // JWT token
  username?: string;
  accessToken?: string;
}

export interface User {
  username: string;
  role?: string;
  email?: string;
}

class AuthService {
  async login(username: string, password: string): Promise<string> {
    try {
      const response = await axios.post<LoginResponse>(`${API_URL}/api/login-ws`, {
        username,
        password
      });

      if (response.data && response.data.data) {
        const token = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        return token;
      }

      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  }

  async logout(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (token) {
        // Llamar al endpoint de logout del backend
        await axios.post(`${API_URL}/api/logout-ws`, {
          accessToken: token
        }, {
          headers: this.getAuthHeader()
        });
      }
      
      // Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      
      return true;
    } catch (error: any) {
      console.error('Logout error:', error);
      // Aún así limpiar el localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      return false;
    }
  }

  getCurrentUser(): User | null {
    const username = localStorage.getItem('username');
    if (username) {
      return { username };
    }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getAuthHeader() {
    const token = this.getToken();
    console.log('AuthService: Token found:', !!token);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  // Azure AD SSO
  loginSSO(): void {
    const azureConfig = {
      clientId: process.env.REACT_APP_AZURE_CLIENT_ID || 'your_client_id',
      tenantId: process.env.REACT_APP_AZURE_TENANT_ID || 'your_tenant_id',
      redirectUri: `${window.location.origin}/auth/callback`,
    };
    
    const authUrl = `https://login.microsoftonline.com/${azureConfig.tenantId}/oauth2/v2.0/authorize?`
      + `client_id=${azureConfig.clientId}`
      + `&response_type=code`
      + `&redirect_uri=${encodeURIComponent(azureConfig.redirectUri)}`
      + `&scope=openid profile email`;
    
    window.location.href = authUrl;
  }

  async handleAzureCallback(code: string, state?: string): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/api/auth/azure/callback`, { code, state });
    localStorage.setItem('token', response.data.accessToken);
    return response.data;
  }

  // Contract methods
  async getAllContracts() {
    const response = await axios.get(`${API_URL}/api/contracts`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async getContractsByStatus(status: string) {
    const response = await axios.get(`${API_URL}/api/contracts?status=${status}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async getContractByUid(contractUid: string) {
    const response = await axios.get(`${API_URL}/api/contracts/${contractUid}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async downloadContractPdf(contractId: string, signatures: any) {
    const response = await axios.post(`${API_URL}/api/contracts/${contractId}/download-pdf`, 
      { signatures }, 
      { 
        headers: this.getAuthHeader(),
        responseType: 'blob'
      }
    );
    return response.data;
  }

  // Search methods
  async searchNewSaleFromSIF(searchUid: string) {
    const response = await axios.get(`${API_URL}/api/search/sif/${searchUid}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async searchNewSaleFromCOPS(searchUid: string, orderNumber?: string) {
    const response = await axios.get(`${API_URL}/api/search/cops/${searchUid}${orderNumber ? `?orderNumber=${orderNumber}` : ''}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async searchHistory(searchUid: string) {
    const response = await axios.get(`${API_URL}/api/search/history/${searchUid}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async unifiedSearch(searchUid: string, searchType: string, orderNumber?: string) {
    const response = await axios.get(`${API_URL}/api/search/unified/${searchUid}?type=${searchType}${orderNumber ? `&orderNumber=${orderNumber}` : ''}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }
}

export default new AuthService();

