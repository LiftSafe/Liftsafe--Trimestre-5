// src/components/dashboard/ActivityPanel.jsx

import { Box, Card, CardContent, Typography, Chip, Avatar } from '@mui/material'; // ← AGREGADO: Avatar
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

const TYPE_STYLES = {
  success: { icon: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />, color: '#0E7C4A', bg: '#0E7C4A12' },
  info: { icon: <InfoOutlinedIcon sx={{ fontSize: 18 }} />, color: '#0066CC', bg: '#0066CC12' },
  warning: { icon: <WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />, color: '#C97B1A', bg: '#C97B1A12' },
  error: { icon: <WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />, color: '#C0392B', bg: '#C0392B12' },
};

export default function ActivityPanel({ title, subtitle, items, action, accent = '#0066CC', showAvatars = false }) {
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          {action}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {items.map((item) => {
            const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;
            const itemIcon = item.icon || style.icon;
            return (
              <Box
                key={item.id || item.title}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  py: 1.25,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 0 },
                }}
              >
                {/* ✅ CORREGIDO: Avatar con import, o icono por defecto */}
                {showAvatars && item.avatar ? (
                  <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: item.avatarColor || style.color, color: '#fff' }}>
                    {item.avatar}
                  </Avatar>
                ) : (
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {itemIcon}
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>{item.action || item.title}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{item.detail || item.subtitle}</Typography>
                </Box>
                {item.chip && <Chip label={item.chip} size="small" color={item.chipColor || 'default'} />}
                {item.time && (
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {item.time}
                  </Typography>
                )}
                {item.actionBtn}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}