import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { canAccess } from '../config/roles';

export default function RoleRoute({ children, permission }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const role = user.rol || user.role || '';
  if (!canAccess(role, permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
