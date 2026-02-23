'use client';

import { useEffect, useState } from 'react';

interface LiveStatsData {
  totalAnalyzed: number;
  avgScore: number;
  mostCommonIssue: string;
  recentSnapshots: Array<{
    summary_text: string;
    niche?: string;
    before_score?: number;
    after_score?: number;
    improvement_area?: string;
  }>;
}

export default function LiveStats() {
  const [data, setData] = useState<LiveStatsData | null>(null);

  useEffect(() => {
    fetch('/api/insights')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data || data.totalAnalyzed === 0) return null;

  return (
    <section style={{ padding: '3rem 2rem', background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>
          Live Platform Stats
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div style={{ textAlign: 'center', padding: '1rem', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{data.totalAnalyzed}</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>SaaS Analyzed</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
              {Math.round(data.avgScore)}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Average Score</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#166534' }}>Most common issue</div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>{data.mostCommonIssue}</div>
          </div>
        </div>
        {data.recentSnapshots.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 'bold' }}>Recent improvements</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {data.recentSnapshots.slice(0, 3).map((s, i) => (
                <li
                  key={i}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#fff',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    fontSize: '0.95rem',
                    color: '#374151',
                  }}
                >
                  {s.summary_text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
