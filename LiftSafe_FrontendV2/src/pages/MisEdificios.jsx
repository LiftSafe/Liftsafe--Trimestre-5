import { useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PageHeader from '../components/PageHeader';
import AscensoresEdificio from '../components/AscensoresEdificio';
import { clienteService } from '../services/clienteService';

// El cliente ve los edificios que tiene asignados y los ascensores de cada uno.
export default function MisEdificios() {
  const [edificios, setEdificios] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    clienteService.misSedes()
      .then((lista) => setEdificios(lista || []))
      .catch((err) => { setEdificios([]); setError(err.message || 'No se pudieron cargar tus edificios'); });
  }, []);

  return (
    <Box>
      <PageHeader
        title="Mis edificios"
        subtitle="Los edificios que tienes registrados y sus ascensores"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Mis edificios' }]}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!edificios ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : !edificios.length ? (
        <Alert severity="info">Todavía no tienes edificios registrados. Tu asesor los registra junto con sus ascensores.</Alert>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr' }}>
          {edificios.map((e) => (
            <Card key={e.id_sede}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 1 }}>
                  <BusinessIcon color="primary" />
                  <Box>
                    <Typography fontWeight={700}>{e.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[e.direccion, e.ciudad].filter(Boolean).join(' · ') || 'Sin dirección registrada'}
                    </Typography>
                  </Box>
                </Box>
                <AscensoresEdificio sede={e} soloLectura enTarjeta />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
