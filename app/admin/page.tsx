'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminStats {
  totalSaaSAnalyzed: number;
  totalReports: number;
  avgScore: number;
  planDistribution: Record<string, number>;
  top5CommonKillers: Array<{ killer: string; count: number }>;
  reanalysisUsageRate: number;
  analytics: {
    analysis_started: number;
    checkout_clicked: number;
    checkout_completed: number;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (s: string) => {
    const res = await fetch(`/api/admin?secret=${encodeURIComponent(s)}`);
    if (!res.ok) {
      if (res.status === 401) setError('Invalid admin secret');
      else setError('Failed to load');
      return;
    }
    const data = await res.json();
    setStats(data);
    setAuthenticated(true);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret.trim()) fetchStats(secret.trim());
  };

  if (!authenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
        <h1 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Admin Access</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button
            type="submit"
            style={{ padding: '0.75rem 1.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Enter
          </button>
        </form>
        {error && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
          Set ADMIN_SECRET in environment to protect this page.
        </p>
      </div>
    );
  }

  if (!stats) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: 'bold' }}>Admin Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalSaaSAnalyzed}</div>
          <div style={{ color: '#666' }}>Total SaaS Analyzed</div>
        </div>
        <div style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.avgScore}</div>
          <div style={{ color: '#666' }}>Average Score</div>
        </div>
        <div style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalReports}</div>
          <div style={{ color: '#666' }}>Total Reports</div>
        </div>
        <div style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.reanalysisUsageRate}%</div>
          <div style={{ color: '#666' }}>Reanalysis Rate</div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 'bold' }}>Plan Distribution</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {Object.entries(stats.planDistribution).map(([plan, count]) => (
            <span key={plan} style={{ padding: '0.5rem 1rem', background: '#e5e5e5', borderRadius: '4px' }}>
              {plan}: {count}
            </span>
          ))}
          {Object.keys(stats.planDistribution).length === 0 && (
            <span style={{ color: '#666' }}>No active subscriptions</span>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 'bold' }}>Top 5 Common Killers</h2>
        <ol style={{ paddingLeft: '1.5rem' }}>
          {stats.top5CommonKillers.map(({ killer, count }, i) => (
            <li key={i} style={{ marginBottom: '0.5rem' }}>
              {killer} ({count})
            </li>
          ))}
          {stats.top5CommonKillers.length === 0 && <li style={{ color: '#666' }}>No data yet</li>}
        </ol>
      </div>

      <div>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 'bold' }}>Analytics</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '0.5rem 1rem', background: '#dbeafe', borderRadius: '4px' }}>
            analysis_started: {stats.analytics.analysis_started}
          </span>
          <span style={{ padding: '0.5rem 1rem', background: '#fef3c7', borderRadius: '4px' }}>
            checkout_clicked: {stats.analytics.checkout_clicked}
          </span>
          <span style={{ padding: '0.5rem 1rem', background: '#d1fae5', borderRadius: '4px' }}>
            checkout_completed: {stats.analytics.checkout_completed}
          </span>
        </div>
      </div>

      <button
        onClick={() => router.push('/')}
        style={{ marginTop: '2rem', padding: '0.5rem 1rem', background: '#666', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Back to Home
      </button>
    </div>
  );
}
