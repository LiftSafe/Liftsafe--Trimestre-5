import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Typography, IconButton, CircularProgress, Alert, Paper,
  Checkbox, FormControlLabel, Radio, RadioGroup, FormControl, Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DrawIcon from '@mui/icons-material/Draw';
import VerifiedIcon from '@mui/icons-material/Verified';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { statusColor } from '../utils/statusHelpers';
import { brand } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { fotografiaService } from '../services/fotografiaService';
import { firmaService } from '../services/firmaService';
import { observacionService } from '../services/observacionService';
import { checklistService } from '../services/checklistService';
import { API_BASE_URL } from '../config/api';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { fetchInspecciones, fetchEdificios, fetchAscensores, crearInspeccion } from '../services/dashboardService';

const PAD_HEIGHT = 200;
const NIVELES_RIESGO = ['Bajo', 'Medio', 'Alto', 'Crítico'];
const TIPOS_OBSERVACION = ['Preventiva', 'Correctiva', 'Urgente'];

const statusColorMap = {
  Programada: 'warning',
  'En Progreso': 'info',
  Completada: 'success',
  Finalizada: 'success',
  Aprobada: 'success',
  Cancelada: 'error',
  Borrador: 'default',
};

// ============================================
// COMPONENTE CONFIRM DIALOG
// ============================================
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message = '¿Estás seguro de que deseas continuar?',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  confirmColor = 'error',
  loading = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WarningAmberIcon color={confirmColor} />
          <Typography fontWeight={700}>{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Eliminando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================
// COMPONENTE SIGNATURE PAD
// ============================================
function SignaturePad({ onSave, disabled, label, fecha }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  const configureContext = (ctx) => {
    ctx.strokeStyle = '#0B1929';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || disabled) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(wrap.clientWidth, 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(PAD_HEIGHT * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${PAD_HEIGHT}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    configureContext(ctx);
    setHasStroke(false);
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;
    setupCanvas();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(() => setupCanvas());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [disabled, setupCanvas]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    if (disabled) return;
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    configureContext(ctx);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing.current || disabled) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasStroke(true);
  };

  const stopDraw = () => {
    drawing.current = false;
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    configureContext(ctx);
    setHasStroke(false);
  };

  const guardar = () => {
    if (!hasStroke) {
      alert('Dibuje su firma antes de confirmar.');
      return;
    }
    onSave(canvasRef.current.toDataURL('image/png'));
  };

  if (disabled) {
    return (
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          border: '1px solid #D4EDDA',
          borderRadius: 2,
          bgcolor: '#F6FBF7',
          p: { xs: 2.5, sm: 3 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <VerifiedIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
          <Box>
            <Typography fontWeight={700} sx={{ color: '#1B5E20', fontSize: '1rem' }}>
              {label} registrada
            </Typography>
            {fecha && (
              <Typography variant="body2" color="text.secondary">
                {new Date(fecha).toLocaleString()}
              </Typography>
            )}
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Esta firma queda asociada al registro técnico de la inspección y no puede modificarse.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        border: '1px solid #D7DEE6',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: '#fff',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          bgcolor: '#F7F9FC',
          borderBottom: '1px solid #E8EDF2',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: '#E8F1FB',
              color: '#0066CC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DrawIcon fontSize="small" />
          </Box>
          <Box>
            <Typography fontWeight={700} sx={{ fontSize: '0.95rem', color: '#0B1929' }}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Dibuje con el mouse o el dedo. La firma certifica el resultado de esta inspección.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1 }}>
        <Box
          ref={wrapRef}
          sx={{
            position: 'relative',
            border: '1px dashed #B7C3D0',
            borderRadius: 1.5,
            bgcolor: '#FBFCFD',
            touchAction: 'none',
            overflow: 'hidden',
            '&:hover': { borderColor: '#0066CC', bgcolor: '#fff' },
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              width: '100%',
              height: PAD_HEIGHT,
              cursor: 'crosshair',
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          <Box
            sx={{
              position: 'absolute',
              left: { xs: 24, sm: 48 },
              right: { xs: 24, sm: 48 },
              bottom: 44,
              borderBottom: '1.5px solid #9AA8B8',
              pointerEvents: 'none',
            }}
          />
          {!hasStroke && (
            <Typography
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                color: '#8A97A8',
                fontStyle: 'italic',
                letterSpacing: '0.02em',
                pb: 3,
              }}
            >
              Firme aquí
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
          bgcolor: '#F7F9FC',
          borderTop: '1px solid #E8EDF2',
        }}
      >
        <Button
          variant="outlined"
          onClick={limpiar}
          sx={{
            textTransform: 'none',
            minWidth: 110,
            color: '#5A6A7A',
            borderColor: '#C9D3DC',
            '&:hover': { borderColor: '#0066CC', color: '#0066CC' },
          }}
        >
          Limpiar
        </Button>
        <Button
          variant="contained"
          onClick={guardar}
          startIcon={<DrawIcon />}
          sx={{
            textTransform: 'none',
            minWidth: 160,
            px: 3,
            bgcolor: '#0066CC',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#0052A3', boxShadow: 'none' },
          }}
        >
          Confirmar firma
        </Button>
      </Box>
    </Paper>
  );
}

function SectionCard({ step, title, subtitle, action, children }) {
  return (
    <Box
      sx={{
        mb: 2.5,
        border: '1px solid #E2E8F0',
        borderRadius: 2.5,
        overflow: 'hidden',
        bgcolor: '#fff',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          bgcolor: '#F7F9FC',
          borderBottom: '1px solid #E8EDF2',
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {step != null && (
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                bgcolor: brand.accent,
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {step}
            </Box>
          )}
          <Box>
            <Typography fontWeight={700} sx={{ color: brand.navy, fontSize: '0.95rem' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {action}
      </Box>
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
    </Box>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function Inspections() {
  const { user, hasAction } = useAuth();
  const { data: rows = [], loading, error, refetch } = useDashboardData(fetchInspecciones);
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    rows,
    ['building', 'elevator', 'brand', 'model', 'type', 'inspector', 'status', 'date']
  );

  // Estados del modal de nueva inspección
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [edificios, setEdificios] = useState([]);
  const [ascensores, setAscensores] = useState([]);
  const [edificioSeleccionado, setEdificioSeleccionado] = useState('');
  const [ascensorSeleccionado, setAscensorSeleccionado] = useState('');
  const [tipoInspeccion, setTipoInspeccion] = useState('Periódica');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [fechaError, setFechaError] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);

  // Estados del detalle
  const [categorias, setCategorias] = useState([]);
  const [detalles, setDetalles] = useState({});
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [checklistError, setChecklistError] = useState('');
  const [savingItem, setSavingItem] = useState(null);
  const [observacionesList, setObservacionesList] = useState([]);
  const [obsError, setObsError] = useState('');
  const [nuevaObs, setNuevaObs] = useState({
    tipo_observacion: 'Preventiva',
    descripcion: '',
    nivel_riesgo: 'Bajo',
    requiere_atencion_inmediata: false,
  });
  const [creandoObs, setCreandoObs] = useState(false);
  const [firmas, setFirmas] = useState({
    firma_inspector: false,
    firma_cliente: false,
    ambas_firmas: false,
    fecha_firma_inspector: null,
    fecha_firma_cliente: null,
  });
  const [fotos, setFotos] = useState([]);
  const [loadingDetail] = useState(false); // ✅ Corregido: sin setLoadingDetail
  const [selectedFile, setSelectedFile] = useState(null);
  const [fotoDescripcion, setFotoDescripcion] = useState('');

  // Estados de snackbar y confirm dialog
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [deleting, setDeleting] = useState(false);

  const userRol = user?.rol || user?.role;

  // ============================================
  // FUNCIONES DE SNACKBAR
  // ============================================
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // ============================================
  // FUNCIONES DE ESTEBAN (crear inspección, edificios)
  // ============================================
  const getHoy = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const validarFecha = (fecha) => {
    if (!fecha) {
      setFechaError('');
      return false;
    }
    const hoy = getHoy();
    if (fecha < hoy) {
      setFechaError('La fecha no puede ser anterior a hoy');
      return false;
    }
    setFechaError('');
    return true;
  };

  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    const hoy = getHoy();
    if (nuevaFecha && nuevaFecha < hoy) {
      setFechaProgramada('');
      setFechaError('La fecha no puede ser anterior a hoy');
      return;
    }
    setFechaProgramada(nuevaFecha);
    setFechaError('');
  };

  const cargarEdificios = async () => {
    setLoadingModal(true);
    try {
      const data = await fetchEdificios();
      setEdificios(data || []);
    } catch (err) {
      console.error('Error cargando edificios:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleEdificioChange = async (edificioId) => {
    setEdificioSeleccionado(edificioId);
    setAscensorSeleccionado('');
    if (!edificioId) {
      setAscensores([]);
      return;
    }
    setLoadingModal(true);
    try {
      const todosAscensores = await fetchAscensores();
      const ascensoresFiltrados = todosAscensores.filter((a) => a.building === edificioId);
      setAscensores(ascensoresFiltrados);
    } catch (err) {
      console.error('Error cargando ascensores:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  const limpiarFormulario = () => {
    setEdificioSeleccionado('');
    setAscensorSeleccionado('');
    setTipoInspeccion('Periódica');
    setFechaProgramada('');
    setFechaError('');
    setObservaciones('');
    setAscensores([]);
  };

  // ✅ ELIMINADO: useEffect que llamaba cargarEdificios al abrir el modal
  // (causaba error ESLint react-hooks/set-state-in-effect)

  const handleCrearInspeccion = async () => {
    if (!edificioSeleccionado || !ascensorSeleccionado || !fechaProgramada) {
      showSnackbar('Por favor complete todos los campos obligatorios', 'warning');
      return;
    }
    if (!validarFecha(fechaProgramada)) {
      showSnackbar(fechaError || 'La fecha programada no es válida', 'error');
      return;
    }
    const ascensor = ascensores.find((a) => a.id === ascensorSeleccionado);
    if (!ascensor) {
      showSnackbar('Ascensor no válido', 'error');
      return;
    }
    const data = {
      id_ascensor: parseInt(ascensorSeleccionado),
      id_inspector: 1,
      fecha_programada: fechaProgramada,
      tipo_servicio: tipoInspeccion,
      observaciones: observaciones,
    };
    try {
      setLoadingModal(true);
      await crearInspeccion(data);
      setOpen(false);
      limpiarFormulario();
      if (refetch) refetch();
      showSnackbar('Inspección creada exitosamente', 'success');
    } catch (err) {
      console.error('Error creando inspección:', err);
      showSnackbar(err.message || 'Error al crear inspección', 'error');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteDialog({ open: true, row });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.row) return;
    setDeleting(true);
    try {
      console.log('Eliminar inspección:', deleteDialog.row.id);
      showSnackbar('Inspección eliminada correctamente', 'success');
      if (refetch) refetch();
    } catch (err) {
      showSnackbar(err.message || 'Error al eliminar la inspección', 'error');
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, row: null });
    }
  };

  // ============================================
  // FUNCIONES DE FELIPE (checklist y observaciones)
  // ============================================
  const cargarChecklist = async (idInspeccion) => {
    setLoadingChecklist(true);
    setChecklistError('');
    try {
      const [cats, existentes] = await Promise.all([
        checklistService.obtenerCategorias(),
        checklistService.listarPorInspeccion(idInspeccion),
      ]);
      setCategorias(cats || []);
      const mapa = {};
      (existentes || []).forEach((d) => {
        mapa[d.id_item] = { id_detalle: d.id_detalle, resultado: d.resultado };
      });
      setDetalles(mapa);
    } catch (err) {
      setChecklistError(err.message || 'No se pudo cargar el checklist');
    } finally {
      setLoadingChecklist(false);
    }
  };

  const cargarObservaciones = async (idInforme) => {
    setObsError('');
    if (!idInforme) {
      setObservacionesList([]);
      setObsError('Esta inspección no tiene informe generado');
      return;
    }
    try {
      const obs = await observacionService.listarPorInforme(idInforme);
      setObservacionesList(obs || []);
    } catch (err) {
      setObservacionesList([]);
      setObsError(err.message || 'No se pudieron cargar las observaciones');
    }
  };

  const calificarItem = async (item, resultado) => {
    setSavingItem(item.id_item);
    try {
      await checklistService.calificar({
        id_inspeccion: selected.id_inspeccion,
        id_item: item.id_item,
        resultado,
      });
      setDetalles((prev) => ({
        ...prev,
        [item.id_item]: { resultado },
      }));
      showSnackbar('Calificación guardada', 'success');
    } catch (err) {
      setChecklistError(err.message || 'No se pudo guardar la calificación');
      showSnackbar('Error al guardar calificación', 'error');
    } finally {
      setSavingItem(null);
    }
  };

  const eliminarCalificacion = async (item) => {
    const idDetalle = detalles[item.id_item]?.id_detalle;
    if (!idDetalle) return;
    setSavingItem(item.id_item);
    try {
      await checklistService.eliminar(idDetalle);
      setDetalles((prev) => {
        const copia = { ...prev };
        delete copia[item.id_item];
        return copia;
      });
      showSnackbar('Calificación eliminada', 'success');
    } catch (err) {
      setChecklistError(err.message || 'No se pudo eliminar la calificación');
      showSnackbar('Error al eliminar calificación', 'error');
    } finally {
      setSavingItem(null);
    }
  };

  const crearObservacion = async () => {
    if (!nuevaObs.descripcion.trim()) return;
    setCreandoObs(true);
    try {
      await observacionService.crear({
        id_informe: selected.id_informe,
        ...nuevaObs,
      });
      setNuevaObs({
        tipo_observacion: 'Preventiva',
        descripcion: '',
        nivel_riesgo: 'Bajo',
        requiere_atencion_inmediata: false,
      });
      await cargarObservaciones(selected.id_informe);
      showSnackbar('Observación creada', 'success');
    } catch (err) {
      setObsError(err.message || 'No se pudo crear la observación');
      showSnackbar('Error al crear observación', 'error');
    } finally {
      setCreandoObs(false);
    }
  };

  const eliminarObservacion = async (idObservacion) => {
    try {
      await observacionService.eliminar(idObservacion);
      await cargarObservaciones(selected.id_informe);
      showSnackbar('Observación eliminada', 'success');
    } catch (err) {
      setObsError(err.message || 'No se pudo eliminar la observación');
      showSnackbar('Error al eliminar observación', 'error');
    }
  };

  // ============================================
  // FUNCIONES DE VALENTINA (fotos y firma)
  // ============================================
  const firmarComoInspector = async (firmaBase64) => {
    const id = selected?.id_inspeccion || selected?.id;
    try {
      await firmaService.firmarInspector(id, { firma: firmaBase64 });
      const firmasData = await firmaService.verificarFirmas(id);
      setFirmas({
        firma_inspector: firmasData.firma_inspector || false,
        firma_cliente: firmasData.firma_cliente || false,
        ambas_firmas: firmasData.ambas_firmas || false,
        fecha_firma_inspector: firmasData.fecha_firma_inspector || null,
        fecha_firma_cliente: firmasData.fecha_firma_cliente || null,
      });
      showSnackbar('Firma del inspector registrada', 'success');
    } catch (err) {
      showSnackbar('Error al registrar firma: ' + (err.message || ''), 'error');
    }
  };

  const firmarComoCliente = async (firmaBase64) => {
    const id = selected?.id_inspeccion || selected?.id;
    try {
      await firmaService.firmarCliente(id, { firma: firmaBase64 });
      const firmasData = await firmaService.verificarFirmas(id);
      setFirmas({
        firma_inspector: firmasData.firma_inspector || false,
        firma_cliente: firmasData.firma_cliente || false,
        ambas_firmas: firmasData.ambas_firmas || false,
        fecha_firma_inspector: firmasData.fecha_firma_inspector || null,
        fecha_firma_cliente: firmasData.fecha_firma_cliente || null,
      });
      showSnackbar('Firma del cliente registrada', 'success');
    } catch (err) {
      showSnackbar('Error al registrar firma: ' + (err.message || ''), 'error');
    }
  };

  const subirFoto = async () => {
    if (!selectedFile) {
      alert('Selecciona una foto primero');
      return;
    }
    if (!selected?.id_informe) {
      alert('Esta inspección no tiene un informe asociado');
      return;
    }
    try {
      await fotografiaService.subir(selected.id_informe, selectedFile, fotoDescripcion);
      setSelectedFile(null);
      setFotoDescripcion('');
      const fotosData = await fotografiaService.listarPorInforme(selected.id_informe);
      setFotos(Array.isArray(fotosData) ? fotosData : []);
      showSnackbar('Foto subida exitosamente', 'success');
    } catch (err) {
      console.error('Error subiendo foto:', err);
      showSnackbar('Error al subir la foto', 'error');
    }
  };

  const eliminarFoto = async (idFoto) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      await fotografiaService.eliminar(idFoto);
      const fotosData = await fotografiaService.listarPorInforme(selected.id_informe);
      setFotos(Array.isArray(fotosData) ? fotosData : []);
      showSnackbar('Foto eliminada', 'success');
    } catch (err) {
      console.error('Error eliminando foto:', err);
      showSnackbar('Error al eliminar la foto', 'error');
    }
  };

  // ✅ NUEVO: Función para abrir detalle y cargar datos
  const handleOpenDetail = (row) => {
    setSelected(row);
    setDetailOpen(true);
    const idInspeccion = row.id_inspeccion || row.id;
    const idInforme = row.id_informe;
    if (idInspeccion) cargarChecklist(idInspeccion);
    if (idInforme) cargarObservaciones(idInforme);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <Box>
      <PageHeader
        title="Inspecciones"
        subtitle="Inspecciones registradas en LiftSafe"
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar inspección..." />
        {hasAction('createInspection') && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => {
              setOpen(true);
              cargarEdificios(); // ✅ Carga aquí, no en useEffect
            }}
          >
            Nueva inspección
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>
                        <strong>Edificio</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Ascensor</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Tipo</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Inspector</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Fecha</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Próxima</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Estado</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Acciones</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((row) => (
                      <TableRow key={row.id} hover sx={{ cursor: 'pointer' }}>
                        <TableCell onClick={() => handleOpenDetail(row)}>
                          {row.building}
                        </TableCell>
                        <TableCell onClick={() => handleOpenDetail(row)}>
                          {row.elevator}
                        </TableCell>
                        <TableCell onClick={() => handleOpenDetail(row)}>
                          {row.type}
                        </TableCell>
                        <TableCell onClick={() => handleOpenDetail(row)}>
                          {row.inspector}
                        </TableCell>
                        <TableCell onClick={() => handleOpenDetail(row)}>
                          {row.date}
                        </TableCell>
                        <TableCell onClick={() => handleOpenDetail(row)}>
                          {row.nextDate}
                        </TableCell>
                        <TableCell onClick={() => handleOpenDetail(row)}>
                          <Chip
                            label={row.status}
                            color={statusColor[row.status] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Editar inspección:', row.id);
                            }}
                            title="Editar inspección"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(row);
                            }}
                            title="Eliminar inspección"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!paginated.length && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          No hay inspecciones registradas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <ListPagination count={totalCount} page={page} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {/* MODAL DE NUEVA INSPECCIÓN */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          limpiarFormulario();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Nueva inspección</DialogTitle>
        <DialogContent>
          {loadingModal && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              label="Edificio"
              fullWidth
              value={edificioSeleccionado}
              onChange={(e) => handleEdificioChange(e.target.value)}
              disabled={loadingModal}
            >
              <MenuItem value="">
                <em>Seleccione un edificio</em>
              </MenuItem>
              {edificios.map((ed) => (
                <MenuItem key={ed.id} value={ed.id}>
                  {ed.name} - {ed.address}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Ascensor"
              fullWidth
              value={ascensorSeleccionado}
              onChange={(e) => setAscensorSeleccionado(e.target.value)}
              disabled={!edificioSeleccionado || loadingModal}
            >
              <MenuItem value="">
                <em>Seleccione un ascensor</em>
              </MenuItem>
              {ascensores.map((asc) => (
                <MenuItem key={asc.id} value={asc.id}>
                  {asc.brand} {asc.model} - {asc.type} ({asc.capacity}kg)
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Tipo de inspección"
              fullWidth
              value={tipoInspeccion}
              onChange={(e) => setTipoInspeccion(e.target.value)}
            >
              <MenuItem value="Anual">Anual</MenuItem>
              <MenuItem value="Periódica">Periódica</MenuItem>
              <MenuItem value="Extraordinaria">Extraordinaria</MenuItem>
            </TextField>

            <TextField
              label="Fecha programada"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={fechaProgramada}
              onChange={handleFechaChange}
              error={!!fechaError}
              helperText={fechaError || ''}
            />

            <TextField
              label="Observaciones iniciales"
              multiline
              rows={3}
              fullWidth
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setOpen(false);
              limpiarFormulario();
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCrearInspeccion}
            disabled={!edificioSeleccionado || !ascensorSeleccionado || !fechaProgramada || !!fechaError}
          >
            Crear inspección
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE DETALLE */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box>
              <Typography fontWeight={700} fontSize="1.1rem">
                Inspección #{selected?.id_inspeccion || selected?.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selected?.codigo_ascensor || selected?.elevator || 'N/A'} ·{' '}
                {selected?.tipo_servicio || selected?.type || 'Periódica'}
              </Typography>
            </Box>
            <Chip
              label={selected?.estado || selected?.status || 'Pendiente'}
              color={statusColorMap[selected?.estado || selected?.status] || 'default'}
            />
          </Box>
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setDetailOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2.5 }}>
          {loadingDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '220px 1fr' },
                  gap: 2.5,
                  mb: 2.5,
                  p: 2.25,
                  bgcolor: '#F7F9FC',
                  border: '1px solid #E8EDF2',
                  borderRadius: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                  >
                    Fecha de inicio
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.95rem' }}>
                    {selected?.fecha_inicio ? new Date(selected.fecha_inicio).toLocaleString() : 'Sin fecha'}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                  >
                    Observaciones generales
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      fontSize: '0.95rem',
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                      color: '#1A2332',
                    }}
                  >
                    {selected?.observaciones_generales || 'Sin observaciones'}
                  </Typography>
                </Box>
              </Box>

              <SectionCard
                step={1}
                title="Checklist normativo"
                subtitle="NTC 5926-1 · Califique cada ítem antes de firmar"
              >
                {loadingChecklist && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
                {checklistError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {checklistError}
                  </Alert>
                )}

                {!loadingChecklist &&
                  categorias.map((cat) => (
                    <Box key={cat.id_categoria} sx={{ mb: 2.5, '&:last-child': { mb: 0 } }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{ mb: 1.25, color: brand.blueDark, letterSpacing: '0.01em' }}
                      >
                        {cat.nombre_categoria}
                      </Typography>
                      {cat.items.map((item) => {
                        const actual = detalles[item.id_item]?.resultado || '';
                        const bg =
                          actual === 'Cumple'
                            ? '#F6FBF7'
                            : actual === 'No Cumple'
                              ? '#FDF6F6'
                              : '#FAFBFC';
                        return (
                          <Box
                            key={item.id_item}
                            sx={{
                              mb: 1.25,
                              p: 1.75,
                              border: '1px solid #E8EDF2',
                              borderRadius: 2,
                              bgcolor: bg,
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 1,
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ mb: 0.75, color: brand.navy, fontWeight: 500 }}>
                                {item.descripcion}
                              </Typography>
                              <FormControl>
                                <RadioGroup
                                  row
                                  value={actual}
                                  onChange={(e) => calificarItem(item, e.target.value)}
                                >
                                  <FormControlLabel
                                    value="Cumple"
                                    control={<Radio size="small" />}
                                    label="Cumple"
                                    disabled={savingItem === item.id_item}
                                  />
                                  <FormControlLabel
                                    value="No Cumple"
                                    control={<Radio size="small" />}
                                    label="No cumple"
                                    disabled={savingItem === item.id_item}
                                  />
                                  <FormControlLabel
                                    value="No Aplica"
                                    control={<Radio size="small" />}
                                    label="No aplica"
                                    disabled={savingItem === item.id_item}
                                  />
                                </RadioGroup>
                              </FormControl>
                            </Box>
                            {actual && (
                              <IconButton
                                size="small"
                                onClick={() => eliminarCalificacion(item)}
                                disabled={savingItem === item.id_item}
                                title="Quitar calificación"
                              >
                                <DeleteOutlinedIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
              </SectionCard>

              <SectionCard step={2} title="Observaciones técnicas" subtitle="Hallazgos y seguimiento">
                {obsError && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {obsError}
                  </Alert>
                )}

                {observacionesList.map((obs) => (
                  <Box
                    key={obs.id_observacion}
                    sx={{
                      mb: 1,
                      p: 1.75,
                      border: '1px solid #E8EDF2',
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      bgcolor: '#FAFBFC',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {obs.tipo_observacion}
                        {obs.nivel_riesgo ? ` · Riesgo ${obs.nivel_riesgo}` : ''}
                        {obs.requiere_atencion_inmediata ? ' · Atención inmediata' : ''}
                      </Typography>
                      <Typography variant="body2">{obs.descripcion}</Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => eliminarObservacion(obs.id_observacion)}
                      title="Eliminar observación"
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                {selected?.id_informe && (
                  <Box sx={{ mt: observacionesList.length ? 2 : 0, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      Registrar nueva observación
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <TextField
                        select
                        size="small"
                        label="Tipo"
                        sx={{ minWidth: 140 }}
                        value={nuevaObs.tipo_observacion}
                        onChange={(e) =>
                          setNuevaObs((p) => ({ ...p, tipo_observacion: e.target.value }))
                        }
                      >
                        {TIPOS_OBSERVACION.map((t) => (
                          <MenuItem key={t} value={t}>
                            {t}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        size="small"
                        label="Nivel de riesgo"
                        sx={{ minWidth: 140 }}
                        value={nuevaObs.nivel_riesgo}
                        onChange={(e) =>
                          setNuevaObs((p) => ({ ...p, nivel_riesgo: e.target.value }))
                        }
                      >
                        {NIVELES_RIESGO.map((n) => (
                          <MenuItem key={n} value={n}>
                            {n}
                          </MenuItem>
                        ))}
                      </TextField>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={nuevaObs.requiere_atencion_inmediata}
                            onChange={(e) =>
                              setNuevaObs((p) => ({
                                ...p,
                                requiere_atencion_inmediata: e.target.checked,
                              }))
                            }
                          />
                        }
                        label="Atención inmediata"
                      />
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      label="Descripción"
                      multiline
                      rows={2}
                      sx={{ mb: 1 }}
                      value={nuevaObs.descripcion}
                      onChange={(e) =>
                        setNuevaObs((p) => ({ ...p, descripcion: e.target.value }))
                      }
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={crearObservacion}
                      disabled={creandoObs || !nuevaObs.descripcion.trim()}
                    >
                      {creandoObs ? 'Guardando...' : 'Agregar observación'}
                    </Button>
                  </Box>
                )}
              </SectionCard>

              <SectionCard step={3} title="Fotografías" subtitle={`${fotos.length} archivo${fotos.length === 1 ? '' : 's'}`}>
                {userRol === 'Inspector' && (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      style={{ display: 'none' }}
                      id="foto-upload"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                    <label htmlFor="foto-upload">
                      <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />} size="small">
                        Seleccionar foto
                      </Button>
                    </label>
                    {selectedFile && <Typography variant="body2">{selectedFile.name}</Typography>}
                    <TextField
                      label="Descripción"
                      size="small"
                      value={fotoDescripcion}
                      onChange={(e) => setFotoDescripcion(e.target.value)}
                      sx={{ flex: 1, minWidth: 150 }}
                    />
                    <Button variant="contained" onClick={subirFoto} disabled={!selectedFile} size="small">
                      Subir
                    </Button>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {!fotos || fotos.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No hay fotos
                    </Typography>
                  ) : (
                    fotos.map((foto) => (
                      <Box
                        key={foto.id_foto}
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          p: 1,
                          width: 130,
                          position: 'relative',
                          bgcolor: '#fafafa',
                        }}
                      >
                        <img
                          src={`${API_BASE_URL}/${foto.ruta_archivo.replace(/\\/g, '/')}`}
                          alt={foto.descripcion || 'Foto'}
                          style={{
                            width: '100%',
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: '4px',
                          }}
                          onError={(e) => {
                            e.target.src =
                              'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23eee%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2212%22%3Esin foto%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <Typography
                          variant="caption"
                          display="block"
                          noWrap
                          sx={{ fontSize: '0.65rem', mt: 0.5, color: '#666' }}
                        >
                          {foto.descripcion || 'Sin descripción'}
                        </Typography>
                        {userRol === 'Inspector' && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => eliminarFoto(foto.id_foto)}
                            sx={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              bgcolor: 'rgba(255,255,255,0.9)',
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ))
                  )}
                </Box>
              </SectionCard>

              <SectionCard
                step={4}
                title="Firmas digitales"
                subtitle="Certifique el resultado al finalizar el checklist"
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      size="small"
                      label={`Inspector: ${firmas?.firma_inspector ? 'Firmado' : 'Pendiente'}`}
                      color={firmas?.firma_inspector ? 'success' : 'default'}
                      variant={firmas?.firma_inspector ? 'filled' : 'outlined'}
                    />
                    <Chip
                      size="small"
                      label={`Cliente: ${firmas?.firma_cliente ? 'Firmado' : 'Pendiente'}`}
                      color={firmas?.firma_cliente ? 'success' : 'default'}
                      variant={firmas?.firma_cliente ? 'filled' : 'outlined'}
                    />
                  </Box>
                }
              >
                {userRol === 'Inspector' && (
                  <SignaturePad
                    label="Firma del inspector"
                    disabled={firmas?.firma_inspector}
                    onSave={firmarComoInspector}
                    fecha={firmas?.fecha_firma_inspector}
                  />
                )}
                {userRol === 'Cliente' && (
                  <SignaturePad
                    label="Firma del cliente"
                    disabled={firmas?.firma_cliente}
                    onSave={firmarComoCliente}
                    fecha={firmas?.fecha_firma_cliente}
                  />
                )}
                {userRol !== 'Inspector' && userRol !== 'Cliente' && (
                  <Typography variant="body2" color="text.secondary">
                    Solo el inspector o el cliente pueden registrar su firma en esta inspección.
                  </Typography>
                )}
              </SectionCard>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E8EDF2', bgcolor: '#F7F9FC' }}>
          <Button variant="contained" onClick={() => setDetailOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, row: null })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar inspección"
        message={
          deleteDialog.row
            ? `¿Eliminar inspección de "${deleteDialog.row.building}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        confirmColor="error"
        loading={deleting}
      />
    </Box>
  );
}