import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cg_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cg_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('cg_user', JSON.stringify(res.user));
          }
        } catch {
          // If token expired, clear state
          logout();
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('cg_token', data.token);
      localStorage.setItem('cg_user', JSON.stringify(data.user));
    }
    return data;
  };

  const register = async ({ name, email, password, role }) => {
    const data = await api.register({ name, email, password, role });
    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('cg_token', data.token);
      localStorage.setItem('cg_user', JSON.stringify(data.user));
    }
    return data;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.logout();
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('cg_token');
      localStorage.removeItem('cg_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
