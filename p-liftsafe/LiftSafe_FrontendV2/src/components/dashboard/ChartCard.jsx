import { Box, Card, CardContent, Typography } from '@mui/material';

export default function ChartCard({ title, subtitle, action, children, minHeight = 260 }) {
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 3px rgba(11,25,41,0.04)',
      }}
    >
      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0B1929' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
        <Box sx={{ flex: 1, minHeight }}>{children}</Box>
      </CardContent>
    </Card>
  );
}
