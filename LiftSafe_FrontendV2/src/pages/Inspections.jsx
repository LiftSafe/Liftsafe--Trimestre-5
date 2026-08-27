<<<<<<< HEAD
<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Typography, Divider, IconButton, CircularProgress, Alert, Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DrawIcon from '@mui/icons-material/Draw';
import VerifiedIcon from '@mui/icons-material/Verified';
=======
// src/pages/Inspections.jsx
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import IconButton from '@mui/material/IconButton';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography, Checkbox, FormControlLabel, Divider, Alert, CircularProgress,
  Snackbar, // ✅ AGREGADO
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
>>>>>>> feature/esteban-local
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { statusColor } from '../utils/statusHelpers';
import { brand } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
<<<<<<< HEAD
import { apiClient } from '../services/apiClient';
import { fotografiaService } from '../services/fotografiaService';
import { firmaService } from '../services/firmaService';
import { API_BASE_URL } from '../config/api';
=======
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Divider,
  Alert, CircularProgress, Radio, RadioGroup, FormControl, FormControlLabel, IconButton,
  TextField, MenuItem, Checkbox,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/Delete';
import PageHeader from '../components/PageHeader';
import { statusColor } from '../data/mockData';
import { brand } from '../theme/colors';
import { inspeccionesService } from '../services/inspeccionesService';
import { checklistService } from '../services/checklistService';
import { observacionService } from '../services/observacionService';

const NIVELES_RIESGO = ['Bajo', 'Medio', 'Alto', 'Crítico'];
const TIPOS_OBSERVACION = ['Preventiva', 'Correctiva', 'Urgente'];
>>>>>>> 18177d26d35979b66edf2bf8306e2fa03f251cad

const inspeccionService = {
  listar: () => apiClient.get('/inspecciones/mis-inspecciones'),
  obtener: (id) => apiClient.get(`/inspecciones/${id}`),
  crear: (data) => apiClient.post('/inspecciones/crear', data),
  actualizarEstado: (id, estado) => apiClient.put(`/inspecciones/${id}/estado?estado=${estado}`),
};

const checklistService = {
  listarPorInspeccion: (id) => apiClient.get(`/checklist/inspeccion/${id}`),
};

const statusColor = {
  Programada: 'warning',
  'En Progreso': 'info',
  Completada: 'success',
  Finalizada: 'success',
  Aprobada: 'success',
  Cancelada: 'error',
  Borrador: 'default',
};

