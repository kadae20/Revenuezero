'use client';

interface DataPoint {
  version: number;
  score: number;
  created_at: string;
}

interface ScoreHistoryChartProps {
  data: DataPoint[];
  height?: number;
}

export default function ScoreHistoryChart({ data, height = 120 }: ScoreHistoryChartProps) {
  if (!data || data.length === 0) return null;

  const scores = data.map((d) => d.score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const range = max - min || 1;
  const width = 280;

  const points = data
    .map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * (width - 20) + 10;
      const y = height - 20 - ((d.score - min) / range) * (height - 30);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ width: '100%', maxWidth: width }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <polyline
          points={points}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = (i / Math.max(data.length - 1, 1)) * (width - 20) + 10;
          const y = height - 20 - ((d.score - min) / range) * (height - 30);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#10b981"
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
        <span>v{data[0]?.version}</span>
        <span>v{data[data.length - 1]?.version}</span>
      </div>
    </div>
  );
}
