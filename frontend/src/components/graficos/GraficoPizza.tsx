import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface GraficoPizzaProps {
  data: Array<{ label: string; value: number; percentage: number }>;
  title?: string;
  height?: number;
}

const COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#a855f7',
];

const GraficoPizza: React.FC<GraficoPizzaProps> = ({ data, title, height = 400 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Nenhum dado disponível para exibir
      </div>
    );
  }

  const isMobile = window.innerWidth <= 768;
  const chartHeight = isMobile ? Math.min(height, 350) : height;
  const outerRadius = isMobile ? 60 : 80;
  const labelFontSize = isMobile ? '10px' : '12px';

  return (
    <div>
      {title && (
        <h3 style={{ marginBottom: '20px', fontSize: isMobile ? '16px' : '18px', fontWeight: '600' }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy={isMobile ? '45%' : '50%'}
            labelLine={false}
            label={({ label, percentage }) => {
              const text = `${label}: ${percentage.toFixed(1)}%`;
              // Em mobile, só mostrar labels se houver espaço suficiente
              if (isMobile && data.length > 5) {
                return percentage > 5 ? text : ''; // Só mostrar labels > 5%
              }
              return text;
            }}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '4px',
              fontSize: isMobile ? '12px' : '14px',
            }}
            formatter={(value: number, name: string, props: any) => [
              new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(value),
              props.payload.label || 'Total',
            ]}
            labelFormatter={(label) => ''}
          />
          <Legend
            wrapperStyle={{ fontSize: isMobile ? '11px' : '12px', paddingTop: '10px' }}
            iconSize={isMobile ? 10 : 12}
            formatter={(value, entry: any) => entry.payload?.label || value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraficoPizza;
