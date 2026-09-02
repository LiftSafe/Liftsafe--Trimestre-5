import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';
import { Box, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { statusColor } from '../utils/statusHelpers';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { fetchAscensores } from '../services/dashboardService';

// ========== COMPONENTE CONFIRM DIALOG ==========
function ConfirmDialog({
  open, onClose, onConfirm, title = 'Confirmar acción',
  message = '¿Estás seguro?', confirmText = 'Aceptar',
  cancelText = 'Cancelar', confirmColor = 'error', loading = false,
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
        <Button onClick={onClose} disabled={loading}>{cancelText}</Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm} disabled={loading}>
          {loading ? 'Eliminando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Elevators() {
  const { hasAction } = useAuth();
  const { data: elevators = [], loading, error, refetch } = useDashboardData(fetchAscensores);
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    elevators,
    ['building', 'brand', 'model', 'city', 'location', 'status']
  );

  // ✅ Estados para ConfirmDialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (row) => {
    setDeleteDialog({ open: true, row });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.row) return;
    setDeleting(true);
    try {
      // TODO: await deleteAscensor(deleteDialog.row.id);
      console.log('Eliminar ascensor:', deleteDialog.row.id);
      if (refetch) refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, row: null });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Ascensores"
        subtitle="Inventario y estado operativo desde la base de datos"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Ascensores' }]}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar ascensor..." />
        {hasAction('createElevator') && <Button variant="contained" startIcon={<AddIcon />}>Registrar ascensor</Button>}
      </Box>
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
                      <TableCell><strong>Marca / Modelo</strong></TableCell>
                      <TableCell><strong>Ubicación</strong></TableCell>
                      <TableCell><strong>Pisos</strong></TableCell>
                      <TableCell><strong>Capacidad</strong></TableCell>
                      <TableCell><strong>Última inspección</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell align="right"><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginated.map((row) => (
                      <TableRow key={row.id} hover sx={{ cursor: 'pointer' }}>
                        <TableCell>{row.building}</TableCell>
                        <TableCell>{row.brand} {row.model}</TableCell>
                        <TableCell>{row.location || row.city}</TableCell>
                        <TableCell>{row.floors}</TableCell>
                        <TableCell>{row.capacity ? `${row.capacity} kg` : '—'}</TableCell>
                        <TableCell>{row.lastInspection}</TableCell>
                        <TableCell>
                          <Chip label={row.status} color={statusColor[row.status] || 'default'} size="small" />
                        </TableCell>
                        
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => {
                              console.log('Editar ascensor:', row.id);
                            }}
                            title="Editar ascensor"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(row)}
                            title="Eliminar ascensor"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!paginated.length && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">No hay ascensores registrados</TableCell>
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

      {/* ✅ CONFIRM DIALOG */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, row: null })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar ascensor"
        message={
          deleteDialog.row
            ? `¿Eliminar ascensor "${deleteDialog.row.brand} ${deleteDialog.row.model}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        confirmColor="error"
        loading={deleting}
      />
    </Box>
  );
}