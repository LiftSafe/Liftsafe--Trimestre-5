// src/pages/Buildings.jsx

import { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ElevatorOutlinedIcon from '@mui/icons-material/ElevatorOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { brand } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { fetchEdificios } from '../services/dashboardService';

// ============ MAPEO DE IMÁGENES ============
const IMAGENES_POR_EDIFICIO = {
  'Calle 123 #45-67':       '/comprobantes/edificio1.jpg',
  'Calle 120 #15-88':       '/comprobantes/edificio2.jpg',
  'Carrera 11 #93-40':      '/comprobantes/edificio3.jpg',
  'Calle 85 #13-22':        '/comprobantes/edificio4.jpg',
  'Carrera 9 #150-60':      '/comprobantes/edificio5.jpg',
  'Calle 170 #8-40':        '/comprobantes/edificio6.jpg',
  'Carrera 14 #60-55':      '/comprobantes/edificio7.jpg',
  'Calle 110 #20-30':       '/comprobantes/edificio8.jpg',
  'Carrera 70 #45-20':      '/comprobantes/edificio9.jpg',
  'Calle 50 #30-45':        '/comprobantes/edificio10.jpg',
  'Carrera 80 #25-90':      '/comprobantes/edificio11.jpg',
  'Carrera 9 #150-60, Bogotá': '/comprobantes/edificio12.jpg',
};

const IMAGEN_DEFAULT = '/comprobantes/default.jpg';

function getImagenUrl(building) {
  const nombre = building?.name || building?.address || '';
  const match = Object.keys(IMAGENES_POR_EDIFICIO).find(
    key => key.toLowerCase().trim() === nombre.toLowerCase().trim()
  );
  return match ? IMAGENES_POR_EDIFICIO[match] : IMAGEN_DEFAULT;
}

export default function Buildings() {
  const { hasAction } = useAuth();
  const { data: buildings, loading, error } = useDashboardData(fetchEdificios);
  const edificios = buildings || [];
  
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    edificios,
    ['name', 'address', 'manager', 'phone', 'status']
  );

  // ✅ ESTADO PARA MODAL DE DETALLE (reemplaza comprobante)
  const [detailBuilding, setDetailBuilding] = useState(null);

  const handleOpenDetail = (building) => {
    setDetailBuilding(building);
  };

  const handleCloseDetail = () => {
    setDetailBuilding(null);
  };

  const imagenUrl = useMemo(() => {
    return detailBuilding ? getImagenUrl(detailBuilding) : '';
  }, [detailBuilding]);

  return (
    <Box>
      <PageHeader
        title="Edificios"
        subtitle="Edificios registrados en el sistema"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Edificios' }]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar edificio..." />
        {hasAction('createBuilding') && (
          <Button variant="contained" startIcon={<AddIcon />}>Agregar edificio</Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {paginated.length > 0 ? (
              paginated.map((b) => {
                const imgUrl = getImagenUrl(b);
                return (
                  <Card 
                    key={b.id || b.name} 
                    sx={{ 
                      '&:hover': { borderColor: brand.accent },
                      overflow: 'hidden',
                    }}
                  >
                    {/* Miniatura del edificio */}
                    <Box
                      component="img"
                      src={imgUrl}
                      alt={`Edificio ${b.name}`}
                      sx={{
                        width: '100%',
                        height: 160,
                        objectFit: 'cover',
                        display: 'block',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                    
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {b.name || 'Sin nombre'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOnOutlinedIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {b.address || 'Sin dirección'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <ElevatorOutlinedIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {b.elevators || 0} ascensores
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <PhoneOutlinedIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {b.manager || 'Sin gestor'} — {b.phone || 'Sin teléfono'}
                        </Typography>
                      </Box>

                      {/* ✅ SOLO UN BOTÓN: Ver detalle */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          fullWidth
                          onClick={() => handleOpenDetail(b)}
                        >
                          Ver detalle
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Typography color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
                No hay edificios registrados
              </Typography>
            )}
          </Box>
          <ListPagination count={totalCount} page={page} onPageChange={setPage} />
        </>
      )}

      {/* ============ MODAL DE DETALLE DEL EDIFICIO (reemplaza comprobante) ============ */}
      <Dialog
        open={!!detailBuilding}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {detailBuilding?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Información completa del edificio
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDetail} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {/* Imagen grande del edificio */}
          <Box
            component="img"
            src={imagenUrl}
            alt={`Edificio ${detailBuilding?.name}`}
            sx={{
              width: '100%',
              height: 280,
              objectFit: 'cover',
              borderRadius: 2,
              display: 'block',
              mb: 2,
            }}
          />

          {/* Información detallada en grid */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
            gap: 2,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 2
          }}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                NOMBRE DEL EDIFICIO
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {detailBuilding?.name || '—'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                DIRECCIÓN COMPLETA
              </Typography>
              <Typography variant="body1">
                {detailBuilding?.address || '—'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                UBICACIÓN / CIUDAD
              </Typography>
              <Typography variant="body1">
                {detailBuilding?.location || '—'}, {detailBuilding?.city || '—'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                ESTADO
              </Typography>
              <Typography variant="body1">
                {detailBuilding?.status || 'Activo'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                GESTOR / ADMINISTRADOR
              </Typography>
              <Typography variant="body1">
                {detailBuilding?.manager || '—'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                TELÉFONO DE CONTACTO
              </Typography>
              <Typography variant="body1">
                {detailBuilding?.phone || '—'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                NÚMERO DE ASCENSORES
              </Typography>
              <Typography variant="body1">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ElevatorOutlinedIcon fontSize="small" color="primary" />
                  {detailBuilding?.elevators || 0} ascensores registrados
                </Box>
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                ID EN SISTEMA
              </Typography>
              <Typography variant="body1" fontFamily="monospace" color="text.secondary">
                #{detailBuilding?.id || '—'}
              </Typography>
            </Box>
          </Box>

          {/* Sección adicional: Acciones rápidas */}
          <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Acciones rápidas
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" startIcon={<ElevatorOutlinedIcon />}>
                Ver ascensores
              </Button>
              <Button size="small" variant="outlined" color="primary">
                Ver inspecciones
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseDetail} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}