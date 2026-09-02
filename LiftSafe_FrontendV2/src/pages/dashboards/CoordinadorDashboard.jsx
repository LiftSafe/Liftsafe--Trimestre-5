<<<<<<< HEAD
import { Box, Button, Alert, Skeleton } from '@mui/material';
=======
<<<<<<< HEAD
import { Box, Button, Alert, Skeleton } from '@mui/material';
=======
import { useState, useEffect } from 'react';
import { Box, Button, Modal, TextField, MenuItem, Select, InputLabel, FormControl, Typography } from '@mui/material';
>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
<<<<<<< HEAD
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityPanel from '../../components/dashboard/ActivityPanel';
=======
import ActivityPanel from '../../components/dashboard/ActivityPanel';
<<<<<<< HEAD
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
import { InspectionTrendChart } from '../../components/dashboard/DashboardCharts';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { fetchInspecciones, fetchCharts } from '../../services/dashboardService';

export default function CoordinadorDashboard() {
  const { user } = useAuth();
  const { data: inspecciones = [], loading, error } = useDashboardData(fetchInspecciones);
  const { data: charts } = useDashboardData(fetchCharts);

  // ✅ Estados reales de la base de datos
  const pending = inspecciones.filter((item) => 
    item.status === 'Programada' || item.status === 'Borrador' || item.status === 'En Proceso'
  );
  
  const toReview = inspecciones.filter((item) => 
    item.status === 'Aprobada' || item.status === 'Finalizada' || item.reportNumber
  );

  const assignmentItems = pending.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · Programada: ${item.nextDate}`,
    chip: item.type,
    chipColor: 'warning',
    actionBtn: <Button component={Link} to="/dashboard/inspecciones" size="small" variant="contained" sx={{ ml: 1, flexShrink: 0 }}>Ver</Button>,
    type: 'warning',
  }));

  const reviewItems = toReview.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · ${item.inspector}`,
    chip: item.status,
    chipColor: item.status === 'Aprobada' ? 'success' : 'info',
    type: item.status === 'Aprobada' ? 'success' : 'info',
  }));
<<<<<<< HEAD
=======
=======
import { useAuth } from '../../context/AuthContext';
import { solicitudService } from '../../services/solicitudService';
import { programacionService } from '../../services/programacionService';
import { usuarioService } from '../../services/usuarioService';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  border: '2px solid #1976d2',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

