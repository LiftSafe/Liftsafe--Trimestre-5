import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Rating, TextField, Button,
  Alert, CircularProgress, Chip, Divider,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import PageHeader from '../components/PageHeader';
import ListPagination from '../components/ListPagination';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { encuestaService } from '../services/encuestaService';

// ✅ Página nueva: cuando el Inspector finaliza una inspección, el backend
// (actualizar_estado en routes/inspecciones.py) crea automáticamente una
// encuesta para el cliente dueño de ese ascensor. Acá el Cliente ve sus
// encuestas pendientes (para calificar el servicio) y las que ya respondió.
export default function Encuestas() {
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  // borradores de calificación/comentario mientras el cliente aún no envía
  const [borradores, setBorradores] = useState({});
  const [enviandoId, setEnviandoId] = useState(null);

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await encuestaService.listarMias();
      setEncuestas(data || []);
    } catch (err) {
      console.error('Error cargando encuestas:', err);
      setError(err.message || 'No se pudieron cargar tus encuestas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const actualizarBorrador = (id, campo, valor) => {
    setBorradores((prev) => ({
      ...prev,
      [id]: { ...prev[id], [campo]: valor },
    }));
  };

  const handleEnviar = async (encuesta) => {
    const borrador = borradores[encuesta.id_encuesta] || {};
    if (!borrador.calificacion) {
      setError('Selecciona una calificación de 1 a 5 estrellas antes de enviar');
      return;
    }
    setError('');
    setEnviandoId(encuesta.id_encuesta);
    try {
      await encuestaService.responder(encuesta.id_encuesta, {
        calificacion: borrador.calificacion,
        comentario: borrador.comentario || null,
      });
      setExito('¡Gracias por tu respuesta!');
      await cargar();
    } catch (err) {
      console.error('Error respondiendo encuesta:', err);
      setError(err.message || 'No se pudo enviar la encuesta');
    } finally {
      setEnviandoId(null);
    }
  };

  const pendientesTodas = encuestas.filter((e) => !e.respondida);
  const respondidasTodas = encuestas.filter((e) => e.respondida);

  // ✅ FIX: las dos listas (pendientes/respondidas) se renderizaban
  // completas sin límite -> con muchas inspecciones finalizadas, la
  // pantalla se volvía una lista interminable. Se pagina cada una por
  // separado (5 tarjetas por página, son más altas que una fila de tabla),
  // reutilizando el mismo hook que ya usan Inspecciones/Solicitudes.
  const {
    page: paginaPendientes, setPage: setPaginaPendientes,
    paginated: pendientes, totalCount: totalPendientes,
  } = usePaginatedSearch(pendientesTodas, [], 5);
  const {
    page: paginaRespondidas, setPage: setPaginaRespondidas,
    paginated: respondidas, totalCount: totalRespondidas,
  } = usePaginatedSearch(respondidasTodas, [], 5);

  return (
    <Box>
      <PageHeader
        title="Encuestas"
        subtitle="Cuéntanos cómo fue el servicio en tus inspecciones ya finalizadas"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Encuestas' }]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {exito && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setExito('')}>{exito}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : encuestas.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">
              Todavía no tienes encuestas. Aparecerán aquí apenas se finalice una inspección de alguno de tus ascensores.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {totalPendientes > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Pendientes ({totalPendientes})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {pendientes.map((e) => {
                  const borrador = borradores[e.id_encuesta] || {};
                  return (
                    <Card key={e.id_encuesta} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Ascensor {e.codigo_ascensor || '—'}
                          </Typography>
                          <Chip size="small" label="Pendiente" color="warning" variant="outlined" />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          ¿Qué tan satisfecho quedaste con el servicio?
                        </Typography>
                        <Rating
                          value={borrador.calificacion || 0}
                          onChange={(_, valor) => actualizarBorrador(e.id_encuesta, 'calificacion', valor)}
                          icon={<StarIcon fontSize="inherit" />}
                          size="large"
                        />

                        <TextField
                          label="Comentario (opcional)"
                          value={borrador.comentario || ''}
                          onChange={(ev) => actualizarBorrador(e.id_encuesta, 'comentario', ev.target.value)}
                          multiline
                          rows={2}
                          fullWidth
                          sx={{ mt: 2, mb: 2 }}
                        />

                        <Button
                          variant="contained"
                          onClick={() => handleEnviar(e)}
                          disabled={enviandoId === e.id_encuesta}
                        >
                          {enviandoId === e.id_encuesta ? 'Enviando...' : 'Enviar respuesta'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
              <ListPagination count={totalPendientes} page={paginaPendientes} onPageChange={setPaginaPendientes} rowsPerPage={5} />
            </Box>
          )}

          {totalRespondidas > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Respondidas ({totalRespondidas})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {respondidas.map((e) => (
                  <Card key={e.id_encuesta} variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Ascensor {e.codigo_ascensor || '—'}
                        </Typography>
                        <Rating value={e.calificacion || 0} readOnly icon={<StarIcon fontSize="inherit" />} />
                      </Box>
                      {e.comentario && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" color="text.secondary">"{e.comentario}"</Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
              <ListPagination count={totalRespondidas} page={paginaRespondidas} onPageChange={setPaginaRespondidas} rowsPerPage={5} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
