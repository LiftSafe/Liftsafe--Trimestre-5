import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Divider,
  useMediaQuery, useTheme,
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
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { getMenuForRole } from '../config/roles';
import { brand, gradients } from '../theme/colors';

const DRAWER_WIDTH = 248;
const ICONS = {
  dashboard: <DashboardIcon fontSize="small" />,
  inspecciones: <AssignmentIcon fontSize="small" />,
  ascensores: <ElevatorIcon fontSize="small" />,
  edificios: <BusinessIcon fontSize="small" />,
  reportes: <DescriptionIcon fontSize="small" />,
  usuarios: <PeopleIcon fontSize="small" />,
  configuracion: <SettingsIcon fontSize="small" />,
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const menuItems = getMenuForRole(user?.role);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: gradients.sidebar }}>
      <Box sx={{ py: 2, px: 2, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Logo width={115} sx={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
        {/* <Typography variant="caption" sx={{ color: brand.silver, display: 'block', mt: 0.5, fontSize: 10, 
          letterSpacing: '0.08em' }}>
          {user?.role?.toUpperCase()}
        </Typography> */}
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
          <ListItemText primary="Cerrar sesión" primaryTypographyProps={{ fontSize: 12 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  const currentTitle = menuItems.find((m) => m.path === location.pathname)?.text || 'LiftSafe';

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: brand.surface }}>
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider', width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}>
        <Toolbar variant="dense" sx={{ minHeight: 52 }}>
          {isMobile && <IconButton edge="start" onClick={() => setMobileOpen(true)} size="small" sx={{ mr: 1 }}><MenuIcon /></IconButton>}
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1, color: brand.navy }}>{currentTitle}</Typography>
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
    </Box>
  );
}
