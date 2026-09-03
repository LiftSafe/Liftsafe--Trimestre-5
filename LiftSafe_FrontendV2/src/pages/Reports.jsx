// src/pages/Reports.jsx

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton
} from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import MessageDialog, { MESSAGE_TITLES } from '../components/MessageDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import PromptDialog from '../components/PromptDialog';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { fetchInformes, fetchInspecciones } from '../services/dashboardService';
import { informeService } from '../services/informeService';
import { API_BASE_URL } from '../config/api';

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

  // ✅ Estados para MessageDialog (reemplaza alert()) y PromptDialog (reemplaza window.prompt())
  const [messageDialog, setMessageDialog] = useState({ open: false, title: '', message: '', severity: 'info' });
  const [promptDialog, setPromptDialog] = useState({ open: false, title: '', label: '', confirmText: 'Confirmar', onConfirm: null });

  const showMessage = (message, severity = 'info', title) => {
    setMessageDialog({ open: true, title: title || MESSAGE_TITLES[severity] || 'Información', message, severity });
  };
  const closeMessage = () => setMessageDialog((m) => ({ ...m, open: false }));
  const closePrompt = () => setPromptDialog((p) => ({ ...p, open: false }));

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
        showMessage('Esta inspección todavía no tiene un PDF generado. Genérelo desde Inspecciones.', 'warning');
        return;
      }
      window.open(`${API_BASE_URL}/${inf.ruta_pdf.replace(/\\/g, '/')}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      showMessage(err.message || 'No se encontró un informe generado para esta inspección', 'error');
    } finally {
      setProcesandoInformeId(null);
    }
  };

  const handleEnviarInforme = async (doc) => {
    setProcesandoInformeId(doc.id);
    try {
      const inf = await informeService.obtenerPorInspeccion(doc.id);
      if (!inf?.id_informe) {
        showMessage('Esta inspección todavía no tiene un informe generado.', 'warning');
        return;
      }
      if (inf.estado !== 'Aprobado') {
        showMessage(`El informe debe estar "Aprobado" para enviarlo (estado actual: ${inf.estado}).`, 'warning');
        return;
      }
      await informeService.enviar(inf.id_informe);
      showMessage('Informe enviado correctamente', 'success');
      if (refetch) refetch();
    } catch (err) {
      showMessage(err.message || 'Error al enviar el informe', 'error');
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
        showMessage('Esta inspección todavía no tiene un informe generado.', 'warning');
        return;
      }
      if (inf.estado !== 'Generado') {
        showMessage(`Solo se pueden revisar informes en estado "Generado" (estado actual: ${inf.estado}).`, 'warning');
        return;
      }
      setPromptDialog({
        open: true,
        title: 'Aprobar informe',
        label: 'Concepto técnico (opcional)',
        confirmText: 'Aprobar',
        onConfirm: async (concepto) => {
          closePrompt();
          setProcesandoInformeId(doc.id);
          try {
            await informeService.aprobar(inf.id_informe, { concepto_tecnico: concepto });
            showMessage('Informe aprobado correctamente', 'success');
            if (refetch) refetch();
          } catch (err) {
            showMessage(err.message || 'Error al aprobar el informe', 'error');
          } finally {
            setProcesandoInformeId(null);
          }
        },
      });
    } catch (err) {
      showMessage(err.message || 'Error al aprobar el informe', 'error');
    } finally {
      setProcesandoInformeId(null);
    }
  };

  const handleRechazarInforme = async (doc) => {
    setProcesandoInformeId(doc.id);
    try {
      const inf = await informeService.obtenerPorInspeccion(doc.id);
      if (!inf?.id_informe) {
        showMessage('Esta inspección todavía no tiene un informe generado.', 'warning');
        return;
      }
      if (inf.estado !== 'Generado') {
        showMessage(`Solo se pueden revisar informes en estado "Generado" (estado actual: ${inf.estado}).`, 'warning');
        return;
      }
      setPromptDialog({
        open: true,
        title: 'Rechazar informe',
        label: 'Motivo del rechazo',
        confirmText: 'Rechazar',
        onConfirm: async (motivo) => {
          closePrompt();
          setProcesandoInformeId(doc.id);
          try {
            await informeService.rechazar(inf.id_informe, { observaciones_revision: motivo });
            showMessage('Informe rechazado', 'success');
            if (refetch) refetch();
          } catch (err) {
            showMessage(err.message || 'Error al rechazar el informe', 'error');
          } finally {
            setProcesandoInformeId(null);
          }
        },
      });
    } catch (err) {
      showMessage(err.message || 'Error al rechazar el informe', 'error');
    } finally {
      setProcesandoInformeId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.doc) return;
    setDeleting(true);
    try {
      // ✅ FIX: antes esto era un TODO que solo hacía console.log, por eso
      // "eliminar" no borraba nada de verdad. deleteDialog.doc.id es el id
      // de la INSPECCIÓN (así lo entrega /dashboard/informes), no el id del
      // informe -> hay que resolver primero el id_informe real antes de
      // poder borrarlo.
      const inf = await informeService.obtenerPorInspeccion(deleteDialog.doc.id);
      if (!inf?.id_informe) {
        showMessage('No se encontró un informe generado para este documento.', 'warning');
        return;
      }
      await informeService.eliminar(inf.id_informe);
      showMessage('Documento eliminado correctamente', 'success');
      if (refetch) refetch();
    } catch (err) {
      showMessage(err.message || 'No fue posible eliminar el documento.', 'error');
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

      {/* ✅ MESSAGE DIALOG (reemplaza alert()) */}
      <MessageDialog
        open={messageDialog.open}
        onClose={closeMessage}
        title={messageDialog.title}
        message={messageDialog.message}
        severity={messageDialog.severity}
      />

      {/* ✅ PROMPT DIALOG (reemplaza window.prompt()) */}
      <PromptDialog
        open={promptDialog.open}
        onClose={closePrompt}
        onConfirm={promptDialog.onConfirm || (() => {})}
        title={promptDialog.title}
        label={promptDialog.label}
        confirmText={promptDialog.confirmText}
      />
    </Box>
  );
}
