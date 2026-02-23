'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SaaSInput } from '@/types';

function AnalyzeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReanalysis = searchParams.get('reanalyze') === 'true';
  const projectIdFromUrl = searchParams.get('projectId');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SaaSInput>({
    product_name: '',
    description: '',
    target_user_guess: '',
    pricing_model: '',
    monthly_price: 0,
    website_url: '',
    feature_list: [],
    competitors: [],
  });
  const [currentFeature, setCurrentFeature] = useState('');
  const [currentCompetitor, setCurrentCompetitor] = useState('');

  useEffect(() => {
    if (isReanalysis) {
      const previousInput = sessionStorage.getItem('reanalyzeInput');
      const projectId = sessionStorage.getItem('reanalyzeProjectId') || projectIdFromUrl;
      if (previousInput) {
        try {
          const input = JSON.parse(previousInput);
          setFormData(input);
          if (projectId) sessionStorage.setItem('projectId', projectId);
        } catch (e) {
          console.error('Failed to load previous input', e);
        }
        return;
      }
      if (projectIdFromUrl) {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) return;
          fetch(`/api/projects/${projectIdFromUrl}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((p) => {
              if (p?.input) {
                setFormData(p.input);
                sessionStorage.setItem('projectId', p.id);
              }
            });
        });
      }
    }
  }, [isReanalysis, projectIdFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = sessionStorage.getItem('projectId') || sessionStorage.getItem('reanalyzeProjectId');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          input: formData,
          projectId: projectId || undefined,
          isReanalysis: isReanalysis && !!projectId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze');
      }

      const data = await response.json();
      sessionStorage.setItem('report', JSON.stringify(data.report));
      sessionStorage.setItem('hasAccess', JSON.stringify(data.hasAccess ?? false));
      sessionStorage.setItem('projectId', data.projectId || '');
      sessionStorage.setItem('reportId', data.reportId || '');
      if (data.comparison) sessionStorage.setItem('comparison', JSON.stringify(data.comparison));
      if (data.version) sessionStorage.setItem('version', data.version.toString());

      if (data.betaMode && data.emailGateRequired) {
        sessionStorage.setItem('betaEmailGate', 'true');
        sessionStorage.setItem('betaProjectName', data.projectName || formData.product_name);
        sessionStorage.setItem('betaWebsiteUrl', data.websiteUrl || formData.website_url || '');
        sessionStorage.setItem('betaNiche', data.niche || formData.target_user_guess || '');
        sessionStorage.setItem('betaReportId', data.reportId || '');
        sessionStorage.setItem('betaProjectSlug', data.projectSlug || '');
      } else {
        sessionStorage.removeItem('betaEmailGate');
      }
      router.push('/report');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (currentFeature.trim()) {
      setFormData({
        ...formData,
        feature_list: [...formData.feature_list, currentFeature.trim()],
      });
      setCurrentFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      feature_list: formData.feature_list.filter((_, i) => i !== index),
    });
  };

  const addCompetitor = () => {
    if (currentCompetitor.trim()) {
      setFormData({
        ...formData,
        competitors: [...formData.competitors, currentCompetitor.trim()],
      });
      setCurrentCompetitor('');
    }
  };

  const removeCompetitor = (index: number) => {
    setFormData({
      ...formData,
      competitors: formData.competitors.filter((_, i) => i !== index),
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold' }}>
        {isReanalysis ? 'Re-analyze Your SaaS' : 'Get Your Revenue Audit'}
      </h1>
      <p style={{ marginBottom: '2rem', color: '#666', lineHeight: '1.8' }}>
        {isReanalysis 
          ? 'Update your product details below. We'll compare your new score with the previous analysis.'
          : 'Tell us about your SaaS. We'll analyze it and give you a Revenue Readiness Score.'}
      </p>

      {error && (
        <div style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Product Name *
          </label>
          <input
            type="text"
            required
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Description *
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            placeholder="What does your product do? Who is it for? What problem does it solve?"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Target User *
          </label>
          <input
            type="text"
            required
            value={formData.target_user_guess}
            onChange={(e) => setFormData({ ...formData, target_user_guess: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            placeholder="e.g., Startup founders, SaaS developers, Marketing teams"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Pricing Model *
          </label>
          <input
            type="text"
            required
            value={formData.pricing_model}
            onChange={(e) => setFormData({ ...formData, pricing_model: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            placeholder="e.g., Single tier, Free + Pro, Starter/Growth/Enterprise"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Monthly Price ($) *
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.monthly_price || ''}
            onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Website URL *
          </label>
          <input
            type="url"
            required
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            placeholder="https://yourproduct.com"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Features
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={currentFeature}
              onChange={(e) => setCurrentFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              style={{ flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              placeholder="Add a feature"
            />
            <button
              type="button"
              onClick={addFeature}
              style={{ padding: '0.75rem 1.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {formData.feature_list.map((feature, index) => (
              <span
                key={index}
                style={{ padding: '0.5rem 1rem', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Competitors
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={currentCompetitor}
              onChange={(e) => setCurrentCompetitor(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
              style={{ flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              placeholder="Add a competitor"
            />
            <button
              type="button"
              onClick={addCompetitor}
              style={{ padding: '0.75rem 1.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {formData.competitors.map((competitor, index) => (
              <span
                key={index}
                style={{ padding: '0.5rem 1rem', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {competitor}
                <button
                  type="button"
                  onClick={() => removeCompetitor(index)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '1rem 2rem',
            background: loading ? '#666' : '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Analyzing...' : 'Get My Revenue Audit'}
        </button>
      </form>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <AnalyzeForm />
    </Suspense>
  );
}