const PAD_HEIGHT = 200;

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

  const setupCanvas = () => {
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
  };

  useEffect(() => {
    if (disabled) return undefined;
    setupCanvas();
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const observer = new ResizeObserver(() => setupCanvas());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [disabled]);

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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function Inspections() {
<<<<<<< HEAD
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [newInspection, setNewInspection] = useState({
    id_ascensor: '',
    id_inspector: '',
    fecha_programada: '',
    observaciones_generales: '',
  });
=======
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [rowsError, setRowsError] = useState('');
>>>>>>> 18177d26d35979b66edf2bf8306e2fa03f251cad

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [firmas, setFirmas] = useState({
    firma_inspector: false,
    firma_cliente: false,
    ambas_firmas: false,
    fecha_firma_inspector: null,
    fecha_firma_cliente: null,
  });
  const [fotos, setFotos] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fotoDescripcion, setFotoDescripcion] = useState('');

<<<<<<< HEAD
  const userRol = user?.rol || user?.role;

  const cargarInspecciones = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await inspeccionService.listar();
      setInspections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando inspecciones:', err);
      setError('Error al cargar las inspecciones. Verifica tu conexión con el backend.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await inspeccionService.listar();
        if (!cancelled) {
          setInspections(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error cargando inspecciones:', err);
          setError('Error al cargar las inspecciones. Verifica tu conexión con el backend.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const abrirDetalle = async (row) => {
    setSelected(row);
    setDetailOpen(true);
    setLoadingDetail(true);
    setChecklist([]);
    setFotos([]);
    setFirmas({ 
      firma_inspector: false, 
      firma_cliente: false, 
      ambas_firmas: false,
      fecha_firma_inspector: null,
      fecha_firma_cliente: null,
    });

    try {
      const id = row.id_inspeccion || row.id;
      const detalle = await inspeccionService.obtener(id);
      setSelected(detalle);

      try {
        const checklistData = await checklistService.listarPorInspeccion(id);
        setChecklist(Array.isArray(checklistData) ? checklistData : []);
      } catch {
        setChecklist([]);
      }

      try {
        const firmasData = await firmaService.verificarFirmas(id);
        setFirmas({
          firma_inspector: firmasData.firma_inspector || false,
          firma_cliente: firmasData.firma_cliente || false,
          ambas_firmas: firmasData.ambas_firmas || false,
          fecha_firma_inspector: firmasData.fecha_firma_inspector || null,
          fecha_firma_cliente: firmasData.fecha_firma_cliente || null,
        });
      } catch {
        setFirmas({ 
          firma_inspector: false, 
          firma_cliente: false, 
          ambas_firmas: false,
          fecha_firma_inspector: null,
          fecha_firma_cliente: null,
        });
      }

      if (detalle.id_informe) {
        try {
          const fotosData = await fotografiaService.listarPorInforme(detalle.id_informe);
          setFotos(Array.isArray(fotosData) ? fotosData : []);
        } catch {
          setFotos([]);
        }
      }
    } catch (err) {
      console.error('Error cargando detalle:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const crearInspeccion = async () => {
    try {
      await inspeccionService.crear(newInspection);
      setOpenCreate(false);
      setNewInspection({ id_ascensor: '', id_inspector: '', fecha_programada: '', observaciones_generales: '' });
      await cargarInspecciones();
      alert('Inspección creada exitosamente');
    } catch (err) {
      console.error('Error creando inspección:', err);
      alert('Error al crear la inspección');
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
      alert('Foto subida exitosamente');
    } catch (err) {
      console.error('Error subiendo foto:', err);
      alert('Error al subir la foto');
    }
  };

  const eliminarFoto = async (idFoto) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      await fotografiaService.eliminar(idFoto);
      const fotosData = await fotografiaService.listarPorInforme(selected.id_informe);
      setFotos(Array.isArray(fotosData) ? fotosData : []);
    } catch (err) {
      console.error('Error eliminando foto:', err);
      alert('Error al eliminar la foto');
    }
  };

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
      alert('Firma del inspector registrada');
    } catch (err) {
      alert('Error al registrar firma: ' + (err.message || ''));
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
      alert('Firma del cliente registrada');
    } catch (err) {
      alert('Error al registrar firma: ' + (err.message || ''));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
=======
  const [categorias, setCategorias] = useState([]);
  const [detalles, setDetalles] = useState({}); // { [id_item]: { id_detalle, resultado } }
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [checklistError, setChecklistError] = useState('');
  const [savingItem, setSavingItem] = useState(null);

  const [observaciones, setObservaciones] = useState([]);
  const [obsError, setObsError] = useState('');
  const [obsLoading, setObsLoading] = useState(false);

  const [nuevaObs, setNuevaObs] = useState({ tipo_observacion: 'Preventiva', descripcion: '', nivel_riesgo: 'Bajo', requiere_atencion_inmediata: false });
  const [creandoObs, setCreandoObs] = useState(false);

  useEffect(() => {
    async function cargarInspecciones() {
      setLoadingRows(true);
      setRowsError('');
      try {
        const data = await inspeccionesService.misInspecciones();
        setRows(data || []);
      } catch (err) {
        setRowsError(err.message || 'No se pudieron cargar las inspecciones');
      } finally {
        setLoadingRows(false);
      }
    }
    cargarInspecciones();
  }, []);

  async function cargarChecklist(idInspeccion) {
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
  }

  async function cargarObservaciones(idInforme) {
    setObsError('');
    if (!idInforme) {
      setObservaciones([]);
      setObsError('Esta inspección todavía no tiene un informe generado, así que no se pueden registrar observaciones.');
      return;
    }
    try {
      const obs = await observacionService.listarPorInforme(idInforme);
      setObservaciones(obs || []);
    } catch (err) {
      setObservaciones([]);
      setObsError(err.message || 'No se pudieron cargar las observaciones');
    }
  }

  async function abrirDetalle(row) {
    setSelected(row);
    setDetailOpen(true);
    setNuevaObs({ tipo_observacion: 'Preventiva', descripcion: '', nivel_riesgo: 'Bajo', requiere_atencion_inmediata: false });
    await Promise.all([cargarChecklist(row.id_inspeccion), cargarObservaciones(row.id_informe)]);
  }

  async function calificarItem(item, resultado) {
    setSavingItem(item.id_item);
    try {
      const guardado = await checklistService.calificar({
        id_inspeccion: selected.id_inspeccion,
        id_item: item.id_item,
        resultado,
      });
      setDetalles((prev) => ({
        ...prev,
        [item.id_item]: { id_detalle: guardado.id_detalle, resultado: guardado.resultado },
      }));
    } catch (err) {
      setChecklistError(err.message || 'No se pudo guardar la calificación');
    } finally {
      setSavingItem(null);
    }
  }

  async function eliminarCalificacion(item) {
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
    } catch (err) {
      setChecklistError(err.message || 'No se pudo eliminar la calificación');
    } finally {
      setSavingItem(null);
    }
  }

  async function crearObservacion() {
    if (!nuevaObs.descripcion.trim()) return;
    setCreandoObs(true);
    try {
      await observacionService.crear({
        id_informe: selected.id_informe,
        ...nuevaObs,
      });
      setNuevaObs({ tipo_observacion: 'Preventiva', descripcion: '', nivel_riesgo: 'Bajo', requiere_atencion_inmediata: false });
      await cargarObservaciones(selected.id_informe);
    } catch (err) {
      setObsError(err.message || 'No se pudo crear la observación');
    } finally {
      setCreandoObs(false);
    }
  }

  async function eliminarObservacion(idObservacion) {
    try {
      await observacionService.eliminar(idObservacion);
      await cargarObservaciones(selected.id_informe);
    } catch (err) {
      setObsError(err.message || 'No se pudo eliminar la observación');
    }
>>>>>>> 18177d26d35979b66edf2bf8306e2fa03f251cad
  }

=======
import { useDashboardData } from '../hooks/useDashboardData';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { fetchInspecciones, fetchEdificios, fetchAscensores, crearInspeccion } from '../services/dashboardService';

const CHECKLIST_CATEGORIES = [
  { category: 'Seguridad', items: ['Frenos de emergencia', 'Paracaídas', 'Límite de velocidad', 'Puertas de cabina'] },
  { category: 'Mecánica', items: ['Cables de tracción', 'Poleas', 'Motor de tracción', 'Sistema de guías'] },
  { category: 'Eléctrica', items: ['Tablero de control', 'Botonera', 'Iluminación de cabina', 'Sistema de alarma'] },
  { category: 'Documentación', items: ['Manual de mantenimiento', 'Registro de revisiones', 'Placa de capacidad', 'Certificado vigente'] },
];

// ========== COMPONENTE CONFIRM DIALOG (reutilizable inline) ==========
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

export default function Inspections() {
  const { hasAction } = useAuth();
  const { data: rows = [], loading, error, refetch } = useDashboardData(fetchInspecciones);
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    rows,
    ['building', 'elevator', 'brand', 'model', 'type', 'inspector', 'status', 'date']
  );
  
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

  // ✅ ESTADOS PARA SNACKBAR (reemplazan todos los alert)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // ✅ ESTADOS PARA CONFIRM DIALOG DE ELIMINAR
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [deleting, setDeleting] = useState(false);

  // Helper para mostrar snackbar
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const setFechaMin = useCallback((node) => {
    if (node !== null) {
      const input = node.querySelector('input[type="date"]');
      if (input) {
        const hoy = new Date().toISOString().split('T')[0];
        input.setAttribute('min', hoy);
      }
    }
  }, []);

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

  useEffect(() => {
    if (open) {
      cargarEdificios();
    }
  }, [open]);

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
      const ascensoresFiltrados = todosAscensores.filter(a => a.building === edificioId);
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

  // ✅ REEMPLAZADOS: 4 alert() → showSnackbar()
  const handleCrearInspeccion = async () => {
    if (!edificioSeleccionado || !ascensorSeleccionado || !fechaProgramada) {
      showSnackbar('Por favor complete todos los campos obligatorios', 'warning');
      return;
    }
    if (!validarFecha(fechaProgramada)) {
      showSnackbar(fechaError || 'La fecha programada no es válida', 'error');
      return;
    }
    const ascensor = ascensores.find(a => a.id === ascensorSeleccionado);
    if (!ascensor) {
      showSnackbar('Ascensor no válido', 'error');
      return;
    }
    
    const data = {
      id_ascensor: parseInt(ascensorSeleccionado),
      id_inspector: 1,
      fecha_programada: fechaProgramada,
      tipo_servicio: tipoInspeccion,
      observaciones: observaciones
    };
    
    try {
      setLoadingModal(true);
      const result = await crearInspeccion(data);
      console.log('Inspección creada:', result);
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

  // ✅ REEMPLAZADO: window.confirm() → ConfirmDialog
  const handleDeleteClick = (row) => {
    setDeleteDialog({ open: true, row });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.row) return;
    setDeleting(true);
    try {
      // TODO: await deleteInspeccion(deleteDialog.row.id);
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

>>>>>>> feature/esteban-local
  return (
    <Box>
      <PageHeader
        title="Inspecciones"
<<<<<<< HEAD
<<<<<<< HEAD
        subtitle={userRol === 'Administrador' ? 'Gestión global de inspecciones' : 'Tus inspecciones asignadas'}
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Inspecciones' }]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {userRol !== 'Cliente' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
            Nueva inspección
          </Button>
        </Box>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Ascensor</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Inspector</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Firmas</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!inspections || inspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No hay inspecciones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  inspections.map((row) => (
                    <TableRow
                      key={row.id_inspeccion || row.id}
=======
        subtitle="Tus inspecciones asignadas"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Inspecciones' }]}
      />

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loadingRows && (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
          )}
          {!loadingRows && rowsError && <Alert severity="error" sx={{ m: 2 }}>{rowsError}</Alert>}
          {!loadingRows && !rowsError && rows.length === 0 && (
            <Alert severity="info" sx={{ m: 2 }}>No tienes inspecciones asignadas todavía.</Alert>
          )}
          {!loadingRows && !rowsError && rows.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Ascensor</strong></TableCell>
                    <TableCell><strong>Fecha inicio</strong></TableCell>
                    <TableCell><strong>Fecha fin</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Informe</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id_inspeccion}
>>>>>>> 18177d26d35979b66edf2bf8306e2fa03f251cad
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => abrirDetalle(row)}
                    >
<<<<<<< HEAD
                      <TableCell>
                        <Typography fontWeight={600} color="primary.main">
                          {row.id_inspeccion || row.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.codigo_ascensor || row.elevator || 'N/A'}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.marca || ''}</Typography>
                      </TableCell>
                      <TableCell>{row.tipo_servicio || row.type || 'Periódica'}</TableCell>
                      <TableCell>{row.nombre_inspector || row.inspector || 'N/A'}</TableCell>
                      <TableCell>{row.fecha_inicio ? new Date(row.fecha_inicio).toLocaleDateString() : row.date || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.estado || row.status || 'Pendiente'}
                          color={statusColor[row.estado || row.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {row.firma_inspector && row.firma_cliente ? '✓' :
                          row.firma_inspector ? 'Inspector' :
                            row.firma_cliente ? 'Cliente' : '—'}
                      </TableCell>
=======
        subtitle="Inspecciones registradas en LiftSafe"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Inspecciones' }]}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar inspección..." />
        {hasAction('createInspection') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Nueva inspección</Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Edificio</strong></TableCell>
                      <TableCell><strong>Ascensor</strong></TableCell>
                      <TableCell><strong>Tipo</strong></TableCell>
                      <TableCell><strong>Inspector</strong></TableCell>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Próxima</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell align="right"><strong>Acciones</strong></TableCell>
>>>>>>> feature/esteban-local
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginated.map((row) => (
                      <TableRow key={row.id} hover sx={{ cursor: 'pointer' }}>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.building}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.elevator}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.type}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.inspector}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.date}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.nextDate}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          <Chip label={row.status} color={statusColor[row.status] || 'default'} size="small" />
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
                        <TableCell colSpan={8} align="center">No hay inspecciones registradas</TableCell>
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

<<<<<<< HEAD
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          Nueva inspección
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setOpenCreate(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
=======
      {/* MODAL DE NUEVA INSPECCIÓN */}
      <Dialog open={open} onClose={() => { setOpen(false); limpiarFormulario(); }} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Nueva inspección</DialogTitle>
>>>>>>> feature/esteban-local
        <DialogContent>
          {loadingModal && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
<<<<<<< HEAD
            <TextField label="ID del Ascensor" fullWidth type="number" value={newInspection.id_ascensor}
              onChange={(e) => setNewInspection({ ...newInspection, id_ascensor: e.target.value })} required />
            <TextField label="ID del Inspector" fullWidth type="number" value={newInspection.id_inspector}
              onChange={(e) => setNewInspection({ ...newInspection, id_inspector: e.target.value })} required />
            <TextField label="Fecha programada" type="date" fullWidth InputLabelProps={{ shrink: true }}
              value={newInspection.fecha_programada}
              onChange={(e) => setNewInspection({ ...newInspection, fecha_programada: e.target.value })} required />
            <TextField label="Observaciones iniciales" multiline rows={3} fullWidth
              value={newInspection.observaciones_generales}
              onChange={(e) => setNewInspection({ ...newInspection, observaciones_generales: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button variant="contained" onClick={crearInspeccion}>Crear inspección</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box>
              <Typography fontWeight={700} fontSize="1.1rem">Inspección #{selected?.id_inspeccion || selected?.id}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selected?.codigo_ascensor || selected?.elevator || 'N/A'} · {selected?.tipo_servicio || selected?.type || 'Periódica'}
              </Typography>
            </Box>
            <Chip label={selected?.estado || selected?.status || 'Pendiente'}
              color={statusColor[selected?.estado || selected?.status] || 'default'} />
          </Box>
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setDetailOpen(false)}>
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
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 2.5, mb: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Fecha inicio
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.95rem' }}>
                    {selected?.fecha_inicio ? new Date(selected.fecha_inicio).toLocaleString() : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Observaciones
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.5, fontSize: '0.95rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', color: '#1A2332' }}
                  >
                    {selected?.observaciones_generales || 'Sin observaciones'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1rem', color: '#0B1929' }}>
                  Firmas digitales
                </Typography>
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
              </Box>

              <Box sx={{ mb: 3 }}>
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
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.95rem', mb: 1.5, color: '#1a237e' }}>
                Checklist de Inspección
              </Typography>
              {!checklist || checklist.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No hay items de checklist registrados
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                  {checklist.map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                      <Chip label={item.resultado || 'Pendiente'} size="small" />
                      <Typography variant="body2">{item.descripcion || `Item ${item.id_item}`}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.95rem', mb: 1.5, color: '#1a237e' }}>
                Fotografías ({fotos.length})
              </Typography>

              {userRol === 'Inspector' && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} id="foto-upload"
                    onChange={(e) => setSelectedFile(e.target.files[0])} />
                  <label htmlFor="foto-upload">
                    <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />} size="small">
                      Seleccionar foto
                    </Button>
                  </label>
                  {selectedFile && <Typography variant="body2">{selectedFile.name}</Typography>}
                  <TextField label="Descripción" size="small" value={fotoDescripcion}
                    onChange={(e) => setFotoDescripcion(e.target.value)} sx={{ flex: 1, minWidth: 150 }} />
                  <Button variant="contained" onClick={subirFoto} disabled={!selectedFile} size="small">Subir</Button>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {!fotos || fotos.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No hay fotos</Typography>
                ) : (
                  fotos.map((foto) => (
                    <Box key={foto.id_foto} sx={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 1, 
                      p: 1, 
                      width: 130, 
                      position: 'relative',
                      bgcolor: '#fafafa'
                    }}>
                      <img
                        src={`${API_BASE_URL}/${foto.ruta_archivo.replace(/\\/g, '/')}`}
                        alt={foto.descripcion || 'Foto'}
                        style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23eee%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2212%22%3Esin foto%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <Typography variant="caption" display="block" noWrap sx={{ fontSize: '0.65rem', mt: 0.5, color: '#666' }}>
                        {foto.descripcion || 'Sin descripción'}
                      </Typography>
                      {userRol === 'Inspector' && (
                        <IconButton size="small" color="error" onClick={() => eliminarFoto(foto.id_foto)}
                          sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.9)' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </>
=======
                      <TableCell><Typography fontWeight={600} color="primary.main">{row.id_inspeccion}</Typography></TableCell>
                      <TableCell>{row.codigo_ascensor}</TableCell>
                      <TableCell>{row.fecha_inicio ? String(row.fecha_inicio).slice(0, 10) : '—'}</TableCell>
                      <TableCell>{row.fecha_fin ? String(row.fecha_fin).slice(0, 10) : '—'}</TableCell>
                      <TableCell><Chip label={row.estado} color={statusColor[row.estado] || 'default'} size="small" /></TableCell>
                      <TableCell>
                        {row.id_informe
                          ? <Chip label={`#${row.id_informe}`} size="small" color="success" variant="outlined" />
                          : <Chip label="Sin informe" size="small" variant="outlined" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography fontWeight={700}>Inspección #{selected?.id_inspeccion} — {selected?.codigo_ascensor}</Typography>
          <Typography variant="body2" color="text.secondary">Estado: {selected?.estado}</Typography>
        </DialogTitle>
        <DialogContent>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary.dark">
            Checklist normativo (NTC 5926-1)
          </Typography>

          {loadingChecklist && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress size={24} /></Box>}
          {checklistError && <Alert severity="error" sx={{ mb: 2 }}>{checklistError}</Alert>}

          {!loadingChecklist && categorias.map((cat) => (
            <Box key={cat.id_categoria} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: brand.blueDark }}>
                {cat.nombre_categoria}
              </Typography>
              {cat.items.map((item) => {
                const actual = detalles[item.id_item]?.resultado || '';
                return (
                  <Box key={item.id_item} sx={{ mb: 1.5, pl: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>{item.descripcion}</Typography>
                      <FormControl>
                        <RadioGroup row value={actual} onChange={(e) => calificarItem(item, e.target.value)}>
                          <FormControlLabel value="Cumple" control={<Radio size="small" />} label="Cumple" disabled={savingItem === item.id_item} />
                          <FormControlLabel value="No Cumple" control={<Radio size="small" />} label="No Cumple" disabled={savingItem === item.id_item} />
                          <FormControlLabel value="No Aplica" control={<Radio size="small" />} label="No Aplica" disabled={savingItem === item.id_item} />
                        </RadioGroup>
                      </FormControl>
                    </Box>
                    {actual && (
                      <IconButton size="small" onClick={() => eliminarCalificacion(item)} disabled={savingItem === item.id_item} title="Quitar calificación">
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary.dark">
            Observaciones técnicas
          </Typography>
          {obsError && <Alert severity="info" sx={{ mb: 2 }}>{obsError}</Alert>}

          {observaciones.map((obs) => (
            <Box key={obs.id_observacion} sx={{ mb: 1, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{obs.tipo_observacion} — riesgo {obs.nivel_riesgo}{obs.requiere_atencion_inmediata ? ' · Atención inmediata' : ''}</Typography>
                <Typography variant="body2">{obs.descripcion}</Typography>
              </Box>
              <IconButton size="small" onClick={() => eliminarObservacion(obs.id_observacion)} title="Eliminar observación">
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}

          {selected?.id_informe && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Registrar nueva observación</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <TextField
                  select size="small" label="Tipo" sx={{ minWidth: 140 }}
                  value={nuevaObs.tipo_observacion}
                  onChange={(e) => setNuevaObs((p) => ({ ...p, tipo_observacion: e.target.value }))}
                >
                  {TIPOS_OBSERVACION.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField
                  select size="small" label="Nivel de riesgo" sx={{ minWidth: 140 }}
                  value={nuevaObs.nivel_riesgo}
                  onChange={(e) => setNuevaObs((p) => ({ ...p, nivel_riesgo: e.target.value }))}
                >
                  {NIVELES_RIESGO.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </TextField>
                <FormControlLabel
                  control={<Checkbox checked={nuevaObs.requiere_atencion_inmediata} onChange={(e) => setNuevaObs((p) => ({ ...p, requiere_atencion_inmediata: e.target.checked }))} />}
                  label="Atención inmediata"
                />
              </Box>
              <TextField
                fullWidth size="small" label="Descripción" multiline rows={2} sx={{ mb: 1 }}
                value={nuevaObs.descripcion}
                onChange={(e) => setNuevaObs((p) => ({ ...p, descripcion: e.target.value }))}
              />
              <Button variant="contained" size="small" onClick={crearObservacion} disabled={creandoObs || !nuevaObs.descripcion.trim()}>
                {creandoObs ? 'Guardando...' : 'Agregar observación'}
              </Button>
            </Box>
>>>>>>> 18177d26d35979b66edf2bf8306e2fa03f251cad
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
=======
            <TextField 
              select 
              label="Edificio" 
              fullWidth 
              value={edificioSeleccionado}
              onChange={(e) => handleEdificioChange(e.target.value)}
              disabled={loadingModal}
            >
              <MenuItem value=""><em>Seleccione un edificio</em></MenuItem>
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
              <MenuItem value=""><em>Seleccione un ascensor</em></MenuItem>
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
              ref={setFechaMin}
              label="Fecha programada" 
              type="date" 
              fullWidth 
              InputLabelProps={{ shrink: true }}
              value={fechaProgramada}
              onChange={handleFechaChange}
              error={!!fechaError}
              helperText={fechaError || ''}
              sx={{
                '& .MuiInputBase-root': {
                  pt: 1.5,
                }
              }}
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
          <Button onClick={() => { setOpen(false); limpiarFormulario(); }}>Cancelar</Button>
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
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography fontWeight={700}>{selected?.building}</Typography>
          <Typography variant="body2" color="text.secondary">{selected?.elevator} · {selected?.type} · {selected?.inspector}</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <Box><Typography variant="caption" color="text.secondary">Dirección</Typography><Typography variant="body2">{selected?.building}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Marca / Modelo</Typography><Typography variant="body2">{selected?.brand} {selected?.model}</Typography></Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary.dark">Lista de verificación técnica</Typography>
          {CHECKLIST_CATEGORIES.map((cat) => (
            <Box key={cat.category} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: brand.blueDark }}>{cat.category}</Typography>
              {cat.items.map((item) => (
                <FormControlLabel key={item} control={<Checkbox defaultChecked={selected?.status === 'Aprobada'} />} label={item} />
              ))}
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
          <Button variant="outlined">Generar reporte</Button>
          <Button variant="contained">Aprobar inspección</Button>
>>>>>>> feature/esteban-local
        </DialogActions>
      </Dialog>

      {/* ✅ SNACKBAR GLOBAL - Reemplaza todos los alert() */}
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

      {/* ✅ CONFIRM DIALOG PARA ELIMINAR - Reemplaza window.confirm() */}
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