export default function CoordinadorDashboard() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [programaciones, setProgramaciones] = useState([]);
  const [inspectores, setInspectores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [formData, setFormData] = useState({
    id_solicitud: '',
    id_inspector: '',
    fecha_programada: '',
    hora_inicio: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [solicitudesData, programacionesData] = await Promise.all([
        solicitudService.listar(),
        programacionService.listar(),
      ]);
      setSolicitudes(solicitudesData || []);
      setProgramaciones(programacionesData || []);

      // Cargar inspectores (usuarios con rol 4)
      const inspectoresData = await usuarioService.listarInspectores();
      setInspectores(inspectoresData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setFormData({
      id_solicitud: solicitud.id_solicitud,
      id_inspector: '',
      fecha_programada: '',
      hora_inicio: '',
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedSolicitud(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await programacionService.asignar(formData);
      handleCloseModal();
      await cargarDatos();
      alert('✅ Inspector asignado correctamente');
    } catch (error) {
      console.error('Error asignando inspector:', error);
      alert('❌ Error al asignar inspector');
    }
  };

  const pendientes = solicitudes.filter(s => s.estado === 'Pendiente');
  const programadas = solicitudes.filter(s => s.estado === 'Programada');
  const finalizadas = solicitudes.filter(s => s.estado === 'Finalizada');
  const porRevisar = programaciones.filter(p => p.estado === 'Programada' || p.estado === 'Pendiente');

  // Preparar datos para ActivityPanel
  const assignmentItems = pendientes.map((s) => ({
    id: s.id_solicitud,
    title: `${s.ascensor?.codigo_interno || 'ASC-' + s.id_ascensor} — ${s.ascensor?.ciudad || 'Sin ciudad'}`,
    subtitle: `Cliente: ${s.cliente?.nombre_completo || 'No asignado'}`,
    chip: s.prioridad || 'Media',
    chipColor: s.prioridad === 'Crítica' ? 'error' : s.prioridad === 'Alta' ? 'warning' : 'info',
    actionBtn: (
      <Button
        size="small"
        variant="contained"
        onClick={() => handleOpenModal(s)}
        sx={{ ml: 1, flexShrink: 0 }}
      >
        Asignar
      </Button>
    ),
    type: s.prioridad === 'Crítica' ? 'error' : s.prioridad === 'Alta' ? 'warning' : 'info',
  }));

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <WelcomeBanner name={user?.name} role={user?.role} />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <h3>Cargando datos...</h3>
        </Box>
      </Box>
    );
  }
>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
        <StatCard title="Inspecciones activas" value={String(inspecciones.length)} subtitle="En seguimiento" icon={<AssignmentOutlinedIcon />} accent="#0066CC" />
        <StatCard title="Pendientes" value={String(pending.length)} subtitle="Por programar o ejecutar" icon={<ScheduleOutlinedIcon />} accent="#C97B1A" />
        <StatCard title="En revisión" value={String(toReview.length)} subtitle="Informes y observaciones" icon={<RateReviewOutlinedIcon />} accent="#7C5CBF" />
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2.5 }} />
      ) : (
        <ChartCard title="Tendencia de inspecciones" subtitle="Datos reales del sistema">
          <InspectionTrendChart data={charts?.monthlyInspections || []} />
        </ChartCard>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        <ActivityPanel title="Asignaciones pendientes" subtitle="Inspecciones por gestionar" items={assignmentItems} accent="#C97B1A" />
        <ActivityPanel title="Informes por revisar" subtitle="Seguimiento de hallazgos" items={reviewItems} accent="#7C5CBF" />
      </Box>
<<<<<<< HEAD
=======
=======
        <StatCard
          title="Por asignar"
          value={pendientes.length}
          subtitle="Requieren inspector"
          icon={<AssignmentOutlinedIcon />}
          accent="#E65100"
          trend={pendientes.length > 0 ? -pendientes.length : 0}
        />
        <StatCard
          title="Programadas"
          value={programadas.length}
          subtitle="Esta semana"
          icon={<ScheduleOutlinedIcon />}
          accent="#2C3E50"
          trend={programadas.length > 0 ? 10 : 0}
        />
        <StatCard
          title="Por revisar"
          value={porRevisar.length}
          subtitle="Informes pendientes"
          icon={<RateReviewOutlinedIcon />}
          accent="#0066CC"
        />
      </Box>

      <ActivityPanel
        title="Inspecciones pendientes de asignación"
        subtitle="Ordenadas por prioridad"
        items={assignmentItems}
        accent="#E65100"
        action={
          <Button
            component={Link}
            to="/dashboard/solicitudes"
            size="small"
            variant="outlined"
          >
            Ver todas
          </Button>
        }
      />

      {/* Modal para asignar inspector */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            Asignar Inspector a Solicitud #{selectedSolicitud?.id_solicitud}
          </Typography>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Inspector *</InputLabel>
              <Select
                value={formData.id_inspector}
                onChange={(e) => setFormData({ ...formData, id_inspector: e.target.value })}
                label="Inspector *"
                required
              >
                {inspectores.map((i) => (
                  <MenuItem key={i.id_usuario} value={i.id_usuario}>
                    {i.nombre_completo} - {i.correo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Fecha programada *"
              type="date"
              value={formData.fecha_programada}
              onChange={(e) => setFormData({ ...formData, fecha_programada: e.target.value })}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              fullWidth
              label="Hora de inicio *"
              type="time"
              value={formData.hora_inicio}
              onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
              required
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Asignar Inspector
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>
>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    </Box>
  );
}