import apiClient from './client';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/api';

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<{ success: true; data: AuthResponse }>('/api/auth/register', data),
  
  login: (data: LoginRequest) =>
    apiClient.post<{ success: true; data: AuthResponse }>('/api/auth/login', data),
  
  me: () =>
    apiClient.get<{ success: true; data: AuthResponse['user'] }>('/api/auth/me'),
};
