import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types/api';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token') || localStorage.getItem('access_token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (storedToken) {
        try {
          const res = await authApi.me();
          const userData = (res.data as any).data || res.data;
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to verify token:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    const res = await authApi.login(data);
    const authData = (res.data as any).data || res.data;
    const { token: newToken, user: newUser } = authData;
    localStorage.setItem('token', newToken);
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    const authData = (res.data as any).data || res.data;
    const { token: newToken, user: newUser } = authData;
    localStorage.setItem('token', newToken);
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
