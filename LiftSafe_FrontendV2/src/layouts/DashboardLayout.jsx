import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Divider,
  useMediaQuery, useTheme, Badge, Snackbar, Alert,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ElevatorIcon from '@mui/icons-material/Elevator';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import RateReviewIcon from '@mui/icons-material/RateReview';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { getMenuForRole } from '../config/roles';
import { brand, gradients } from '../theme/colors';
import { notificacionService } from '../services/notificacionService';

const DRAWER_WIDTH = 248;
// ✅ FIX: intervalo de refresco de notificaciones (ver useEffect de abajo).
// Antes solo se cargaban una vez al iniciar sesión y nunca se volvían a
// pedir, así que si te asignaban algo mientras ya tenías la app abierta,
// la campanita nunca se enteraba hasta cerrar sesión y volver a entrar.
const NOTIFICACIONES_POLL_MS = 20000;
const ICONS = {
  dashboard: <DashboardIcon fontSize="small" />,
  inspecciones: <AssignmentIcon fontSize="small" />,
  solicitudes: <AssignmentIcon fontSize="small" />,
  ascensores: <ElevatorIcon fontSize="small" />,
  edificios: <BusinessIcon fontSize="small" />,
  reportes: <DescriptionIcon fontSize="small" />,
  usuarios: <PeopleIcon fontSize="small" />,
  configuracion: <SettingsIcon fontSize="small" />,
  encuestas: <RateReviewIcon fontSize="small" />,
};

// ✅ Pequeño "beep" de alarma generado con la Web Audio API -> no depende
// de ningún archivo de sonido externo. Si el navegador bloquea el audio
// (política de autoplay) simplemente no suena, sin romper nada.
function reproducirAlarma() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [0, 0.18].forEach((delay) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + 0.3);
    });
  } catch (e) {
    console.error('No se pudo reproducir la alarma de notificación:', e);
  }
}

