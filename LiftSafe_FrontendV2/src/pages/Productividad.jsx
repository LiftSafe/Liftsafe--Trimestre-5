import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VerifiedIcon from '@mui/icons-material/Verified';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DownloadIcon from '@mui/icons-material/Download';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { reporteService } from '../services/reporteService';
import { fechaHaceDias } from '../utils/productividad';
import { rutaProductividad } from '../utils/filtroProductividad';
import { Link as RouterLink } from 'react-router-dom';

// Número de la tabla que lleva a la lista de esas inspecciones (si es 0, solo se muestra)
function Cifra({ valor, to, etiqueta }) {
  if (!valor) return <>{valor}</>;
  return (
    <Typography component={RouterLink} to={to} variant="body2" aria-label={etiqueta}
      sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
      {valor}
    </Typography>
  );
}

const pct = (v) => (v === null || v === undefined ? '—' : `${v} %`);
const horas = (v) => (v === null || v === undefined ? '—' : `${v} h`);

// RF-024: desempeño de los inspectores en un periodo (Coordinador / Director Técnico)
export default function Productividad() {
  const [desde, setDesde] = useState(() => fechaHaceDias(30));
  const [hasta, setHasta] = useState(() => fechaHaceDias(0));
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    reporteService.productividad(desde, hasta)
      .then((d) => { if (vivo) { setDatos(d); setError(''); } })
      .catch((e) => { if (vivo) setError(e.message || 'No se pudo cargar el reporte'); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [desde, hasta]);

  const cambiar = (setter) => (e) => { setCargando(true); setter(e.target.value); };

  const [descargando, setDescargando] = useState(false);
  const descargar = async () => {
    setDescargando(true);
    try {
      const { blob, nombre } = await reporteService.productividadExcel(datos?.desde || desde, datos?.hasta || hasta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || 'No se pudo generar el Excel');
    } finally {
      setDescargando(false);
    }
  };

  const total = datos?.total;
  const ruta = (grupo, r) => rutaProductividad({ grupo, desde: datos?.desde, hasta: datos?.hasta, idInspector: r?.id_inspector, inspector: r?.inspector });
  return (
    <Box>
      <PageHeader
        title="Productividad"
        subtitle="Desempeño de los inspectores en el periodo"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Productividad' }]}
      />

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <TextField size="small" type="date" label="Desde" value={desde} onChange={cambiar(setDesde)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="date" label="Hasta" value={hasta} onChange={cambiar(setHasta)} InputLabelProps={{ shrink: true }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={descargar} disabled={!datos?.inspectores?.length || descargando}>
          {descargando ? 'Generando Excel…' : 'Descargar Excel'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {cargando && !datos ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : total && (
        <>
          {cargando && <LinearProgress sx={{ mb: 1 }} />}
          <Box sx={{ display: 'grid', gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
              <StatCard to={ruta('asignadas')} title="Inspecciones asignadas" value={total.asignadas} subtitle={`${total.en_curso} en curso`} icon={<AssignmentIcon />} />
              <StatCard to={ruta('terminadas')} title="Terminadas" value={total.terminadas} subtitle={`Cumplimiento ${pct(total.tasa_cumplimiento)}`} icon={<AssignmentTurnedInIcon />} accent="#1E8E5A" />
              <StatCard to={ruta('revisadas')} title="Tasa de aprobación" value={pct(total.tasa_aprobacion)} subtitle={`${total.aprobadas} aprobados · ${total.rechazadas} rechazados`} icon={<VerifiedIcon />} accent="#7B1FA2" />
              <StatCard to={ruta('terminadas')} title="Tiempo promedio" value={horas(total.horas_promedio)} subtitle="por inspección terminada" icon={<ScheduleIcon />} accent="#C77700" />
          </Box>

          <Card>
            <CardContent sx={{ p: 0 }}>
              <Typography fontWeight={700} sx={{ px: 2, pt: 2, pb: 1 }}>Por inspector</Typography>
              {!datos.inspectores.length ? (
                <Typography color="text.secondary" sx={{ px: 2, pb: 2 }}>No hay inspecciones en este periodo.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small" aria-label="Productividad por inspector">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap' } }}>
                        <TableCell>Inspector</TableCell>
                        <TableCell align="center">Asignadas</TableCell>
                        <TableCell align="center">Terminadas</TableCell>
                        <TableCell align="center">En curso</TableCell>
                        <TableCell align="center">Aprobadas</TableCell>
                        <TableCell align="center">Rechazadas</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>Cumplimiento</TableCell>
                        <TableCell align="center">Aprobación</TableCell>
                        <TableCell align="center">Tiempo prom.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {datos.inspectores.map((r) => (
                        <TableRow key={r.id_inspector} hover>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Typography component={RouterLink} to={ruta('asignadas', r)} variant="body2"
                              sx={{ color: 'inherit', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: 'primary.main' } }}>
                              {r.inspector}
                            </Typography>
                          </TableCell>
                          <TableCell align="center"><Cifra valor={r.asignadas} to={ruta('asignadas', r)} etiqueta={`Ver las ${r.asignadas} inspecciones asignadas a ${r.inspector}`} /></TableCell>
                          <TableCell align="center"><Cifra valor={r.terminadas} to={ruta('terminadas', r)} etiqueta={`Ver las ${r.terminadas} inspecciones terminadas de ${r.inspector}`} /></TableCell>
                          <TableCell align="center"><Cifra valor={r.en_curso} to={ruta('en_curso', r)} etiqueta={`Ver las ${r.en_curso} inspecciones en curso de ${r.inspector}`} /></TableCell>
                          <TableCell align="center"><Cifra valor={r.aprobadas} to={ruta('aprobadas', r)} etiqueta={`Ver los ${r.aprobadas} informes aprobados de ${r.inspector}`} /></TableCell>
                          <TableCell align="center"><Cifra valor={r.rechazadas} to={ruta('rechazadas', r)} etiqueta={`Ver los ${r.rechazadas} informes rechazados de ${r.inspector}`} /></TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={r.tasa_cumplimiento} sx={{ flex: 1, height: 6, borderRadius: 3 }} aria-label={`Cumplimiento de ${r.inspector}`} />
                              <Typography variant="caption" sx={{ minWidth: 34 }}>{pct(r.tasa_cumplimiento)}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">{pct(r.tasa_aprobacion)}</TableCell>
                          <TableCell align="center">{horas(r.horas_promedio)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
