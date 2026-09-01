import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AdminDashboard from './dashboards/AdminDashboard';
import AsesorDashboard from './dashboards/AsesorDashboard';
import CoordinadorDashboard from './dashboards/CoordinadorDashboard';
import DirectorTecnicoDashboard from './dashboards/DirectorTecnicoDashboard';
import InspectorDashboard from './dashboards/InspectorDashboard';
import ClientDashboard from './dashboards/ClientDashboard';

const DashboardHome = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  const role = user.rol || user.role;
  if (!role) {
    console.error('Usuario sin rol:', user);
    return <Navigate to="/login" replace />;
  }

  switch (role) {
    case 'Administrador':
      return <AdminDashboard />;
    case 'Asesor':
      return <AsesorDashboard />;
    case 'Coordinador':
      return <CoordinadorDashboard />;
    case 'Director Técnico':
      return <DirectorTecnicoDashboard />;
    case 'Inspector':
      return <InspectorDashboard />;
    case 'Cliente':
      return <ClientDashboard />;
    default:
      console.error('Rol desconocido:', user.role);
      return <Navigate to="/login" replace />;
  }
};

export default DashboardHome;