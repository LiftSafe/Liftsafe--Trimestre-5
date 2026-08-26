import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../config/roles';

export default function RoleRoute({ permission, children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!canAccess(user?.role, permission)) return <Navigate to="/dashboard" replace />;

  return children;
}
