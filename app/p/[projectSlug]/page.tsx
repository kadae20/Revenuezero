'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface PublicProject {
  id: string;
  name: string;
  slug: string;
  niche: string | null;
  is_public: boolean;
}

interface ReportSummary {
  score: number;
  version: number;
  created_at: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const projectSlug = (params?.projectSlug as string) || '';
  const [project, setProject] = useState<PublicProject | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public-profile?slug=${encodeURIComponent(projectSlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.project) {
          setProject(data.project);
          setScoreHistory(data.scoreHistory ?? []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectSlug]);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!project) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p>Profile not found.</p>
        <Link href="/" style={{ color: '#2563eb', marginTop: '1rem', display: 'inline-block' }}>
          Go home
        </Link>
      </div>
    );
  }

  const latest = scoreHistory[scoreHistory.length - 1];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
      <div
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          background: '#d1fae5',
          color: '#065f46',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
        }}
      >
        Public
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{project.name}</h1>
      {project.niche && (
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{project.niche}</p>
      )}

      {latest && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {latest.score}/100
          </div>
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            Latest analysis (v{latest.version}) — {new Date(latest.created_at).toLocaleDateString()}
          </p>
        </div>
      )}

      {scoreHistory.length > 1 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 'bold' }}>Score history</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {scoreHistory.map((r, i) => (
              <span
                key={i}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                }}
              >
                v{r.version}: {r.score}
              </span>
            ))}
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
        }}
      >
        Get your own analysis
      </Link>
    </div>
  );
}
