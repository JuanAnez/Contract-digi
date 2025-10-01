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
}

export interface User {
  username: string;
  role?: string;
  email?: string;
}

class AuthService {
  async login(username: string, password: string): Promise<string> {
    try {
      const response = await axios.post<LoginResponse>(`${API_URL}/api/auth/login`, {
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

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
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
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }
}

export default new AuthService();

