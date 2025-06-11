export interface JwtPayload {
  sub: number;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: number;
  user: {
    id: number;
    nome: string;
    role: string;
    email: string;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: number;
  user?: {
    id: number;
    nome: string;
    role: string;
    email: string;
  };
}

export interface LogoutResponse {
  message: string;
  sessionId?: number;
}

export interface ValidateTokenResponse {
  id: number;
  nome: string;
  role: string;
  sessionId?: number;
}
