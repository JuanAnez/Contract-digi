export interface User {
  username: string;
  email?: string;
  displayName?: string;
  id?: string;
  roles?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  accessToken: string;
  expiresIn?: number;
}

export interface AzureAdConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  scopes: string[];
}

