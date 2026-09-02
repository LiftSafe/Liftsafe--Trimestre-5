import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import theme from './theme/theme';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardHome from './pages/DashboardHome';
import Inspections from './pages/Inspections';
import Elevators from './pages/Elevators';
import Buildings from './pages/Buildings';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Solicitudes from './pages/Solicitudes';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

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

export default App;