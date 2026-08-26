import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { brand } from '../theme/colors';

export default function StatCard({ title, value, subtitle, icon, accent = brand.accent, trend, trendLabel }) {
  const isPositive = trend === undefined || trend >= 0;

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(145deg, #fff 60%, ${accent}0A 100%)`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 28px rgba(11,25,41,0.09)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${accent}16`,
              color: accent,
              '& .MuiSvgIcon-root': { fontSize: 24 },
            }}
          >
            {icon}
          </Box>
          {trend !== undefined && (
            <Chip
              size="small"
              icon={isPositive
                ? <TrendingUpIcon sx={{ fontSize: '14px !important' }} />
                : <TrendingDownIcon sx={{ fontSize: '14px !important' }} />}
              label={`${isPositive ? '+' : ''}${trend}%`}
              sx={{
                bgcolor: isPositive ? '#0E7C4A14' : '#C0392B14',
                color: isPositive ? '#0E7C4A' : '#C0392B',
                fontWeight: 700,
                fontSize: 11,
                height: 24,
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ color: brand.navy, mt: 0.3, letterSpacing: '-0.03em', lineHeight: 1.1 }}
        >
          {value}
        </Typography>
        {(subtitle || trendLabel) && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
            {subtitle || trendLabel}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
