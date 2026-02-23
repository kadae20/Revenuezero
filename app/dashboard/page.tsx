'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import ScoreHistoryChart from '@/components/ScoreHistoryChart';

interface ProjectWithScores {
  id: string;
  name: string;
  slug: string | null;
  website_url: string | null;
  niche: string | null;
  is_public: boolean;
  currentScore: number | null;
  scoreHistory: Array<{ version: number; score: number; created_at: string }>;
}

interface SubscriptionInfo {
  plan: string;
  analysesUsedThisMonth: number;
  billingCycleEnd: string | null;
  limits: { analysesPerMonth: number; maxProjects: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithScores[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const togglePublic = useCallback(async (projectId: string, current: boolean) => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setTogglingId(projectId);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ is_public: !current }),
    });
    setTogglingId(null);
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, is_public: !current } : p))
      );
    }
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/analyze');
        return;
      }

      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        router.replace('/analyze');
        return;
      }
      const json = await res.json();
      setProjects(json.projects ?? []);
      setSubscription(json.subscription);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        Loading dashboard...
      </div>
    );
  }

  const cycleEnd = subscription?.billingCycleEnd
    ? new Date(subscription.billingCycleEnd).toLocaleDateString()
    : '—';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
        Project Dashboard
      </h1>

      {/* Monthly usage indicator */}
      {subscription && (
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong>Plan:</strong> {subscription.plan}
            </div>
            <div>
              <strong>Analyses this month:</strong>{' '}
              {subscription.limits.analysesPerMonth < 0
                ? `${subscription.analysesUsedThisMonth} (unlimited)`
                : `${subscription.analysesUsedThisMonth} / ${subscription.limits.analysesPerMonth}`}
            </div>
            <div>
              <strong>Resets:</strong> {cycleEnd}
            </div>
          </div>
        </div>
      )}

      <Link
        href="/analyze"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: '#000',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          marginBottom: '2rem',
        }}
      >
        Run New Analysis
      </Link>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {projects.map((p) => (
          <div
            key={p.id}
            style={{
              padding: '1.5rem',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {p.name}
                </h2>
                {p.niche && (
                  <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>{p.niche}</p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {p.currentScore != null ? `${p.currentScore}/100` : '—'}
                </div>
                <Link href={`/report?projectId=${p.id}`} style={{ fontSize: '0.9rem', color: '#2563eb', display: 'block' }}>
                  View Report
                </Link>
                {p.slug && (
                  <button
                    onClick={() => togglePublic(p.id, p.is_public)}
                    disabled={!!togglingId}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      background: p.is_public ? '#d1fae5' : '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: togglingId ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {p.is_public ? 'Public' : 'Make public'}
                  </button>
                )}
              </div>
            </div>

            {p.scoreHistory && p.scoreHistory.length > 1 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: '#6b7280' }}>
                  Score trend
                </div>
                <ScoreHistoryChart data={p.scoreHistory} />
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <Link
                href={`/analyze?projectId=${p.id}&reanalyze=true`}
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  color: '#374151',
                }}
              >
                Re-analyze
              </Link>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <p style={{ color: '#6b7280', marginTop: '2rem' }}>
          No projects yet. <Link href="/analyze" style={{ color: '#2563eb' }}>Run your first analysis</Link>.
        </p>
      )}
    </div>
  );
}
