import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GraficoLinhaProps {
  data: Array<{ data: string; valor: number; quantidade?: number }>;
  title?: string;
  height?: number;
  showQuantidade?: boolean;
}

const GraficoLinha: React.FC<GraficoLinhaProps> = ({ data, title, height = 400, showQuantidade = false }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Nenhum dado disponível para exibir
      </div>
    );
  }

  // Formatar datas para exibição
  const chartData = data.map(item => {
    const [ano, mes, dia] = item.data.split('-');
    return {
      ...item,
      dataFormatada: `${dia}/${mes}`,
    };
  });

  const isMobile = window.innerWidth <= 768;
  const chartHeight = isMobile ? Math.min(height, 350) : height;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {title && (
        <h3 style={{ marginBottom: '20px', fontSize: isMobile ? '16px' : '18px', fontWeight: '600' }}>
          {title}
        </h3>
      )}
      <div style={{ minWidth: isMobile ? '600px' : '100%', width: '100%' }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart
            data={chartData}
            margin={
              isMobile
                ? { top: 10, right: 10, left: 0, bottom: 60 }
                : { top: 20, right: 30, left: 20, bottom: 20 }
            }
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis
              dataKey="dataFormatada"
              angle={isMobile ? -60 : -45}
              textAnchor="end"
              height={isMobile ? 100 : 80}
              style={{ fontSize: isMobile ? '10px' : '12px' }}
              tick={{ fill: 'rgba(255, 255, 255, 0.8)' }}
              interval={isMobile ? 'preserveStartEnd' : 0}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact',
                }).format(value)
              }
              style={{ fontSize: isMobile ? '10px' : '12px' }}
              tick={{ fill: 'rgba(255, 255, 255, 0.8)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '4px',
                fontSize: isMobile ? '12px' : '14px',
              }}
              formatter={(value: number) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(value)
              }
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: isMobile ? '11px' : '12px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={2} name="Valor Total" />
            {showQuantidade && (
              <Line
                type="monotone"
                dataKey="quantidade"
                stroke="#10b981"
                strokeWidth={2}
                name="Quantidade"
                yAxisId="right"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GraficoLinha;
