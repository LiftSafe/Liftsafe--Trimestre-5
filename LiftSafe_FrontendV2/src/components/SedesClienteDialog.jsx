import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, List, ListItem, ListItemText, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { clienteService } from '../services/clienteService';

const SEDE_VACIA = { nombre: '', direccion: '', ciudad: '' };

// Sedes (sucursales) de un cliente. Si el cliente tiene 2 o más,
// al registrar un ascensor se pide elegir en qué sede está.
// Se monta solo mientras está abierto (ver Users.jsx), así cada vez que se
// abre empieza limpio y carga las sedes de ese cliente.
export default function SedesClienteDialog({ open, cliente, onClose }) {
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
      setError('Escribe el nombre de la sede');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await clienteService.crearSede(cliente.id, nueva);
      setNueva(SEDE_VACIA);
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo agregar la sede');
    } finally {
      setGuardando(false);
    }
  };

  const guardarEdicion = async () => {
    if (!editando.nombre.trim()) {
      setError('El nombre de la sede no puede quedar vacío');
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>Sedes de {cliente?.name || 'cliente'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Si el cliente tiene 2 o más sedes, al registrar un ascensor se pedirá elegir en cuál está.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
        ) : (
          <List dense disablePadding sx={{ mb: 2 }}>
            {!sedes.length && (
              <Typography color="text.secondary" sx={{ py: 1 }}>Este cliente todavía no tiene sedes.</Typography>
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
                  <IconButton color="primary" onClick={guardarEdicion} disabled={guardando} title="Guardar sede">
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => setEditando(null)} title="Cancelar">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItem>
              ) : (
                <ListItem
                  key={s.id_sede}
                  divider
                  disableGutters
                  secondaryAction={(
                    <>
                      <IconButton size="small" color="primary" onClick={() => setEditando({ ...s })} title="Editar sede">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => eliminar(s)} title="Eliminar sede">
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
              )
            ))}
          </List>
        )}

        <Typography fontWeight={600} sx={{ mb: 1 }}>Agregar sede</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
          <TextField label="Nombre de la sede" required size="small" sx={{ gridColumn: '1 / -1' }}
            placeholder="Ej: Sede Norte" value={nueva.nombre}
            onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} />
          <TextField label="Dirección" size="small" value={nueva.direccion}
            onChange={(e) => setNueva({ ...nueva, direccion: e.target.value })} />
          <TextField label="Ciudad" size="small" value={nueva.ciudad}
            onChange={(e) => setNueva({ ...nueva, ciudad: e.target.value })} />
        </Box>
        <Button sx={{ mt: 1.5 }} variant="outlined" startIcon={<AddIcon />} onClick={agregar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Agregar sede'}
        </Button>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" onClick={onClose}>Listo</Button>
      </DialogActions>
    </Dialog>
  );
}
