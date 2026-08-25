import { createContext, useContext, useState } from 'react';
import { loginRequest } from '../services/authService';
import { canDo } from '../config/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('liftsafe_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (correo, contrasena) => {
    const data = await loginRequest(correo, contrasena);
    localStorage.setItem('token', data.access_token);
    const userData = {
      name: data.nombre,
      email: correo,
      rol: data.rol,
      role: data.rol,
    };
    localStorage.setItem('liftsafe_user', JSON.stringify(userData));
    setUser(userData);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('liftsafe_user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = () => ({ success: false, message: 'Usa el registro de clientes en /register con el backend activo' });

  const hasAction = (action) => canDo(user?.rol || user?.role, action);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, hasAction }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
