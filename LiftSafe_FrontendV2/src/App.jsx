import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import theme from './theme/theme';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
<<<<<<< HEAD
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
=======
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
import DashboardHome from './pages/DashboardHome';
import Inspections from './pages/Inspections';
import Elevators from './pages/Elevators';
import Buildings from './pages/Buildings';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
<<<<<<< HEAD
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
=======
import Solicitudes from './pages/Solicitudes';
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
<<<<<<< HEAD
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
=======
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    </ThemeProvider>
  );
}

<<<<<<< HEAD
=======
const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
        <Route index element={<DashboardHome />} />
        <Route path="inspecciones" element={<Inspections />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="ascensores" element={<Elevators />} />
        <Route path="edificios" element={<Buildings />} />
        <Route path="reportes" element={<Reports />} />
        <Route path="usuarios" element={<Users />} />
        <Route path="configuracion" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
export default App;