function formatearFechaNotificacion(fecha) {
  if (!fecha) return '';
  try {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [toast, setToast] = useState({ open: false, message: '' });
  // Guarda el id más alto de notificación ya visto, para saber -en la
  // siguiente consulta periódica- cuáles son realmente nuevas y así no
  // disparar la alarma con las que ya existían al momento de iniciar sesión.
  const maxIdVistoRef = useRef(null);

  const menuItems = getMenuForRole(user?.role);

  // ✅ FIX: antes esto corría una sola vez al iniciar sesión (dependencia
  // [user]) y nunca más -> la campanita quedaba "congelada". Ahora, además
  // de la carga inicial, se vuelve a consultar cada NOTIFICACIONES_POLL_MS
  // mientras la sesión siga activa; si aparecen notificaciones con un id
  // mayor al último visto, se avisa con un aviso emergente + sonido.
  useEffect(() => {
    if (!user) return undefined;

    let activo = true;

    const cargar = async () => {
      try {
        const data = await notificacionService.listar();
        if (!activo) return;
        const lista = data || [];
        const idMaximoActual = lista.reduce((max, n) => Math.max(max, n.id_notificacion), 0);

        if (maxIdVistoRef.current === null) {
          // Primera carga de la sesión: solo establece la marca, sin alarma
          // (si no, sonaría por todo lo que ya tenías pendiente al entrar).
          maxIdVistoRef.current = idMaximoActual;
        } else {
          const nuevas = lista.filter((n) => n.id_notificacion > maxIdVistoRef.current);
          if (nuevas.length > 0) {
            maxIdVistoRef.current = idMaximoActual;
            setToast({
              open: true,
              message: nuevas.length === 1
                ? nuevas[0].mensaje
                : `Tienes ${nuevas.length} notificaciones nuevas`,
            });
            reproducirAlarma();
          }
        }
        setNotificaciones(lista);
      } catch (e) {
        console.error('Error cargando notificaciones:', e);
      }
    };

    cargar();
    const intervalId = setInterval(cargar, NOTIFICACIONES_POLL_MS);
    return () => {
      activo = false;
      clearInterval(intervalId);
    };
  }, [user]);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  // FIX: hacer clic en una notificación no llevaba a ningún lado -> ahora,
  // si la notificación trae un "enlace" (lo arma el backend según el tipo
  // de evento), se navega ahí y se cierra el menú desplegable.
  const handleClickNotificacion = async (n) => {
    if (!n.leida) {
      try {
        await notificacionService.marcarLeida(n.id_notificacion);
        setNotificaciones((prev) => prev.map((x) => (
          x.id_notificacion === n.id_notificacion ? { ...x, leida: true } : x
        )));
      } catch (e) {
        console.error('Error marcando notificación como leída:', e);
      }
    }
    setNotifAnchorEl(null);
    if (n.enlace) {
      navigate(n.enlace);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await notificacionService.marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((x) => ({ ...x, leida: true })));
    } catch (e) {
      console.error('Error marcando todas las notificaciones como leídas:', e);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: gradients.sidebar }}>
      <Box sx={{ py: 2, px: 2, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Logo width={115} sx={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
        <Typography variant="caption" sx={{ color: brand.silver, display: 'block', mt: 0.5, fontSize: 10,
          letterSpacing: '0.08em' }}>
          {user?.role?.toUpperCase()}
        </Typography>
      </Box>
      <List sx={{ flex: 1, px: 1.2, py: 1.5 }}>
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2, mb: 0.4, py: 1,
                color: active ? '#fff' : brand.silver,
                bgcolor: active ? 'rgba(0,102,204,0.18)' : 'transparent',
                borderLeft: active ? `3px solid ${brand.accent}` : '3px solid transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                '& .MuiListItemIcon-root': { color: active ? brand.accent : brand.silverDark },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>{ICONS[item.key]}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                slotProps={{ primary: { fontWeight: active ? 600 : 400, fontSize: 13 } }} 
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, px: 0.5 }}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: brand.accent, fontSize: 12 }}>{user?.name?.charAt(0)}</Avatar>
          <Typography variant="body2" fontWeight={600} noWrap fontSize={13} sx={{ color: '#fff' }}>{user?.name}</Typography>
        </Box>
        <ListItemButton onClick={() => { logout(); }} component={Link} to="/login" sx={{ borderRadius: 2, color: '#E87070', py: 0.5 }}>
          <ListItemIcon sx={{ minWidth: 30, color: '#E87070' }}><LogoutIcon sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Cerrar sesión" slotProps={{ primary: { fontSize: 12 } }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  // ✅ FIX: cada página ya muestra su propio título con PageHeader
  // (breadcrumb "Inicio / X" + encabezado "X" + subtítulo), así que este
  // título de la barra superior quedaba repetido arriba de todo (se veía
  // "Inspecciones" dos veces en la misma pantalla, en todos los roles).
  // Se quita para todas las páginas y todos los roles; la barra superior
  // se queda solo con la campanita y el avatar del usuario.

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: brand.surface }}>
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider', width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}>
        <Toolbar variant="dense" sx={{ minHeight: 52 }}>
          {isMobile && <IconButton edge="start" onClick={() => setMobileOpen(true)} size="small" sx={{ mr: 1 }}><MenuIcon /></IconButton>}
          <Box sx={{ flexGrow: 1 }} />
          
          {/* CAMPANITA DE NOTIFICACIONES */}
          {/* ✅ FIX: antes no tenía onClick -> no había forma de ver ni de
              marcar como leída ninguna notificación desde acá. */}
          <IconButton size="small" sx={{ mr: 1 }} onClick={(e) => setNotifAnchorEl(e.currentTarget)}>
            <Badge badgeContent={noLeidas} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notifAnchorEl}
            open={!!notifAnchorEl}
            onClose={() => setNotifAnchorEl(null)}
            slotProps={{ paper: { sx: { width: 360, maxHeight: 440 } } }}
          >
            <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" fontWeight={700}>Notificaciones</Typography>
              {noLeidas > 0 && (
                <Typography
                  variant="caption"
                  sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600 }}
                  onClick={handleMarcarTodasLeidas}
                >
                  Marcar todas como leídas
                </Typography>
              )}
            </Box>
            <Divider />
            {notificaciones.length === 0 && (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">No tienes notificaciones</Typography>
              </MenuItem>
            )}
            {notificaciones.slice(0, 15).map((n) => (
              <MenuItem
                key={n.id_notificacion}
                onClick={() => handleClickNotificacion(n)}
                sx={{
                  whiteSpace: 'normal',
                  alignItems: 'flex-start',
                  py: 1,
                  borderLeft: n.leida ? '3px solid transparent' : `3px solid ${brand.accent}`,
                  bgcolor: n.leida ? 'transparent' : 'rgba(0,102,204,0.06)',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: n.leida ? 400 : 600 }}>
                    {n.mensaje}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatearFechaNotificacion(n.fecha_creacion)}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>

          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 30, height: 30, bgcolor: brand.accent, fontSize: 12 }}>{user?.name?.charAt(0)}</Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled><Typography variant="body2" fontWeight={600}>{user?.name}</Typography></MenuItem>
            <MenuItem disabled><Typography variant="caption" color="text.secondary">{user?.role}</Typography></MenuItem>
            <Divider />
            <MenuItem onClick={() => { logout(); }} component={Link} to="/login">Cerrar sesión</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }}>{drawer}</Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }} open>{drawer}</Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, mt: '52px', height: 'calc(100vh - 52px)', overflowY: 'auto', p: { xs: 2, md: 2.5 }, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Outlet />
      </Box>

      {/* ✅ Aviso emergente + alarma cuando llega una notificación nueva
          mientras la sesión ya está abierta (ver useEffect de arriba). */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity="info"
          variant="filled"
          icon={<NotificationsActiveIcon />}
          onClose={() => setToast({ open: false, message: '' })}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
