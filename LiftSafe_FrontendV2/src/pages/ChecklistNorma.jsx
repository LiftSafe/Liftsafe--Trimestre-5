import { useEffect, useMemo, useState } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Checkbox, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import { brand } from '../theme/colors';
import { checklistAdminService } from '../services/checklistService';
import { NIVELES, filtrarGrupos, resumenChecklist, siguienteOrden, sugerirCodigo } from '../utils/checklistNorma';

const COLOR_NIVEL = { 'Muy grave': '#D14343', Grave: '#C77700', Leve: brand.silverDark };

const GRUPO_VACIO = { nombre_categoria: '', descripcion: '', orden_visualizacion: 1, norma_referencia: 'NTC 5926-1:2012' };
const ITEM_VACIO = {
  id_categoria: '', codigo_item: '', descripcion: '', criterio_cumplimiento: '',
  nivel_criticidad: 'Grave', obligatorio: true, orden_visualizacion: 1,
};

// Formulario de un grupo (crear o editar)
// Se monta cada vez que se abre, así el formulario arranca con los datos de "inicial"
function GrupoDialog({ inicial, onCerrar, onGuardar }) {
  const [form, setForm] = useState(() => ({ ...GRUPO_VACIO, ...inicial }));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const guardar = async () => {
    if (!form.nombre_categoria.trim()) { setError('Escribe el nombre del grupo'); return; }
    setGuardando(true);
    try {
      await onGuardar({
        nombre_categoria: form.nombre_categoria,
        descripcion: form.descripcion || null,
        orden_visualizacion: Number(form.orden_visualizacion) || 0,
        norma_referencia: form.norma_referencia || null,
      });
    } catch (e) {
      setError(e.message || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onClose={onCerrar} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>{inicial?.id_categoria ? 'Editar grupo' : 'Nuevo grupo'}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
        <TextField label="Nombre del grupo" value={form.nombre_categoria} onChange={cambiar('nombre_categoria')}
          placeholder="Ej: 6.12 Ascensores panorámicos" helperText="Empieza con el numeral de la norma para que los códigos se propongan solos" autoFocus required />
        <TextField label="Descripción" value={form.descripcion || ''} onChange={cambiar('descripcion')} multiline minRows={2} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 2 }}>
          <TextField label="Orden" type="number" value={form.orden_visualizacion} onChange={cambiar('orden_visualizacion')} slotProps={{ htmlInput: { min: 0 } }} />
          <TextField label="Norma de referencia" value={form.norma_referencia || ''} onChange={cambiar('norma_referencia')} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
        {error && <Typography variant="body2" color="error" sx={{ flex: 1 }}>{error}</Typography>}
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

// Formulario de un ítem (crear o editar)
function ItemDialog({ inicial, grupos, onCerrar, onGuardar }) {
  const [form, setForm] = useState(() => ({ ...ITEM_VACIO, ...inicial, criterio_cumplimiento: inicial?.criterio_cumplimiento || '' }));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const guardar = async () => {
    if (!form.id_categoria) { setError('Elige el grupo'); return; }
    if (!form.codigo_item.trim()) { setError('Escribe el código del ítem'); return; }
    if (!form.descripcion.trim()) { setError('Escribe qué se revisa'); return; }
    setGuardando(true);
    try {
      await onGuardar({
        id_categoria: Number(form.id_categoria),
        codigo_item: form.codigo_item,
        descripcion: form.descripcion,
        criterio_cumplimiento: form.criterio_cumplimiento || null,
        nivel_criticidad: form.nivel_criticidad,
        obligatorio: !!form.obligatorio,
        orden_visualizacion: Number(form.orden_visualizacion) || 0,
      });
    } catch (e) {
      setError(e.message || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onClose={onCerrar} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>{inicial?.id_item ? 'Editar ítem' : 'Nuevo ítem'}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
        <TextField select label="Grupo" value={form.id_categoria} onChange={cambiar('id_categoria')} required>
          {grupos.map((g) => (
            <MenuItem key={g.id_categoria} value={g.id_categoria}>
              {g.nombre_categoria}{g.activo ? '' : ' (desactivado)'}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
          <TextField label="Código" value={form.codigo_item} onChange={cambiar('codigo_item')} placeholder="NTC-6.1-01" required />
          <TextField label="Orden" type="number" value={form.orden_visualizacion} onChange={cambiar('orden_visualizacion')} slotProps={{ htmlInput: { min: 0 } }} />
        </Box>
        <TextField label="Qué se revisa" value={form.descripcion} onChange={cambiar('descripcion')} multiline minRows={2} required />
        <TextField label="Criterio de cumplimiento" value={form.criterio_cumplimiento} onChange={cambiar('criterio_cumplimiento')}
          multiline minRows={2} helperText="Opcional: qué se considera que cumple" />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField select label="Nivel del defecto" value={form.nivel_criticidad} onChange={cambiar('nivel_criticidad')} sx={{ minWidth: 180 }}>
            {NIVELES.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </TextField>
          <FormControlLabel label="Obligatorio"
            control={<Checkbox checked={!!form.obligatorio} onChange={(e) => setForm((f) => ({ ...f, obligatorio: e.target.checked }))} />} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
        {error && <Typography variant="body2" color="error" sx={{ flex: 1 }}>{error}</Typography>}
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

// RNF-011 / CU014: mantener la lista de chequeo de la NTC 5926-1 sin tocar el código
export default function ChecklistNorma() {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [texto, setTexto] = useState('');
  const [verDesactivados, setVerDesactivados] = useState(false);
  const [grupoForm, setGrupoForm] = useState(null);   // null = cerrado
  const [itemForm, setItemForm] = useState(null);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vivo = true;
    checklistAdminService.listar()
      .then((d) => { if (vivo) { setGrupos(d); setError(''); } })
      .catch((e) => { if (vivo) setError(e.message || 'No se pudo cargar la lista de chequeo'); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [version]);

  const cargar = () => setVersion((v) => v + 1);

  const visibles = useMemo(() => filtrarGrupos(grupos, { texto, verDesactivados }), [grupos, texto, verDesactivados]);
  const resumen = useMemo(() => resumenChecklist(grupos), [grupos]);

  const guardarGrupo = async (data) => {
    if (grupoForm.id_categoria) await checklistAdminService.editarGrupo(grupoForm.id_categoria, data);
    else await checklistAdminService.crearGrupo(data);
    setGrupoForm(null);
    cargar();
  };

  const guardarItem = async (data) => {
    if (itemForm.id_item) await checklistAdminService.editarItem(itemForm.id_item, data);
    else await checklistAdminService.crearItem(data);
    setItemForm(null);
    cargar();
  };

  const alternar = async (accion) => {
    try {
      await accion();
      cargar();
    } catch (e) {
      setError(e.message || 'No se pudo guardar el cambio');
    }
  };

  // Con el grupo completo (también los ítems desactivados) para no repetir códigos
  const nuevoItem = (visible) => {
    const grupo = grupos.find((g) => g.id_categoria === visible.id_categoria) || visible;
    setItemForm({
      ...ITEM_VACIO,
      id_categoria: grupo.id_categoria,
      codigo_item: sugerirCodigo(grupo),
      orden_visualizacion: siguienteOrden(grupo.items),
    });
  };

  return (
    <Box>
      <PageHeader
        title="Lista de chequeo"
        subtitle={`Ítems de la norma que califica el inspector · ${resumen.grupos} grupos y ${resumen.items} ítems activos`}
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Lista de chequeo' }]}
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        Los cambios se aplican de inmediato en las inspecciones. Los ítems no se borran, se desactivan,
        para no perder lo que ya se calificó en inspecciones anteriores.
      </Alert>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <SearchBar value={texto} onChange={setTexto} placeholder="Buscar grupo, código o descripción" sx={{ minWidth: { xs: '100%', sm: 320 } }} />
        <FormControlLabel label="Ver desactivados"
          control={<Switch checked={verDesactivados} onChange={(e) => setVerDesactivados(e.target.checked)} />} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => setGrupoForm({ ...GRUPO_VACIO, orden_visualizacion: siguienteOrden(grupos.filter((g) => g.activo)) })}>
          Nuevo grupo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : visibles.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {texto ? 'No hay ítems que coincidan con la búsqueda.' : 'No hay grupos en la lista de chequeo.'}
        </Typography>
      ) : (
        visibles.map((g) => (
          <Accordion key={g.id_categoria} disableGutters defaultExpanded={!!texto}
            sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' }, opacity: g.activo ? 1 : 0.65 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: '100%', pr: 1 }}>
                <Typography fontWeight={700} color={brand.navy}>{g.nombre_categoria}</Typography>
                <Chip size="small" label={`${g.items.filter((i) => i.activo).length} ítems`} />
                {!g.activo && <Chip size="small" color="default" variant="outlined" label="Desactivado" />}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1.5 }}>
                {g.descripcion && <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 100%' }}>{g.descripcion}</Typography>}
                <Button size="small" startIcon={<AddIcon />} onClick={() => nuevoItem(g)}>Agregar ítem</Button>
                <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setGrupoForm(g)}>Editar grupo</Button>
                <FormControlLabel sx={{ ml: 0.5 }} label={g.activo ? 'Grupo activo' : 'Grupo desactivado'}
                  control={<Switch size="small" checked={!!g.activo}
                    onChange={(e) => alternar(() => checklistAdminService.editarGrupo(g.id_categoria, { activo: e.target.checked }))} />} />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Qué se revisa</TableCell>
                      <TableCell>Nivel</TableCell>
                      <TableCell align="center">Calificado</TableCell>
                      <TableCell align="center">Activo</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {g.items.length === 0 && (
                      <TableRow><TableCell colSpan={6} sx={{ color: 'text.secondary' }}>Este grupo no tiene ítems.</TableCell></TableRow>
                    )}
                    {g.items.map((i) => (
                      <TableRow key={i.id_item} sx={{ opacity: i.activo ? 1 : 0.55 }}>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{i.codigo_item}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{i.descripcion}</Typography>
                          {i.criterio_cumplimiento && (
                            <Typography variant="caption" color="text.secondary">{i.criterio_cumplimiento}</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLOR_NIVEL[i.nivel_criticidad] || brand.silverDark }}>
                            {i.nivel_criticidad}
                          </Typography>
                          {!i.obligatorio && <Typography variant="caption" color="text.secondary">Opcional</Typography>}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Veces que se ha calificado en inspecciones"><span>{i.usos}</span></Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Switch size="small" checked={!!i.activo} slotProps={{ input: { 'aria-label': `Activo ${i.codigo_item}` } }}
                            onChange={(e) => alternar(() => checklistAdminService.editarItem(i.id_item, { activo: e.target.checked }))} />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" aria-label={`Editar ${i.codigo_item}`} onClick={() => setItemForm(i)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {grupoForm && <GrupoDialog inicial={grupoForm} onCerrar={() => setGrupoForm(null)} onGuardar={guardarGrupo} />}
      {itemForm && <ItemDialog inicial={itemForm} grupos={grupos} onCerrar={() => setItemForm(null)} onGuardar={guardarItem} />}
    </Box>
  );
}
