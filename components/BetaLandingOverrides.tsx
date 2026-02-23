'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BetaLandingOverrides() {
  const [betaMode, setBetaMode] = useState(false);

  useEffect(() => {
    fetch('/api/feature-flags')
      .then((r) => r.json())
      .then((f) => setBetaMode(!!f.BETA_MODE))
      .catch(() => {});
  }, []);

  if (!betaMode) return null;

  return (
    <>
      {/* Part 6: Beta banner */}
      <div
        style={{
          padding: '0.75rem 1.5rem',
          background: '#f0fdf4',
          borderBottom: '2px solid #10b981',
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        Open Beta — Free access while we build the Revenue Intelligence OS.
      </div>
    </>
  );
}

export function BetaCTA({ children }: { children: React.ReactNode }) {
  const [betaMode, setBetaMode] = useState(false);

  useEffect(() => {
    fetch('/api/feature-flags')
      .then((r) => r.json())
      .then((f) => setBetaMode(!!f.BETA_MODE))
      .catch(() => {});
  }, []);

  if (betaMode) {
    return (
      <Link
        href="/analyze"
        style={{
          display: 'inline-block',
          padding: '1rem 2rem',
          background: '#10b981',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
        }}
      >
        Analyze My SaaS (Free Beta)
      </Link>
    );
  }
  return <>{children}</>;
}

export function BetaTrustLine() {
  const [betaMode, setBetaMode] = useState(false);
  useEffect(() => {
    fetch('/api/feature-flags')
      .then((r) => r.json())
      .then((f) => setBetaMode(!!f.BETA_MODE))
      .catch(() => {});
  }, []);

  if (!betaMode) return null;
  return (
    <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
      No spam. Early access updates only.
    </p>
  );
}

export function BetaHideWhenActive({ children }: { children: React.ReactNode }) {
  const [betaMode, setBetaMode] = useState(false);
  useEffect(() => {
    fetch('/api/feature-flags')
      .then((r) => r.json())
      .then((f) => setBetaMode(!!f.BETA_MODE))
      .catch(() => {});
  }, []);

  if (betaMode) return null;
  return <>{children}</>;
}
