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

export default function Inspections() {
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [rowsError, setRowsError] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

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
  }

  return (
    <Box>
      <PageHeader
        title="Inspecciones"
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
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => abrirDetalle(row)}
                    >
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
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}