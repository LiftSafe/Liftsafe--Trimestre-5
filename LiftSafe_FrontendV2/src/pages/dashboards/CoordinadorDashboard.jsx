import { useState, useEffect } from 'react';
import { Box, Button, Modal, TextField, MenuItem, Select, InputLabel, FormControl, Typography } from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import ActivityPanel from '../../components/dashboard/ActivityPanel';
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

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
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
    </Box>
  );
}