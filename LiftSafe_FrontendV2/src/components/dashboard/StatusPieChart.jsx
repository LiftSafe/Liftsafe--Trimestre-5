import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatusPieChart = ({ data = [] }) => {
  const defaultData = [
    { name: 'Aprobadas', value: 0, color: '#0E7C4A' },
    { name: 'Pendientes', value: 0, color: '#C97B1A' },
    { name: 'Observaciones', value: 0, color: '#C0392B' }
  ];

  const chartData = data.length > 0 ? data : defaultData;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || '#8884D8'} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name) => [value, name]}
          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default StatusPieChart;