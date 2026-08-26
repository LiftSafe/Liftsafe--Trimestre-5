// src/pages/dashboards/AdminDashboard.jsx

import { Box, Button, Alert, Skeleton, Chip, Avatar } from '@mui/material';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ElevatorOutlinedIcon from '@mui/icons-material/ElevatorOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import WavingHandOutlinedIcon from '@mui/icons-material/WavingHandOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import AddIcon from '@mui/icons-material/Add'; // ← NUEVO: botón de acción
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // ← NUEVO: tendencia
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityPanel from '../../components/dashboard/ActivityPanel';
import { InspectionTrendChart, StatusDonutChart } from '../../components/dashboard/DashboardCharts'; // ← NUEVO: importar StatusDonutChart
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { fetchStats, fetchCharts, fetchUsuarios, fetchInspecciones } from '../../services/dashboardService';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading, error } = useDashboardData(fetchStats);
  const { data: charts } = useDashboardData(fetchCharts);
  const { data: usuarios = [] } = useDashboardData(fetchUsuarios);
  const { data: inspecciones = [] } = useDashboardData(fetchInspecciones);

  // ✅ MEJORADO: Iconos específicos por tipo de usuario + badge de estado
  const recentUsers = usuarios.slice(0, 5).map((u) => ({
    id: u.id,
    title: u.name,
    subtitle: u.email,
    chip: u.role,
    chipColor: u.role === 'Administrador' ? 'error' : u.role === 'Cliente' ? 'info' : 'default',
    type: 'info',
    icon: u.role === 'Administrador' 
      ? <PeopleOutlinedIcon sx={{ fontSize: 18 }} />
      : u.role === 'Cliente'
      ? <ElevatorOutlinedIcon sx={{ fontSize: 18 }} />
      : <PersonAddOutlinedIcon sx={{ fontSize: 18 }} />,
    // ✅ NUEVO: Avatar con iniciales para usuarios
    avatar: u.name?.charAt(0) || '?',
    avatarColor: u.role === 'Administrador' ? '#C0392B' : u.role === 'Cliente' ? '#0066CC' : '#7C5CBF',
  }));

  // ✅ MEJORADO: Iconos específicos por estado de inspección + badge de tendencia
  const recentInspections = inspecciones.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · Inspector: ${item.inspector}`,
    chip: item.status,
    chipColor: item.status === 'Aprobada' ? 'success' : item.status === 'Finalizada' ? 'success' : 'warning',
    type: item.status === 'Aprobada' ? 'success' : 'warning',
    icon: item.status === 'Aprobada' 
      ? <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
      : item.status === 'Programada'
      ? <ScheduleOutlinedIcon sx={{ fontSize: 18 }} />
      : <EngineeringOutlinedIcon sx={{ fontSize: 18 }} />,
    // ✅ NUEVO: Indicador de tendencia (simulado, puedes conectar con datos reales)
    trend: item.status === 'Aprobada' ? '+5%' : undefined,
  }));

  // ✅ CORREGIDO: Datos para el donut chart con colores distintos por estado
  const statusData = charts?.inspectionStatusData?.length > 0 
    ? charts.inspectionStatusData.map(item => ({
        ...item,
        // ✅ Asignar color específico según el nombre del estado
        color: item.name === 'Aprobada' ? '#0E7C4A' 
            : item.name === 'Finalizada' ? '#1ABC9C'   // ← NUEVO: Verde aguamarina distinto
            : item.name === 'Programada' ? '#0066CC'   // ← Azul
            : item.name === 'Borrador' ? '#C97B1A'     // ← Naranja
            : item.name === 'En Proceso' ? '#F39C12'   // ← Amarillo/naranja
            : item.name === 'Observaciones' ? '#C0392B' // ← Rojo
            : item.name === 'No Cumple' ? '#E74C3C'    // ← Rojo intenso
            : item.color || '#888888'
      }))
    : [
        { name: 'Aprobada', value: stats?.informes_emitidos || 0, color: '#0E7C4A' },
        { name: 'Finalizada', value: 0, color: '#1ABC9C' },
        { name: 'Programada', value: stats?.inspecciones_mes || 0, color: '#0066CC' },
        { name: 'Borrador', value: 0, color: '#C97B1A' },
        { name: 'Observaciones', value: 0, color: '#C0392B' },
      ];

  return (
    <Box>
      {/* ✅ MEJORADO: WelcomeBanner con botones de acción rápida */}
      <WelcomeBanner 
        name={user?.name} 
        role={user?.role} 
        welcomeIcon={<WavingHandOutlinedIcon sx={{ fontSize: 20, ml: 0.5 }} />}
        actions={
          <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, md: 0 } }}>
            <Button 
              component={Link} 
              to="/dashboard/inspecciones" 
              variant="contained" 
              size="small"
              startIcon={<AddIcon />}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
            >
              Nueva inspección
            </Button>
            <Button 
              component={Link} 
              to="/dashboard/usuarios" 
              variant="outlined" 
              size="small"
              startIcon={<PersonAddOutlinedIcon />}
              sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Nuevo usuario
            </Button>
          </Box>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard 
          title="Usuarios activos" 
          value={String(stats?.usuarios_activos || 0)} 
          subtitle="Registrados" 
          icon={<PeopleOutlinedIcon sx={{ fontSize: 28 }} />} 
          accent="#0066CC" 
          trend={12} // ← NUEVO: variación porcentual
          trendLabel="vs mes anterior"
        />
        <StatCard 
          title="Ascensores" 
          value={String(stats?.ascensores_registrados || 0)} 
          subtitle="En sistema" 
          icon={<ElevatorOutlinedIcon sx={{ fontSize: 28 }} />} 
          accent="#7C5CBF" 
          trend={8}
          trendLabel="nuevos este mes"
        />
        <StatCard 
          title="Inspecciones mes" 
          value={String(stats?.inspecciones_mes || 0)} 
          subtitle="Este mes" 
          icon={<AssignmentOutlinedIcon sx={{ fontSize: 28 }} />} 
          accent="#C97B1A" 
          trend={-3}
          trendLabel="vs mes anterior"
        />
        <StatCard 
          title="Informes" 
          value={String(stats?.informes_emitidos || 0)} 
          subtitle="Emitidos" 
          icon={<DescriptionOutlinedIcon sx={{ fontSize: 28 }} />} 
          accent="#0E7C4A" 
          trend={15}
          trendLabel="aprobados este mes"
        />
      </Box>

      {/* ✅ NUEVO: Grid de 2 columnas para gráficas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2.5, mb: 2.5 }}>
        {statsLoading ? (
          <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
        ) : (
          <ChartCard title="Tendencia de inspecciones" subtitle="Datos reales del sistema">
            <InspectionTrendChart data={charts?.monthlyInspections || []} />
          </ChartCard>
        )}
        
        {/* ✅ NUEVO: Donut chart de estados */}
        {statsLoading ? (
          <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
        ) : (
          <ChartCard title="Estado de inspecciones" subtitle="Distribución actual">
            <StatusDonutChart 
              data={statusData} 
              centerLabel="Total" 
              centerValue={String(stats?.inspecciones_mes || 0)} 
            />
          </ChartCard>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        {/* ✅ MEJORADO: ActivityPanel con avatares en usuarios */}
        <ActivityPanel 
          title="Usuarios recientes" 
          subtitle="Últimos registrados" 
          items={recentUsers} 
          accent="#0066CC" 
          showAvatars={true} // ← NUEVO prop
        />
        <ActivityPanel 
          title="Inspecciones recientes" 
          subtitle="Actividad del sistema" 
          items={recentInspections} 
          accent="#C97B1A" 
        />
      </Box>
    </Box>
  );
}