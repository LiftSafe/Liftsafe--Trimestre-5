import { Box, Typography, useTheme } from '@mui/material';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';


function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: '#fff', p: 1.2, borderRadius: 2, border: '1px solid #E2E8F0', boxShadow: 2 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>{label}</Typography>
      {payload.map((entry) => (
        <Typography key={entry.name} variant="caption" sx={{ color: entry.color, display: 'block' }}>
          {entry.name}: <strong>{entry.value}</strong>
        </Typography>
      ))}
    </Box>
  );
}

export function InspectionTrendChart({ data, height = 240 }) {
  const theme = useTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0066CC" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#0066CC" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradAprobadas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0E7C4A" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#0E7C4A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Area type="monotone" dataKey="total" name="Total" stroke="#0066CC" strokeWidth={2.5} fill="url(#gradTotal)" />
        <Area type="monotone" dataKey="aprobadas" name="Aprobadas" stroke="#0E7C4A" strokeWidth={2} fill="url(#gradAprobadas)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusDonutChart({ data, height = 240, centerLabel, centerValue }) {
  return (
    <Box sx={{ position: 'relative', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <Box sx={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#0B1929', lineHeight: 1 }}>{centerValue}</Typography>
          <Typography variant="caption" color="text.secondary">{centerLabel}</Typography>
        </Box>
      )}
    </Box>
  );
}

export function BuildingBarChart({ data, height = 240 }) {
  const theme = useTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="building" width={100} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,102,204,0.06)' }} />
        <Bar dataKey="inspecciones" name="Inspecciones" fill="#0066CC" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeeklyActivityChart({ data, height = 200 }) {
  const theme = useTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="programadas" name="Programadas" fill="#C5CDD5" radius={[4, 4, 0, 0]} barSize={14} />
        <Bar dataKey="completadas" name="Completadas" fill="#0E7C4A" radius={[4, 4, 0, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ComplianceLineChart({ data, height = 200 }) {
  const theme = useTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradCompliance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C5CBF" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#7C5CBF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <YAxis domain={[85, 100]} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="cumplimiento" name="Cumplimiento" stroke="#7C5CBF" strokeWidth={2.5} fill="url(#gradCompliance)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SalesPipelineChart({ data, height = 220 }) {
  const colors = ['#0066CC', '#3399FF', '#0E7C4A', '#7C5CBF'];
  const theme = useTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
        <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,102,204,0.06)' }} />
        <Bar dataKey="cantidad" name="Clientes" radius={[6, 6, 0, 0]} barSize={36}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
