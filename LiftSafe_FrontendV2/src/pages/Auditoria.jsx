import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell, TextField, MenuItem, Skeleton, Alert, Card, CardContent } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { auditoriaService } from '../services/auditoriaService';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';

const TABLAS_AUDITABLES = [
  'usuario', 'ascensor', 'solicitud', 'inspeccion', 'checklist_item',
  'detalle_checklist', 'fotografia', 'observacion', 'informe', 'usuario_ascensor',
];

export default function Auditoria() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroTabla, setFiltroTabla] = useState('');

  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    logs,
    ['usuario_nombre', 'tabla_afectada', 'operacion']
  );

  const cargarAuditoria = async () => {
    setLoading(true);
    setError('');
    try {
      const data = filtroTabla
        ? await auditoriaService.filtrarPorTabla(filtroTabla)
        : await auditoriaService.listar();
      setLogs(data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar la auditoría');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- patron estandar de carga de datos al montar
  useEffect(() => {
    cargarAuditoria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTabla]);

  if (user?.role !== 'Administrador') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tienes permisos para ver esta página</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Auditoría del sistema
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Historial de todas las acciones realizadas en el sistema
      </Typography>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            select
            label="Filtrar por tabla"
            value={filtroTabla}
            onChange={(e) => setFiltroTabla(e.target.value)}
            size="small"
            sx={{ minWidth: 220, mb: 2 }}
          >
            <MenuItem value="">Todas las tablas</MenuItem>
            {TABLAS_AUDITABLES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>

          <Box sx={{ mb: 2 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar por usuario, tabla u operación..." />
          </Box>

          {loading ? (
            <Skeleton variant="rounded" height={200} />
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Tabla</TableCell>
                    <TableCell>Operación</TableCell>
                    <TableCell>Registro afectado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((log) => (
                    <TableRow key={log.id_auditoria}>
                      <TableCell>{new Date(log.fecha_evento).toLocaleString()}</TableCell>
                      <TableCell>{log.usuario_nombre || 'Sistema'}</TableCell>
                      <TableCell>{log.tabla_afectada}</TableCell>
                      <TableCell>{log.operacion}</TableCell>
                      <TableCell>{log.tabla_afectada} #{log.id_registro ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay registros de auditoría todavía
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <ListPagination count={totalCount} page={page} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}