<<<<<<< HEAD
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
=======
import { Box, Button, Skeleton, Card, CardContent, Typography, TextField, MenuItem, Table, TableHead, TableBody, TableRow, TableCell, Alert } from '@mui/material';
import { People, Elevator, Assignment, Assessment } from '@mui/icons-material';
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityPanel from '../../components/dashboard/ActivityPanel';
<<<<<<< HEAD
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
=======
import { InspectionTrendChart, StatusDonutChart, BuildingBarChart } from '../../components/dashboard/DashboardCharts';
import { monthlyInspections, inspectionStatusData, inspectionsByBuilding, recentActivity } from '../../data/dashboardData';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { apiGet } from '../../services/apiClient';
import { usuarioAscensorService } from '../../services/usuarioAscensorService';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ usuarios: 0, ascensores: 0, inspecciones: 0, informes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setStats({ usuarios: 36, ascensores: 26, inspecciones: 29, informes: 20 });
      setLoading(false);
    };
    fetchData();
  }, []);

  const statItems = [
    { title: 'Usuarios activos', value: stats.usuarios, icon: <People />, accent: '#0066CC', trend: 8, trendLabel: 'vs. mes anterior' },
    { title: 'Ascensores registrados', value: stats.ascensores, icon: <Elevator />, accent: '#0E7C4A', trend: 4 },
    { title: 'Inspecciones del mes', value: stats.inspecciones, icon: <Assignment />, accent: '#C97B1A', trend: 12 },
    { title: 'Informes emitidos', value: stats.informes, icon: <Assessment />, accent: '#7C5CBF', trend: 6 },
  ];

  const totalStatus = inspectionStatusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={140} sx={{ borderRadius: 3 }} />)
          : statItems.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2.5, mb: 2.5 }}>
        <ChartCard title="Tendencia de inspecciones" subtitle="Últimos 6 meses · Total vs. aprobadas">
          <InspectionTrendChart data={monthlyInspections} />
        </ChartCard>
        <ChartCard title="Estado de inspecciones" subtitle="Distribución actual del mes">
          <StatusDonutChart data={inspectionStatusData} height={240} centerValue={totalStatus} centerLabel="Total" />
        </ChartCard>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
        <ChartCard
          title="Inspecciones por edificio"
          subtitle="Top edificios con mayor actividad"
          action={<Button component={Link} to="/dashboard/edificios" size="small" variant="outlined">Ver edificios</Button>}
        >
          <BuildingBarChart data={inspectionsByBuilding} />
        </ChartCard>
        <ActivityPanel
          title="Actividad reciente"
          subtitle="Últimas acciones en el sistema"
          items={recentActivity}
          accent="#0066CC"
          action={<Button component={Link} to="/dashboard/inspecciones" size="small" variant="outlined">Ver todo</Button>}
        />
      </Box>

      {/* ============ SECCIÓN NUEVA: ASIGNACIÓN DE INSPECTORES ============ */}
      <AsignacionInspectores />
    </Box>
  );
}

function AsignacionInspectores() {
  const [inspectores, setInspectores] = useState([]);
  const [ascensores, setAscensores] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loadingListas, setLoadingListas] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [form, setForm] = useState({
    id_usuario: '',
    id_ascensor: '',
    tipo_asignacion: 'Principal',
    fecha_asignacion: new Date().toISOString().slice(0, 10),
    observaciones: '',
  });

  const cargarDatos = async () => {
    setLoadingListas(true);
    setError('');
    try {
      const [usuariosRes, ascensoresRes, asignacionesRes] = await Promise.all([
        apiGet('/usuarios/listado'),
        apiGet('/ascensores/listado'),
        usuarioAscensorService.listar(),
      ]);
      const soloInspectores = (usuariosRes || []).filter((u) => u.rol === 'Inspector');
      setInspectores(soloInspectores);
      setAscensores(ascensoresRes || []);
      setAsignaciones((asignacionesRes || []).filter((a) => !a.fecha_desasignacion));
    } catch (err) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoadingListas(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleChange = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value });
  };

  const handleAsignar = async () => {
    setError('');
    setExito('');
    if (!form.id_usuario || !form.id_ascensor) {
      setError('Selecciona un inspector y un ascensor');
      return;
    }
    try {
      await usuarioAscensorService.asignar({
        id_usuario: Number(form.id_usuario),
        id_ascensor: Number(form.id_ascensor),
        tipo_asignacion: form.tipo_asignacion,
        fecha_asignacion: form.fecha_asignacion,
        observaciones: form.observaciones || null,
      });
      setExito('Inspector asignado correctamente');
      setForm({ ...form, id_usuario: '', id_ascensor: '', observaciones: '' });
      cargarDatos();
    } catch (err) {
      setError(err.message || 'Error al asignar');
    }
  };

  const handleDesasignar = async (id) => {
    setError('');
    setExito('');
    try {
      await usuarioAscensorService.desasignar(id, {
        fecha_desasignacion: new Date().toISOString().slice(0, 10),
      });
      setExito('Inspector desasignado correctamente');
      cargarDatos();
    } catch (err) {
      setError(err.message || 'Error al desasignar');
    }
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Asignación de inspectores a ascensores
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {exito && <Alert severity="success" sx={{ mb: 2 }}>{exito}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
          <TextField
            select
            label="Inspector"
            value={form.id_usuario}
            onChange={handleChange('id_usuario')}
            size="small"
          >
            {inspectores.map((i) => (
              <MenuItem key={i.id_usuario} value={i.id_usuario}>{i.nombre_completo}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Ascensor"
            value={form.id_ascensor}
            onChange={handleChange('id_ascensor')}
            size="small"
          >
            {ascensores.map((a) => (
              <MenuItem key={a.id_ascensor} value={a.id_ascensor}>{a.codigo_interno}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Tipo de asignación"
            value={form.tipo_asignacion}
            onChange={handleChange('tipo_asignacion')}
            size="small"
          >
            <MenuItem value="Principal">Principal</MenuItem>
            <MenuItem value="Responsable Principal">Responsable Principal</MenuItem>
            <MenuItem value="Inspector Alterno">Inspector Alterno</MenuItem>
          </TextField>

          <TextField
            type="date"
            label="Fecha de asignación"
            value={form.fecha_asignacion}
            onChange={handleChange('fecha_asignacion')}
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <Button variant="contained" onClick={handleAsignar} sx={{ height: 40 }}>
            Asignar
          </Button>
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Asignaciones activas
        </Typography>

        {loadingListas ? (
          <Skeleton variant="rounded" height={120} />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Inspector</TableCell>
                <TableCell>Ascensor</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Fecha asignación</TableCell>
                <TableCell align="right">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {asignaciones.map((a) => {
                const inspector = inspectores.find((i) => i.id_usuario === a.id_usuario);
                const ascensor = ascensores.find((x) => x.id_ascensor === a.id_ascensor);
                return (
                  <TableRow key={a.id_usuario_ascensor}>
                    <TableCell>{inspector?.nombre_completo || `Usuario #${a.id_usuario}`}</TableCell>
                    <TableCell>{ascensor?.codigo_interno || `Ascensor #${a.id_ascensor}`}</TableCell>
                    <TableCell>{a.tipo_asignacion}</TableCell>
                    <TableCell>{a.fecha_asignacion}</TableCell>
                    <TableCell align="right">
                      <Button size="small" color="error" onClick={() => handleDesasignar(a.id_usuario_ascensor)}>
                        Desasignar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {asignaciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No hay asignaciones activas</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
}