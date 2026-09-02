import { Box, Button, Skeleton, Card, CardContent, Typography, TextField, MenuItem, Table, TableHead, TableBody, TableRow, TableCell, Alert } from '@mui/material';
import { People, Elevator, Assignment, Assessment } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityPanel from '../../components/dashboard/ActivityPanel';
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
}