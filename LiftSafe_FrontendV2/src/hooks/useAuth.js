// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ROLE_ACTIONS } from '../config/roles';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  
  // ✅ Función para saber si el rol tiene permisos para ejecutar una acción
  const hasAction = (action) => {
    const rol = context.user?.rol || context.user?.role;
    return (ROLE_ACTIONS[action] || []).includes(rol);
  };

  return { ...context, hasAction };
};