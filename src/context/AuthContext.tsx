import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  mustChangePassword: boolean;
  loginNotice: string | null;
  setLoginNotice: (val: string | null) => void;
  login: (username: string, password: string) => Promise<{ mustChangePassword: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setMustChangePassword: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);

  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setMustChangePassword(res.mustChangePassword);
    } catch (err) {
      console.warn('Failed to restore session:', err);
      removeStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    setStoredToken(res.token);
    setUser(res.user);
    setMustChangePassword(res.mustChangePassword);
    sessionStorage.removeItem('tamvesta_welcome_shown');
    return { mustChangePassword: res.mustChangePassword };
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setMustChangePassword(false);
    sessionStorage.removeItem('tamvesta_welcome_shown');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        mustChangePassword,
        loginNotice,
        setLoginNotice,
        login,
        logout,
        refreshUser,
        setMustChangePassword,
      }}
    >
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
