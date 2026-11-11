import { Fragment, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, List, ListItem, ListItemText, TextField, Typography,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { clienteService } from '../services/clienteService';
import AscensoresEdificio from './AscensoresEdificio';

const SEDE_VACIA = { nombre: '', direccion: '', ciudad: '' };

// Sedes (sucursales) de un cliente. Si el cliente tiene 2 o más,
// al registrar un ascensor se pide elegir en qué sede está.
// Se monta solo mientras está abierto (ver Users.jsx), así cada vez que se
// abre empieza limpio y carga las sedes de ese cliente.
// Textos según quién lo usa: el Asesor habla de "edificios" y en cada uno
// registra los ascensores; el Administrador habla de "sedes".
const TEXTOS = {
  sede: {
    titulo: 'Sedes de', ayuda: 'Si el cliente tiene 2 o más sedes, al registrar un ascensor se pedirá elegir en cuál está.',
    vacio: 'Este cliente todavía no tiene sedes.', agregar: 'Agregar sede', nombre: 'Nombre de la sede',
    ejemplo: 'Ej: Sede Norte', una: 'la sede', editar: 'Editar sede', eliminar: 'Eliminar sede', guardar: 'Guardar sede',
  },
  edificio: {
    titulo: 'Edificios de', ayuda: 'Registra los edificios del cliente y, en cada uno, sus ascensores.',
    vacio: 'Este cliente todavía no tiene edificios.', agregar: 'Agregar edificio', nombre: 'Nombre del edificio',
    ejemplo: 'Ej: Edificio Torre Norte', una: 'el edificio', editar: 'Editar edificio', eliminar: 'Eliminar edificio', guardar: 'Guardar edificio',
  },
};

export default function SedesClienteDialog({ open, cliente, onClose, etiqueta = 'sede', conAscensores = false }) {
  const t = TEXTOS[etiqueta] || TEXTOS.sede;
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nueva, setNueva] = useState(SEDE_VACIA);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null); // { id_sede, nombre, direccion, ciudad }

  const idCliente = cliente?.id;

  const cargar = () => clienteService.listarSedes(idCliente)
    .then((lista) => setSedes(lista || []))
    .catch((err) => setError(err.message || 'No se pudieron cargar las sedes'))
    .finally(() => setCargando(false));

  useEffect(() => {
    if (!idCliente) return;
    clienteService.listarSedes(idCliente)
      .then((lista) => setSedes(lista || []))
      .catch((err) => setError(err.message || 'No se pudieron cargar las sedes'))
      .finally(() => setCargando(false));
  }, [idCliente]);

  const agregar = async () => {
    if (!nueva.nombre.trim()) {
      setError(`Escribe el nombre de ${t.una}`);
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await clienteService.crearSede(cliente.id, nueva);
      setNueva(SEDE_VACIA);
      await cargar();
    } catch (err) {
      setError(err.message || `No se pudo agregar ${t.una}`);
    } finally {
      setGuardando(false);
    }
  };

  const guardarEdicion = async () => {
    if (!editando.nombre.trim()) {
      setError(`El nombre de ${t.una} no puede quedar vacío`);
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const { id_sede, nombre, direccion, ciudad } = editando;
      await clienteService.modificarSede(id_sede, { nombre, direccion: direccion || '', ciudad: ciudad || '' });
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la sede');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (sede) => {
    setError('');
    try {
      await clienteService.eliminarSede(sede.id_sede);
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la sede');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={conAscensores ? 'md' : 'sm'} fullWidth>
      <DialogTitle fontWeight={700}>{t.titulo} {cliente?.name || 'cliente'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t.ayuda}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
        ) : (
          <List dense disablePadding sx={{ mb: 2 }}>
            {!sedes.length && (
              <Typography color="text.secondary" sx={{ py: 1 }}>{t.vacio}</Typography>
            )}
            {sedes.map((s) => (
              editando?.id_sede === s.id_sede ? (
                <ListItem key={s.id_sede} disableGutters sx={{ gap: 1, flexWrap: 'wrap' }}>
                  <TextField size="small" label="Nombre" value={editando.nombre}
                    onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} />
                  <TextField size="small" label="Dirección" value={editando.direccion || ''}
                    onChange={(e) => setEditando({ ...editando, direccion: e.target.value })} />
                  <TextField size="small" label="Ciudad" value={editando.ciudad || ''}
                    onChange={(e) => setEditando({ ...editando, ciudad: e.target.value })} />
                  <IconButton color="primary" onClick={guardarEdicion} disabled={guardando} title={t.guardar}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => setEditando(null)} title="Cancelar">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItem>
              ) : conAscensores ? (
                // Asesor: cada edificio en su tarjeta, con la tabla de sus ascensores
                <Card key={s.id_sede} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25,
                    bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider',
                  }}
                  >
                    <BusinessIcon color="primary" />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>{s.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap component="div">
                        {[s.direccion, s.ciudad].filter(Boolean).join(' · ') || 'Sin dirección registrada'}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      color={s.total_ascensores ? 'primary' : 'default'}
                      variant="outlined"
                      label={`${s.total_ascensores || 0} ${s.total_ascensores === 1 ? 'ascensor' : 'ascensores'}`}
                    />
                    <IconButton size="small" color="primary" onClick={() => setEditando({ ...s })} title={t.editar}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => eliminar(s)} title={t.eliminar}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <AscensoresEdificio sede={s} idCliente={idCliente} onCambio={cargar} enTarjeta />
                  </Box>
                </Card>
              ) : (
                <Fragment key={s.id_sede}>
                <ListItem
                  divider
                  disableGutters
                  secondaryAction={(
                    <>
                      <IconButton size="small" color="primary" onClick={() => setEditando({ ...s })} title={t.editar}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => eliminar(s)} title={t.eliminar}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                >
                  <ListItemText
                    primary={s.nombre}
                    secondary={[s.direccion, s.ciudad, `${s.total_ascensores || 0} ascensor(es)`].filter(Boolean).join(' · ')}
                  />
                </ListItem>
                </Fragment>
              )
            ))}
          </List>
        )}

        <Typography fontWeight={600} sx={{ mb: 1 }}>{t.agregar}</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
          <TextField label={t.nombre} required size="small" sx={{ gridColumn: '1 / -1' }}
            placeholder={t.ejemplo} value={nueva.nombre}
            onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} />
          <TextField label="Dirección" size="small" value={nueva.direccion}
            onChange={(e) => setNueva({ ...nueva, direccion: e.target.value })} />
          <TextField label="Ciudad" size="small" value={nueva.ciudad}
            onChange={(e) => setNueva({ ...nueva, ciudad: e.target.value })} />
        </Box>
        <Button sx={{ mt: 1.5 }} variant="outlined" startIcon={<AddIcon />} onClick={agregar} disabled={guardando}>
          {guardando ? 'Guardando...' : t.agregar}
        </Button>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" onClick={onClose}>Listo</Button>
      </DialogActions>
    </Dialog>
  );
}
