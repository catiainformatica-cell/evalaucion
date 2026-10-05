import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('iujo_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate existing token on boot
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('iujo_token');
      if (storedToken) {
        try {
          const res = await authApi.me();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Sesión no válida o expirada');
          logout();
        }
      }
      setLoading(false);
    }

    loadUser();

    const handleLogoutEvent = () => logout();
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const login = async (cedula, password) => {
    const res = await authApi.login(cedula, password);
    if (res.success && res.token) {
      localStorage.setItem('iujo_token', res.token);
      localStorage.setItem('iujo_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Error en autenticación');
  };

  const demoLogin = async (role) => {
    const res = await authApi.demoLogin(role);
    if (res.success && res.token) {
      localStorage.setItem('iujo_token', res.token);
      localStorage.setItem('iujo_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Error en acceso demo');
  };

  const logout = () => {
    localStorage.removeItem('iujo_token');
    localStorage.removeItem('iujo_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
