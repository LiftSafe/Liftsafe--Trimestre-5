import { createContext, useContext, useState } from 'react';
import { canDo } from '../config/roles';
import { decodeDeep } from '../utils/encoding';
import { loginRequest } from '../services/authService';

const BASE_URL = 'http://127.0.0.1:8000';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('liftsafe_user');
    if (!saved) return null;
    const parsed = decodeDeep(JSON.parse(saved));
    localStorage.setItem('liftsafe_user', JSON.stringify(parsed));
    return parsed;
  });

  // ============================================
  // LOGIN - Usando authService (modular)
  // ============================================
  const login = async (correo, contrasena) => {
    try {
      const data = await loginRequest(correo, contrasena);
      localStorage.setItem('token', data.access_token);
      
      const userData = decodeDeep({
        name: data.nombre,
        email: correo,
        rol: data.rol,
        role: data.rol,
      });
      
      localStorage.setItem('liftsafe_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        message: error.message || 'Correo o contraseña incorrectos' 
      };
    }
  };

  // ============================================
  // REGISTER - Con manejo de errores (de Felipe)
  // ============================================
  const register = async (formData) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, message: data.detail || 'No se pudo registrar' };
      }

      return { success: true };
    } catch {
      return { success: false, message: 'No se pudo conectar con el servidor' };
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = () => {
    localStorage.removeItem('liftsafe_user');
    localStorage.removeItem('token');
    setUser(null);
  };

  // ============================================
  // PERMISOS
  // ============================================
  const hasAction = (action) => canDo(user?.rol || user?.role, action);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isAuthenticated: !!user, 
      hasAction 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}