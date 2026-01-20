import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GraficoMultiplasLinhasProps {
  data: Array<{
    data: string;
    participantes: Array<{
      participanteId: number;
      participanteNome: string;
      saldo: number;
    }>;
  }>;
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

const GraficoMultiplasLinhas: React.FC<GraficoMultiplasLinhasProps> = ({ data, title, height = 400 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Nenhum dado disponível para exibir
      </div>
    );
  }

  // Extrair todos os participantes únicos
  const participantesSet = new Set<string>();
  data.forEach(item => {
    item.participantes.forEach(p => {
      participantesSet.add(p.participanteNome);
    });
  });

  const participantes = Array.from(participantesSet);

  // Transformar dados para formato do gráfico
  const chartData = data.map(item => {
    const [ano, mes, dia] = item.data.split('-');
    const obj: any = {
      data: `${dia}/${mes}`,
    };
    item.participantes.forEach(p => {
      obj[p.participanteNome] = p.saldo;
    });
    return obj;
  });

  const isMobile = window.innerWidth <= 768;
  const chartHeight = isMobile ? Math.min(height, 400) : height;
  // Limitar número de participantes exibidos na legenda em mobile
  const participantesExibidos = isMobile && participantes.length > 5
    ? participantes.slice(0, 5)
    : participantes;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {title && (
        <h3 style={{ marginBottom: '20px', fontSize: isMobile ? '16px' : '18px', fontWeight: '600' }}>
          {title}
        </h3>
      )}
      {isMobile && participantes.length > 5 && (
        <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '10px' }}>
          Mostrando apenas os 5 primeiros participantes. Use o tooltip para ver todos.
        </p>
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
              dataKey="data"
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
            />
            <Legend
              wrapperStyle={{ fontSize: isMobile ? '10px' : '12px', paddingTop: '10px' }}
            />
            {participantesExibidos.map((nome, index) => (
              <Line
                key={nome}
                type="monotone"
                dataKey={nome}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={isMobile ? 1.5 : 2}
                dot={{ r: isMobile ? 2 : 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GraficoMultiplasLinhas;
