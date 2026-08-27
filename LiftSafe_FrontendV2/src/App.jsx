import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import theme from './theme/theme';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DashboardHome from './pages/DashboardHome';
import Inspections from './pages/Inspections';
import Elevators from './pages/Elevators';
import Buildings from './pages/Buildings';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import RoleRoute from './components/RoleRoute';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<RoleRoute permission="dashboard"><DashboardHome /></RoleRoute>} />
        <Route path="inspecciones" element={<RoleRoute permission="inspecciones"><Inspections /></RoleRoute>} />
        <Route path="ascensores" element={<RoleRoute permission="ascensores"><Elevators /></RoleRoute>} />
        <Route path="edificios" element={<RoleRoute permission="edificios"><Buildings /></RoleRoute>} />
        <Route path="reportes" element={<RoleRoute permission="reportes"><Reports /></RoleRoute>} />
        <Route path="usuarios" element={<RoleRoute permission="usuarios"><Users /></RoleRoute>} />
        <Route path="configuracion" element={<RoleRoute permission="configuracion"><Settings /></RoleRoute>} />
      </Route>
      
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;