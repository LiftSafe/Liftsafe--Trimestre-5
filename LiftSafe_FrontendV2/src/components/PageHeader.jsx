import { Box, Typography } from '@mui/material';
import { brand } from '../theme/colors';

export default function PageHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="h5" fontWeight={800} sx={{ color: brand.navy, letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
