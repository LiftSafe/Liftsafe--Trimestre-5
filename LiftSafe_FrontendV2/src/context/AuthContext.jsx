import { createContext, useContext, useState } from 'react';
import { canDo } from '../config/roles';

const BASE_URL = 'http://127.0.0.1:8000';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('liftsafe_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (correo, contrasena) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      });

      if (!res.ok) {
        return { success: false, message: 'Correo o contraseña incorrectos' };
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);

      const loggedUser = {
        name: data.nombre,
        email: correo,
        role: data.rol,
      };
      localStorage.setItem('liftsafe_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return { success: true };
    } catch {
      return { success: false, message: 'No se pudo conectar con el servidor' };
    }
  };

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

  const logout = () => {
    localStorage.removeItem('liftsafe_user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasAction = (action) => canDo(user?.role, action);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, hasAction }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);