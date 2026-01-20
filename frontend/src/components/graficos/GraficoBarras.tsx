import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GraficoBarrasProps {
  data: Array<{
    participanteNome: string;
    totalPagou: number;
    totalDeve: number;
    saldo: number;
  }>;
  title?: string;
  height?: number;
  showSaldo?: boolean;
}

const GraficoBarras: React.FC<GraficoBarrasProps> = ({ data, title, height = 400, showSaldo = false }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Nenhum dado disponível para exibir
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = data.map(item => ({
    nome: item.participanteNome,
    'Total Pago': item.totalPagou,
    'Total Deve': item.totalDeve,
    Saldo: item.saldo,
  }));

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
          <BarChart
            data={chartData}
            margin={
              isMobile
                ? { top: 10, right: 10, left: 0, bottom: 80 }
                : { top: 20, right: 30, left: 20, bottom: 60 }
            }
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis
              dataKey="nome"
              angle={isMobile ? -60 : -45}
              textAnchor="end"
              height={isMobile ? 120 : 100}
              interval={0}
              style={{ fontSize: isMobile ? '10px' : '12px' }}
              tick={{ fill: 'rgba(255, 255, 255, 0.8)' }}
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
            />
            <Legend
              wrapperStyle={{ fontSize: isMobile ? '11px' : '12px', paddingTop: '10px' }}
            />
            <Bar dataKey="Total Pago" fill="#10b981" />
            <Bar dataKey="Total Deve" fill="#ef4444" />
            {showSaldo && <Bar dataKey="Saldo" fill="#6366f1" />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GraficoBarras;
