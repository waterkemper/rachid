import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GraficoBarrasHorizontaisProps {
  data: Array<{ descricao: string; valor: number }>;
  title?: string;
  height?: number;
  maxLength?: number; // Comprimento máximo do texto no eixo Y
}

const GraficoBarrasHorizontais: React.FC<GraficoBarrasHorizontaisProps> = ({
  data,
  title,
  height = 400,
  maxLength = 30,
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Nenhum dado disponível para exibir
      </div>
    );
  }

  // Truncar descrições muito longas
  const chartData = data.map(item => ({
    ...item,
    descricaoTruncada:
      item.descricao.length > maxLength
        ? `${item.descricao.substring(0, maxLength)}...`
        : item.descricao,
  }));

  const isMobile = window.innerWidth <= 768;
  const chartHeight = isMobile ? Math.min(height, 400) : height;
  
  // Calcular largura necessária baseada no texto mais longo (truncado ou não)
  const truncateLength = isMobile ? Math.max(10, maxLength - 12) : maxLength;
  
  // Encontrar a descrição mais longa (já truncada)
  const descricoesTruncadas = data.map(item => 
    item.descricao.length > truncateLength
      ? `${item.descricao.substring(0, truncateLength)}...`
      : item.descricao
  );
  const descricaoMaisLonga = descricoesTruncadas.reduce((a, b) => a.length > b.length ? a : b, '');
  
  // Calcular largura do eixo Y - suficiente para "Aluguel do Salão" (17 caracteres) em uma linha
  // Não truncar labels, mas garantir que "Aluguel do Salão" caiba sem quebrar
  const longestLabel = data.reduce((a, b) => a.descricao.length > b.descricao.length ? a : b, data[0]);
  const estimatedWidth = longestLabel.descricao.length * 6 + 30;
  const yAxisWidth = Math.max(
    estimatedWidth,
    isMobile ? 100 : 120
  );

  // Usar descrição completa nos labels (não truncar)
  const chartDataAdjusted = data.map(item => ({
    ...item,
    descricaoTruncada: item.descricao, // Usar descrição completa
  }));

  return (
    <div style={{ width: '100%', margin: 0, padding: 0 }}>
      {title && (
        <h3 style={{ marginBottom: '16px', fontSize: isMobile ? '16px' : '18px', fontWeight: '600' }}>
          {title}
        </h3>
      )}
      <div 
        style={{ 
          width: '100%', 
          padding: 0, 
          margin: 0,
          minWidth: 0,
          position: 'relative'
        }}
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartDataAdjusted}
          layout="vertical"
          margin={
            isMobile
              ? { top: 10, right: 10, left: 12, bottom: 10 }
              : { top: 20, right: 30, left: 12, bottom: 20 }
          }
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis
            type="number"
            domain={[0, (dataMax: number) => {
              // Calcular domínio que maximize o uso do espaço horizontal
              const maxValue = Math.ceil(dataMax * 1.2);
              return maxValue;
            }]}
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
          <YAxis
            type="category"
            dataKey="descricaoTruncada"
            width={yAxisWidth}
            style={{ fontSize: isMobile ? '10px' : '12px' }}
            tick={{ fill: 'rgba(255, 255, 255, 0.8)', textAnchor: 'start' }}
            tickMargin={5}
            interval={0}
            axisLine={false}
            tickLine={false}
            dx={-yAxisWidth + 12 + 10}
          />
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
              props.payload.descricao, // Mostrar descrição completa no tooltip
            ]}
          />
          <Bar dataKey="valor" fill="#6366f1" />
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GraficoBarrasHorizontais;
