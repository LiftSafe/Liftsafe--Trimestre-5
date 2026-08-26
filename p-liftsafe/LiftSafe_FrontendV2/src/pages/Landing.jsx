import { Box, Button, Container, Typography, Card, CardContent, AppBar, Toolbar } from '@mui/material';
import { Link } from 'react-router-dom';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ElevatorOutlinedIcon from '@mui/icons-material/ElevatorOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import Logo from '../components/Logo';
import { brand, gradients } from '../theme/colors';

const modules = [
  { icon: <AssignmentOutlinedIcon sx={{ fontSize: 40 }} />, title: 'Gestión de Inspecciones', desc: 'Programa, ejecuta y da seguimiento a inspecciones periódicas, anuales y extraordinarias de ascensores.' },
  { icon: <ElevatorOutlinedIcon sx={{ fontSize: 40 }} />, title: 'Registro de Ascensores', desc: 'Inventario completo con marca, modelo, capacidad, historial y estado operativo de cada equipo.' },
  { icon: <VerifiedUserOutlinedIcon sx={{ fontSize: 40 }} />, title: 'Certificación', desc: 'Genera certificados e informes técnicos conforme a normativas de seguridad y cumplimiento.' },
  { icon: <SpeedOutlinedIcon sx={{ fontSize: 40 }} />, title: 'Dashboard en Tiempo Real', desc: 'Visualiza métricas, alertas de vencimiento y el estado general de tu flota de ascensores.' },
];

export default function Landing() {
  return (
    <Box>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Logo width={130} sx={{ mx: 0 }} />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button component={Link} to="/login" variant="outlined" color="primary">Iniciar sesión</Button>
            <Button component={Link} to="/register" variant="contained">Registrarse</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ background: gradients.primary, color: '#fff', py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Logo width={220} sx={{ mb: 3, filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.25))' }} />
          <Typography variant="h3" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.75rem' } }}>
            Seguridad y confianza en cada ascensor
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 400, lineHeight: 1.7 }}>
            LiftSafe es el sistema académico de inspección y certificación de ascensores.
            Gestiona edificios, ascensores, inspectores y reportes desde una sola plataforma.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button component={Link} to="/register" variant="contained" size="large" sx={{ bgcolor: '#fff', color: brand.blueDark, px: 4, '&:hover': { bgcolor: '#EAECEE' } }}>
              Comenzar ahora
            </Button>
            <Button component={Link} to="/login" variant="outlined" size="large" sx={{ borderColor: '#fff', color: '#fff', px: 4, '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              Acceder al sistema
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" color="primary.dark" gutterBottom>
          Módulos del sistema
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 5, maxWidth: 600, mx: 'auto' }}>
          Diseñado para inspectores, administradores de edificios y entidades de control
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
          {modules.map((m) => (
            <Card key={m.title} sx={{ transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(27,79,114,0.12)' } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>{m.icon}</Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>{m.title}</Typography>
                <Typography variant="body2" color="text.secondary">{m.desc}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      <Box sx={{ bgcolor: brand.grayLight, py: 6, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography variant="h5" fontWeight={700} color="primary.dark" gutterBottom>¿Listo para inspeccionar?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Crea tu cuenta y accede al panel de control LiftSafe</Typography>
          <Button component={Link} to="/register" variant="contained" size="large">Crear cuenta gratuita</Button>
        </Container>
      </Box>

      <Box sx={{ py: 3, textAlign: 'center', bgcolor: brand.blueDark, color: 'rgba(255,255,255,0.7)' }}>
        <Typography variant="body2">© 2026 LiftSafe — Proyecto Académico · Sistema de Inspecciones de Ascensores</Typography>
      </Box>
    </Box>
  );
}
