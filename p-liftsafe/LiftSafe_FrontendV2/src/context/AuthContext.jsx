import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canDo } from '../config/roles';
import { loginRequest, registerRequest } from '../services/authService';

const AuthContext = createContext(null);

function buildUserFromLogin(data, correo) {
  return {
    name: data.nombre,
    email: correo,
    role: data.rol,
    token: data.access_token,
  };
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(() => {
    try {
const saved = sessionStorage.getItem('liftsafe_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role && parsed.token) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error al cargar usuario:', e);
sessionStorage.removeItem('liftsafe_user');
sessionStorage.removeItem('liftsafe_token');
    }
    return null;
  });

  // Verificar token al cargar
  useEffect(() => {
    if (user) {
      try {
        const payload = JSON.parse(atob(user.token.split('.')[1]));
        const expDate = new Date(payload.exp * 1000);
        if (expDate < new Date()) {
          console.log('Token expirado');
          logout();
        }
      } catch (e) {
        console.error('Error verificando token:', e);
        logout();
      }
    }
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginRequest(email, password);
      const userData = buildUserFromLogin(data, email);
      sessionStorage.setItem('liftsafe_user', JSON.stringify(userData));
sessionStorage.setItem('liftsafe_token', data.access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Correo o contraseña incorrectos' };
    }
  };

  const register = async (formData) => {
    try {
      await registerRequest(formData);
      const loginResult = await login(formData.email, formData.password);
      if (!loginResult.success) {
        return { success: true, message: 'Cuenta creada. Inicia sesión.' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'No se pudo registrar' };
    }
  };

  const logout = () => {
sessionStorage.removeItem('liftsafe_user');
sessionStorage.removeItem('liftsafe_token');
    setUser(null);
    navigate('/login');
  };

  const hasAction = (action) => canDo(user?.role, action);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, hasAction }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);