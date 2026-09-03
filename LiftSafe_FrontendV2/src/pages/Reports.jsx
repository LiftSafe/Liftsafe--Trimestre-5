// src/pages/Reports.jsx

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { fetchInformes, fetchInspecciones } from '../services/dashboardService';
import { informeService } from '../services/informeService';
import { API_BASE_URL } from '../config/api';

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

export default function Reports() {
  const { user } = useAuth();
  const isClient = user?.role === 'Cliente';
  // RF-023: quién puede aprobar/rechazar un informe generado (paso 7 del flujo)
  const isReviewer = ['Coordinador', 'Director Técnico', 'Administrador'].includes(user?.role);

  const { data: docs = [], loading: loadingDocs, error: errorDocs, refetch } = useDashboardData(fetchInformes);
  const { data: inspecciones = [], loading: loadingInsp, error: errorInsp } = useDashboardData(fetchInspecciones);
  
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    docs,
    ['building', 'elevator', 'inspector', 'status', 'date']
  );

  const loading = loadingDocs || loadingInsp;
  const error = errorDocs || errorInsp;

  // ✅ Estados para ConfirmDialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, doc: null });
  const [deleting, setDeleting] = useState(false);

  // ---- Informe PDF / Envío (Esteban) ----
  const [procesandoInformeId, setProcesandoInformeId] = useState(null);

  const certificados = docs.filter(d => d.status === 'Aprobada' || d.status === 'Finalizada').length;
  const pendientes = inspecciones.filter(i => 
    i.status === 'Borrador' || i.status === 'En Proceso' || i.status === 'Programada'
  ).length;
  
  const hoy = new Date();
  const treintaDias = new Date(hoy.getTime() + (30 * 24 * 60 * 60 * 1000));
  const porVencer = inspecciones.filter(i => {
    if (!i.nextDate) return false;
    const nextDate = new Date(i.nextDate);
    return nextDate <= treintaDias && nextDate >= hoy;
  }).length;

  const summary = {
    certificados: certificados || 0,
    pendientes: pendientes || 0,
    por_vencer: porVencer || 0,
  };

  const handleDeleteClick = (doc) => {
    setDeleteDialog({ open: true, doc });
  };

  const handleVerPdf = async (doc) => {
    setProcesandoInformeId(doc.id);
    try {
      const inf = await informeService.obtenerPorInspeccion(doc.id);
      if (!inf?.ruta_pdf) {
        alert('Esta inspección todavía no tiene un PDF generado. Genérelo desde Inspecciones.');
        return;
      }
      window.open(`${API_BASE_URL}/${inf.ruta_pdf.replace(/\\/g, '/')}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert(err.message || 'No se encontró un informe generado para esta inspección');
    } finally {
      setProcesandoInformeId(null);
    }
  };

  const handleEnviarInforme = async (doc) => {
    setProcesandoInformeId(doc.id);
    try {
      const inf = await informeService.obtenerPorInspeccion(doc.id);
      if (!inf?.id_informe) {
        alert('Esta inspección todavía no tiene un informe generado.');
        return;
      }
      if (inf.estado !== 'Aprobado') {
        alert(`El informe debe estar "Aprobado" para enviarlo (estado actual: ${inf.estado}).`);
        return;
      }
      await informeService.enviar(inf.id_informe);
      alert('Informe enviado correctamente');
      if (refetch) refetch();
    } catch (err) {
      alert(err.message || 'Error al enviar el informe');
    } finally {
      setProcesandoInformeId(null);
    }
  };

  // ---- RF-023: Aprobar / Rechazar informe (Coordinador / Director Técnico) ----
  const handleAprobarInforme = async (doc) => {
    setProcesandoInformeId(doc.id);
    try {
      const inf = await informeService.obtenerPorInspeccion(doc.id);
      if (!inf?.id_informe) {
        alert('Esta inspección todavía no tiene un informe generado.');
        return;
      }
      if (inf.estado !== 'Generado') {
        alert(`Solo se pueden revisar informes en estado "Generado" (estado actual: ${inf.estado}).`);
        return;
      }
      const concepto = window.prompt('Concepto técnico (opcional):', '') || '';
      await informeService.aprobar(inf.id_informe, { concepto_tecnico: concepto });
      alert('Informe aprobado correctamente');
      if (refetch) refetch();
    } catch (err) {
      alert(err.message || 'Error al aprobar el informe');
    } finally {
      setProcesandoInformeId(null);
    }
  };

  const handleRechazarInforme = async (doc) => {
    setProcesandoInformeId(doc.id);
    try {
      const inf = await informeService.obtenerPorInspeccion(doc.id);
      if (!inf?.id_informe) {
        alert('Esta inspección todavía no tiene un informe generado.');
        return;
      }
      if (inf.estado !== 'Generado') {
        alert(`Solo se pueden revisar informes en estado "Generado" (estado actual: ${inf.estado}).`);
        return;
      }
      const motivo = window.prompt('Motivo del rechazo:', '') || '';
      await informeService.rechazar(inf.id_informe, { observaciones_revision: motivo });
      alert('Informe rechazado');
      if (refetch) refetch();
    } catch (err) {
      alert(err.message || 'Error al rechazar el informe');
    } finally {
      setProcesandoInformeId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.doc) return;
    setDeleting(true);
    try {
      // TODO: await deleteInforme(deleteDialog.doc.id);
      console.log('Eliminar reporte:', deleteDialog.doc.id);
      if (refetch) refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, doc: null });
    }
  };

  return (
    <Box>
      <PageHeader
        title={isClient ? 'Mis certificados' : 'Reportes y Certificados'}
        subtitle={isClient ? 'Consulta y descarga los certificados de tus ascensores' : 'Informes técnicos de inspección y certificados emitidos'}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Reportes' }]}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ mb: 2 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar reporte o certificado..." />
      </Box>

      {!isClient && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
          gap: 2, 
          mb: 3 
        }}>
          {[
            { label: 'Certificados emitidos', value: summary.certificados },
            { label: 'Reportes pendientes', value: summary.pendientes },
            { label: 'Por vencer (30 días)', value: summary.por_vencer },
          ].map((s) => (
            <Box key={s.label} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">{s.value}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {isClient ? 'Mis certificados' : 'Documentos recientes'}
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Documento</strong></TableCell>
                      <TableCell><strong>Edificio</strong></TableCell>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell align="right"><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((doc) => (
                      <TableRow key={doc.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PictureAsPdfOutlinedIcon color="error" />
                            Certificado
                          </Box>
                        </TableCell>
                        <TableCell>{doc.building}</TableCell>
                        <TableCell>{doc.date}</TableCell>
                        <TableCell>
                          <Chip label={doc.status} color="success" size="small" />
                        </TableCell>
                        
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Button
                            size="small"
                            startIcon={<VisibilityOutlinedIcon />}
                            onClick={() => handleVerPdf(doc)}
                            disabled={procesandoInformeId === doc.id}
                          >
                            Ver
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DownloadOutlinedIcon />}
                            onClick={() => handleVerPdf(doc)}
                            disabled={procesandoInformeId === doc.id}
                          >
                            PDF
                          </Button>
                          {isReviewer && (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleAprobarInforme(doc)}
                                disabled={procesandoInformeId === doc.id}
                                title="Aprobar informe"
                              >
                                <CheckCircleOutlinedIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRechazarInforme(doc)}
                                disabled={procesandoInformeId === doc.id}
                                title="Rechazar informe"
                              >
                                <CancelOutlinedIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          {!isClient && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEnviarInforme(doc)}
                              disabled={procesandoInformeId === doc.id}
                              title="Enviar informe"
                            >
                              <SendOutlinedIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              console.log('Editar reporte:', doc.id);
                            }}
                            title="Editar"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(doc)}
                            title="Eliminar"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!paginated.length && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No hay certificados disponibles</TableCell>
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
        onClose={() => setDeleteDialog({ open: false, doc: null })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar documento"
        message={
          deleteDialog.doc
            ? `¿Eliminar el certificado de "${deleteDialog.doc.building}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        confirmColor="error"
        loading={deleting}
      />
    </Box>
  );
}