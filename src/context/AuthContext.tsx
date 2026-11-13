import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  workspace: string;
  timezone: string;
  signature?: string;
  followUpDays?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt silent token refresh on initial load
    const initAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        if (data.success && data.data?.token) {
          setAccessToken(data.data.token);
          const meRes = await api.get('/auth/me');
          if (meRes.data.success) {
            setUser(meRes.data.data);
          }
        }
      } catch {
        // Not logged in or expired session
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      setAccessToken('');
      setUser(null);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

