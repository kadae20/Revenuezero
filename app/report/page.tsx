'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RevenueReport, ScoreComparison } from '@/types';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [comparison, setComparison] = useState<ScoreComparison | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [betaEmailGate, setBetaEmailGate] = useState(false);
  const [betaForm, setBetaForm] = useState({ email: '', projectName: '', websiteUrl: '', niche: '' });
  const [betaSubmitLoading, setBetaSubmitLoading] = useState(false);
  const [betaMode, setBetaMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const trackEvent = useCallback(
    (eventName: string, metadata?: Record<string, unknown>) => {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName,
          project_id: sessionStorage.getItem('projectId') || undefined,
          metadata,
        }),
      }).catch(() => {});
    },
    []
  );

  useEffect(() => {
    trackEvent('preview_viewed');

    fetch('/api/feature-flags')
      .then((r) => r.json())
      .then((f) => setBetaMode(!!f.BETA_MODE))
      .catch(() => {});

    const loadFromSession = () => {
      const reportData = sessionStorage.getItem('report');
      const accessData = sessionStorage.getItem('hasAccess');
      const comparisonData = sessionStorage.getItem('comparison');
      const versionData = sessionStorage.getItem('version');
      const projectIdData = sessionStorage.getItem('projectId');
      const reportIdData = sessionStorage.getItem('reportId');
      const betaGate = sessionStorage.getItem('betaEmailGate') === 'true';
      if (reportData) {
        const parsed = JSON.parse(reportData);
        setReport(parsed);
        setHasAccess(accessData === 'true');
        if (comparisonData) setComparison(JSON.parse(comparisonData));
        if (versionData) setVersion(parseInt(versionData));
        if (projectIdData) setProjectId(projectIdData);
        if (reportIdData) setReportId(reportIdData);
        setBetaEmailGate(betaGate);
        if (betaGate) {
          setBetaForm({
            email: '',
            projectName: sessionStorage.getItem('betaProjectName') || parsed?.input?.product_name || '',
            websiteUrl: sessionStorage.getItem('betaWebsiteUrl') || parsed?.input?.website_url || '',
            niche: sessionStorage.getItem('betaNiche') || parsed?.input?.target_user_guess || '',
          });
        }
        setLoading(false);
        return true;
      }
      return false;
    };

    if (loadFromSession()) return;

    if (projectIdFromUrl) {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          setLoading(false);
          return;
        }
        fetch(`/api/report?projectId=${projectIdFromUrl}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            if (data?.report) {
              setReport(data.report);
              setHasAccess(!!data.hasAccess);
              setVersion(data.version ?? null);
              setProjectId(data.projectId ?? projectIdFromUrl);
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
    } else {
      setLoading(false);
    }
  }, [trackEvent, projectIdFromUrl]);

  const handleBetaUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!betaForm.email.trim() || !betaForm.projectName.trim() || !reportId) return;
    setBetaSubmitLoading(true);
    try {
      const res = await fetch('/api/beta-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: betaForm.email.trim(),
          project_name: betaForm.projectName.trim(),
          website_url: betaForm.websiteUrl || undefined,
          niche: betaForm.niche || undefined,
          report_id: reportId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const data = await res.json();
      setReport(data.report);
      setHasAccess(true);
      sessionStorage.setItem('report', JSON.stringify(data.report));
      sessionStorage.setItem('hasAccess', 'true');
      sessionStorage.removeItem('betaEmailGate');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to unlock report');
    } finally {
      setBetaSubmitLoading(false);
    }
  };

  const handleCopyScore = () => {
    if (!report) return;
    const text = `RevenueZero Score: ${report.score?.total_score ?? 0}/100 — ${report.score?.interpretation ?? ''}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleUnlock = async (plan: 'starter' | 'growth' | 'launch_mode') => {
    trackEvent('checkout_clicked', { plan });
    setCheckoutLoading(true);
    try {
      const projectId = sessionStorage.getItem('projectId') || '';
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleReanalyze = () => {
    if (projectId && report) {
      // Store current input for re-analysis
      sessionStorage.setItem('reanalyzeInput', JSON.stringify(report.input));
      sessionStorage.setItem('reanalyzeProjectId', projectId);
      router.push('/analyze?reanalyze=true');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!report) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No report found. Please start an analysis.</p>
        <button
          onClick={() => router.push('/analyze')}
          style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Start Analysis
        </button>
      </div>
    );
  }

  // Get visible categories (top 2 worst performers in preview)
  const sortedCategories = [...report.score.category_scores].sort(
    (a, b) => a.weighted_score - b.weighted_score
  );
  const visibleCategories = hasAccess 
    ? report.score.category_scores 
    : sortedCategories.slice(0, 2);

  // Get top 3 improvement priorities
  const top3Priorities = report.score.improvement_priorities.slice(0, 3);

  const advanced = report.score.advanced;
  const riskLevel = advanced?.risk_level ?? 'Medium';
  const riskColor =
    riskLevel === 'Low' ? '#10b981' : riskLevel === 'Medium' ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Beta Banner - only when BETA_MODE and not in email gate flow */}
      {betaMode && !betaEmailGate && (
        <div style={{ padding: '0.75rem 1.5rem', background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 'bold' }}>
          Open Beta — Free access while we build the Revenue Intelligence OS
        </div>
      )}

      {/* Version and Re-analyze Button */}
      {version && version > 1 && (
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#e0f2fe', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>Version {version}</span>
          <button
            onClick={handleReanalyze}
            style={{ padding: '0.5rem 1rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Re-analyze
          </button>
        </div>
      )}

      {/* Iteration Intelligence - Enhanced comparison (Part 9) */}
      {comparison && (
        <div style={{ marginBottom: '3rem', padding: '2rem', background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            Score Improvement
          </h2>
          {(() => {
            const deltas = comparison.category_deltas;
            const mostImproved = [...deltas].filter((d) => d.delta > 0).sort((a, b) => b.delta - a.delta)[0];
            const stillCritical = [...deltas].sort((a, b) => a.current - b.current)[0];
            return (
              <>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {mostImproved && mostImproved.delta > 0 && (
                    <span style={{ padding: '0.5rem 1rem', background: '#d1fae5', borderRadius: '6px', fontWeight: 'bold' }}>
                      Most Improved: {mostImproved.category} (+{mostImproved.delta.toFixed(1)})
                    </span>
                  )}
                  {stillCritical && stillCritical.current < 12 && (
                    <span style={{ padding: '0.5rem 1rem', background: '#fee2e2', borderRadius: '6px', fontWeight: 'bold' }}>
                      Still Critical: {stillCritical.category}
                    </span>
                  )}
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e5e5e5', borderRadius: '4px', marginBottom: '1rem', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(comparison.previous_score / 100) * 100}%`, background: '#94a3b8', height: '100%' }} />
                  <div style={{ width: `${((comparison.current_score - comparison.previous_score) / 100) * 100}%`, background: '#10b981', height: '100%' }} />
                </div>
              </>
            );
          })()}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Previous</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{comparison.previous_score}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Current</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{comparison.current_score}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Change</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: comparison.delta >= 0 ? '#10b981' : '#ef4444' }}>
                {comparison.delta >= 0 ? '+' : ''}{comparison.delta.toFixed(1)}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 'bold' }}>Category Improvements:</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {comparison.category_deltas.map((delta) => (
                <div key={delta.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#fff', borderRadius: '4px' }}>
                  <span>{delta.category}</span>
                  <span style={{ color: delta.delta >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                    {delta.previous.toFixed(1)} → {delta.current.toFixed(1)} ({delta.delta >= 0 ? '+' : ''}{delta.delta.toFixed(1)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Beta Email Gate - Part 2 */}
      {!hasAccess && betaEmailGate && (
        <div style={{ padding: '2rem', background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '8px', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            Unlock Full Report
          </h2>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            Enter your email to view the complete analysis. No spam. Early access updates only.
          </p>
          <form onSubmit={handleBetaUnlock} style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email *</label>
              <input
                type="email"
                required
                value={betaForm.email}
                onChange={(e) => setBetaForm({ ...betaForm, email: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Project Name *</label>
              <input
                type="text"
                required
                value={betaForm.projectName}
                onChange={(e) => setBetaForm({ ...betaForm, projectName: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Website URL (optional)</label>
              <input
                type="url"
                value={betaForm.websiteUrl}
                onChange={(e) => setBetaForm({ ...betaForm, websiteUrl: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="https://"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Niche (optional)</label>
              <input
                type="text"
                value={betaForm.niche}
                onChange={(e) => setBetaForm({ ...betaForm, niche: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="e.g. Startup founders"
              />
            </div>
            <button
              type="submit"
              disabled={betaSubmitLoading}
              style={{ padding: '1rem 2rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: betaSubmitLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
            >
              {betaSubmitLoading ? 'Unlocking...' : 'Unlock Full Report'}
            </button>
          </form>
        </div>
      )}

      {/* Unlock Banner - Stripe (hidden when BETA_MODE or betaEmailGate) */}
      {!hasAccess && !betaEmailGate && !betaMode && (
        <div style={{ padding: '2rem', background: '#fff3cd', border: '2px solid #ffc107', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            Unlock Full Breakdown
          </h2>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            You're viewing a preview. Get the complete analysis with actionable recommendations.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleUnlock('starter')}
              disabled={checkoutLoading}
              style={{ padding: '1rem 2rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
            >
              Unlock Full Breakdown — $49
            </button>
          </div>
        </div>
      )}

      {/* Score Section - Full total score, advanced interpretation (Part 4 & 8) */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
          Revenue Readiness Score
        </h1>
        <div style={{ fontSize: '5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {report.score.total_score}/100
        </div>
        {/* Advanced scoring badges (Part 4) */}
        {advanced && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.4rem 1rem',
                background: riskColor,
                color: '#fff',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
              }}
            >
              Risk: {advanced.risk_level}
            </span>
            <span
              style={{
                display: 'inline-block',
                padding: '0.4rem 1rem',
                background: '#f3f4f6',
                border: `2px solid ${riskColor}`,
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
              }}
            >
              {advanced.revenue_leakage_indicator}
            </span>
            <span
              style={{
                display: 'inline-block',
                padding: '0.4rem 1rem',
                background: '#eff6ff',
                border: '2px solid #3b82f6',
                borderRadius: '6px',
                fontSize: '0.9rem',
              }}
            >
              Confidence: {advanced.confidence_score}%
            </span>
          </div>
        )}
        <div style={{ 
          display: 'inline-block', 
          padding: '0.5rem 1.5rem', 
          background: report.score.total_score < 40 ? '#fee' : 
                      report.score.total_score < 60 ? '#fef3c7' : 
                      report.score.total_score < 80 ? '#dbeafe' : 
                      report.score.total_score < 90 ? '#d1fae5' : '#dcfce7',
          border: `2px solid ${report.score.total_score < 40 ? '#ef4444' : 
                              report.score.total_score < 60 ? '#f59e0b' : 
                              report.score.total_score < 80 ? '#3b82f6' : 
                              report.score.total_score < 90 ? '#10b981' : '#16a34a'}`,
          borderRadius: '8px',
          marginBottom: '2rem',
          fontWeight: 'bold',
          fontSize: '1.2rem',
        }}>
          {report.score.interpretation}
        </div>
        {advanced && (
          <p style={{ marginTop: '0.75rem', color: '#666', fontSize: '0.95rem' }}>
            {advanced.risk_level === 'High' && 'Urgent: Multiple revenue blockers detected.'}
            {advanced.risk_level === 'Medium' && 'Focus on the weakest categories to unlock growth.'}
            {advanced.risk_level === 'Low' && 'Strong foundation. Optimize and scale.'}
          </p>
        )}

        {/* Improvement Priorities */}
        {top3Priorities.length > 0 && (
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fef2f2', border: '2px solid #ef4444', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 'bold', color: '#991b1b' }}>
              Top 3 Areas to Fix First
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {top3Priorities.map((priority, index) => (
                <div key={priority.category} style={{ padding: '1rem', background: '#fff', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '2rem', 
                      height: '2rem', 
                      borderRadius: '50%', 
                      background: '#ef4444', 
                      color: '#fff', 
                      textAlign: 'center', 
                      lineHeight: '2rem', 
                      fontWeight: 'bold' 
                    }}>
                      {index + 1}
                    </span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{priority.category}</span>
                  </div>
                  <p style={{ marginLeft: '3rem', color: '#666', lineHeight: '1.6' }}>{priority.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Scores */}
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          {visibleCategories.map((cat) => {
            const isBlurred = !hasAccess && !visibleCategories.includes(cat);
            return (
              <div 
                key={cat.category} 
                style={{ 
                  padding: '1.5rem', 
                  background: '#f9f9f9', 
                  borderRadius: '8px',
                  position: 'relative',
                  filter: isBlurred ? 'blur(4px)' : 'none',
                  opacity: isBlurred ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{cat.category}</span>
                  <span style={{ fontSize: '1.1rem' }}>{cat.weighted_score.toFixed(1)}/{cat.max_possible}</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#e5e5e5', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div
                    style={{
                      width: `${(cat.weighted_score / cat.max_possible) * 100}%`,
                      height: '100%',
                      background: cat.weighted_score < cat.max_possible * 0.6 ? '#ef4444' : cat.weighted_score < cat.max_possible * 0.8 ? '#f59e0b' : '#10b981',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                {Object.keys(cat.breakdown).length > 0 && (
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {Object.entries(cat.breakdown).map(([key, value]) => (
                      <span key={key} style={{ marginRight: '1rem' }}>
                        {key.replace(/_/g, ' ')}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Blurred Categories Message */}
        {!hasAccess && report.score.category_scores.length > 2 && (
          <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
            {report.score.category_scores.length - 2} more categories hidden. Unlock to see full breakdown.
          </div>
        )}
      </div>

      {/* Top 3 Revenue Killers */}
      {report.conversion.conversion_killers && report.conversion.conversion_killers.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Top Revenue Killers</h2>
          <ul style={{ paddingLeft: '2rem' }}>
            {report.conversion.conversion_killers.slice(0, 3).map((killer, i) => (
              <li key={i} style={{ marginBottom: '0.75rem', lineHeight: '1.8', fontSize: '1.1rem' }}>
                {killer}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full Report Content (blurred if no access) */}
      <div style={{ 
        filter: !hasAccess ? 'blur(8px)' : 'none',
        opacity: !hasAccess ? 0.3 : 1,
        pointerEvents: !hasAccess ? 'none' : 'auto',
      }}>
        {hasAccess ? (
          <>
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Niche Rewrite</h2>
              <p style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px', lineHeight: '1.8' }}>
                {report.market_clarity.niche_rewrite}
              </p>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Positioning Rewrite</h2>
              <p style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px', lineHeight: '1.8' }}>
                {report.positioning.positioning_rewrite}
              </p>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Pricing Feedback</h2>
              <p style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px', lineHeight: '1.8' }}>
                {report.pricing.pricing_feedback}
              </p>
              <p style={{ marginTop: '1rem', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px', lineHeight: '1.8' }}>
                <strong>Recommended Price:</strong> ${report.pricing.recommended_price}/mo
              </p>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>30-Day Action Plan</h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {report.action_plan.priority_actions.map((action, i) => (
                  <div key={i} style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold' }}>Priority {action.priority}</span>
                      <span style={{ color: '#666' }}>{action.timeframe}</span>
                    </div>
                    <p style={{ marginBottom: '0.5rem', lineHeight: '1.8' }}>{action.action}</p>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}><strong>Impact:</strong> {action.impact}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Part 7: Share your score */}
            <div style={{ marginBottom: '3rem', padding: '2rem', background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '8px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Share your score</h2>
              <p style={{ marginBottom: '1rem', color: '#666' }}>Copy your score summary, share your badge, or download the report.</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCopyScore}
                  style={{ padding: '0.75rem 1.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.95rem' }}
                >
                  {copySuccess ? 'Copied!' : 'Copy score summary'}
                </button>
                {reportId && (
                  <a
                    href={`/api/report-download/${reportId}?format=json`}
                    download
                    style={{ padding: '0.75rem 1.5rem', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', textDecoration: 'none', fontSize: '0.95rem' }}
                  >
                    Download Report (JSON)
                  </a>
                )}
                {reportId && (
                  <a
                    href={`/api/report-download/${reportId}?format=pdf`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: '0.75rem 1.5rem', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', textDecoration: 'none', fontSize: '0.95rem' }}
                  >
                    Download Report (PDF)
                  </a>
                )}
                {reportId && (
                  <a
                    href={`/api/badge/report/${reportId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: '0.75rem 1.5rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', textDecoration: 'none', fontSize: '0.95rem' }}
                  >
                    View badge
                  </a>
                )}
              </div>
            </div>
          </>
        ) : !betaEmailGate && !betaMode ? (
          <div style={{ padding: '3rem', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
              Full analysis is locked. Unlock to see complete recommendations.
            </p>
            <button
              onClick={() => handleUnlock('starter')}
              disabled={checkoutLoading}
              style={{ padding: '1rem 2rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
            >
              {checkoutLoading ? 'Loading...' : 'Unlock Full Audit - $49'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}
