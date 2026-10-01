export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  username: string;
  telefono: string;
  nuevaPassword: string;
  confirmarPassword: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
}
