'use client';

import { RevenueReport } from '@/types';

const demoReport: RevenueReport = {
  input: {
    product_name: 'AI Productivity Tool',
    description: 'An AI-powered productivity tool for startups that automates task management and improves team collaboration.',
    target_user_guess: 'Startup founders and small teams',
    pricing_model: 'Single tier',
    monthly_price: 19,
    website_url: 'https://example.com',
    feature_list: ['AI task automation', 'Team collaboration', 'Analytics dashboard'],
    competitors: ['Asana', 'Trello', 'Notion'],
  },
  score: {
    total_score: 42,
    interpretation: 'Building not selling',
    category_scores: [
      {
        category: 'Niche Clarity',
        raw_score: 8,
        weighted_score: 8,
        max_possible: 25,
        breakdown: {
          icp_specificity: 3,
          problem_clarity: 2,
          market_narrowness: 2,
          language_specificity: 1,
        },
      },
      {
        category: 'Positioning Strength',
        raw_score: 10,
        weighted_score: 10,
        max_possible: 25,
        breakdown: {
          outcome_promise: 4,
          unique_mechanism: 2,
          differentiation: 2,
          category_clarity: 2,
        },
      },
      {
        category: 'Pricing Fit',
        raw_score: 8,
        weighted_score: 8,
        max_possible: 15,
        breakdown: {
          price_value_alignment: 3,
          tier_clarity: 2,
          psychological_pricing: 3,
        },
      },
      {
        category: 'Conversion Strength',
        raw_score: 6,
        weighted_score: 6,
        max_possible: 20,
        breakdown: {
          headline_clarity: 2,
          cta_strength: 1,
          social_proof: 1,
          risk_reversal: 2,
        },
      },
      {
        category: 'Traffic Clarity',
        raw_score: 4,
        weighted_score: 4,
        max_possible: 15,
        breakdown: {
          acquisition_channel: 2,
          first_10_user_plan: 1,
          repeatable_loop: 1,
        },
      },
    ],
    improvement_priorities: [
      {
        category: 'Niche Clarity',
        priority: 17,
        reason: 'Niche Clarity is critically weak. This is blocking revenue.',
      },
      {
        category: 'Positioning Strength',
        priority: 15,
        reason: 'Positioning Strength needs significant improvement to unlock revenue.',
      },
      {
        category: 'Traffic Clarity',
        priority: 11,
        reason: 'Traffic Clarity is critically weak. This is blocking revenue.',
      },
    ],
  },
  market_clarity: {
    icp_specificity: 3,
    problem_clarity: 2,
    market_narrowness: 2,
    language_specificity: 1,
    niche_rewrite: 'Micro SaaS founders stuck at $0-$500 MRR who have built a product but can\'t get paying customers. Specifically: solo founders or 2-person teams, technical background, launched in last 6 months, have 0-10 paying customers, spending more time building than selling.',
    problem_statement: 'Startup founders struggle with task management and team coordination which costs them productivity and prevents them from scaling efficiently.',
    target_icp: 'Primary: Startup founders and small teams (2-10 people) who are overwhelmed by task management and need automation. Secondary: Solo founders managing multiple projects. Exclude: Enterprise teams with established processes.',
    market_analysis: 'Moderate competition (3 competitors). Market exists but positioning and execution will determine success. Focus on specific niche within this market.',
  },
  positioning: {
    outcome_promise: 4,
    unique_mechanism: 2,
    differentiation: 2,
    category_clarity: 2,
    positioning_rewrite: 'For startup founders and small teams who need [specific outcome], AI Productivity Tool is the solution that [outcome]. Unlike Asana, we [unique mechanism].',
    unique_value_prop: 'Your unique mechanism isn\'t clear. Define: What specific method/approach/technology do you use that others don\'t? This is your defensible moat.',
    category_definition: 'Define your category narrowly. Instead of "productivity tool," be "AI task automation for micro startups" or "founder-focused task system." Category clarity = faster customer understanding.',
    differentiation_analysis: 'You compete with 3 solutions. Differentiation required. Your edge: [specific differentiator]. If you can\'t articulate this in one sentence, you\'re a commodity.',
  },
  pricing: {
    price_value_alignment: 3,
    tier_clarity: 2,
    psychological_pricing: 3,
    pricing_feedback: 'Price in good range ($19/mo). This is the sweet spot for self-serve SaaS. Ensure your value prop justifies it.',
    recommended_price: 29,
    pricing_strategy: 'Self-serve SaaS pricing: Good range for impulse purchases and credit card signups. Focus on clear value prop and risk reversal (money-back guarantee).',
    tier_recommendations: 'Pricing model unclear. Recommended structure: Starter ($12/mo) for early adopters, Growth ($19/mo) as main tier, Launch Mode ($38/mo) for power users.',
  },
  conversion: {
    headline_clarity: 2,
    cta_strength: 1,
    social_proof: 1,
    risk_reversal: 2,
    conversion_killers: [
      'Vague headline that doesn\'t promise specific outcome',
      'No clear feature list or value demonstration',
    ],
    headline_rewrite: 'AI Productivity Tool automates task management for startup founders, saving 10+ hours per week.',
    cta_rewrite: 'Start Free Trial',
    social_proof_recommendations: 'You\'re at $0 revenue, so traditional social proof isn\'t available. Use: 1) Founder credibility, 2) Early access badges, 3) Transparent metrics, 4) Demo report, 5) Money-back guarantee.',
    risk_reversal_tactics: 'For $19/mo, offer: 1) 30-day money-back guarantee, 2) Cancel anytime, 3) No credit card required for trial, 4) "If this doesn\'t save you time, we\'ll refund you."',
  },
  traffic: {
    acquisition_channel: 2,
    first_10_user_plan: 1,
    repeatable_loop: 1,
    channel_analysis: 'Your target (Startup founders and small teams) is on: Twitter/X (build in public), Indie Hackers, Reddit (r/SaaS, r/entrepreneur), LinkedIn (founder groups), Micro SaaS communities. Pick ONE channel, go deep.',
    first_10_plan: 'First 10 users plan: 1) Manual outreach: Find 50 startup founders on Twitter/X. DM: "I built AI Productivity Tool to solve task management. Can I show you a quick demo? Free access for feedback." 2) Give value first: Share productivity tips before asking for signup. 3) Personal touch: Each of first 10 gets direct access to you. 4) Ask for feedback: "What would make you pay for this?" 5) Ask for referrals: After they see value, "Know 2 others with this problem?" Timeline: 30 days.',
    acquisition_strategy: 'Low-price strategy: Focus on volume channels. Twitter/X threads, Reddit posts, Indie Hackers posts. Content that demonstrates value, then CTA. Self-serve signup.',
    growth_loop: 'Growth loop: User saves time → Shares time saved/result → Others want same efficiency → Sign up. Make results shareable (screenshots, metrics, before/after).',
  },
  action_plan: {
    priority_actions: [
      {
        action: 'Rewrite target ICP: Micro SaaS founders stuck at $0-$500 MRR... Update all copy to speak directly to this narrow segment.',
        priority: 1,
        timeframe: 'Week 1',
        impact: 'High - Enables clear messaging and targeting',
      },
      {
        action: 'Rewrite positioning: For startup founders who need [outcome]... Update homepage headline and value prop.',
        priority: 2,
        timeframe: 'Week 1',
        impact: 'High - Makes product purpose clear to visitors',
      },
      {
        action: 'Define acquisition channel: Twitter/X, Indie Hackers, Reddit. Execute first 10 user plan.',
        priority: 3,
        timeframe: 'Week 1-4',
        impact: 'Critical - No traffic = no revenue',
      },
    ],
    quick_wins: [
      'Rewrite homepage headline to be outcome-focused (not feature-focused)',
      'Add risk reversal: 30-day money-back guarantee',
      'Narrow target audience from generic to specific ICP',
      'Add social proof placeholder: "Join 50+ founders using AI Productivity Tool"',
    ],
    strategic_moves: [
      'Stop adding features. Fix positioning and messaging first.',
      'Build in public. Share your journey on Twitter/X to attract early users.',
      'Create content that demonstrates value before asking for signup.',
    ],
    timeline: 'Week 1: Fix headline and CTA. Week 2: Implement pricing changes. Week 3-4: Execute first 10 user plan. Month 2: Optimize based on data.',
  },
};

export default function DemoReport() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
        Sample Revenue Audit
      </h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Here's what a RevenueZero audit looks like for a real product.
      </p>
      
      <div style={{ marginBottom: '3rem', padding: '2rem', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Product: AI Productivity Tool</h3>
        <p style={{ marginBottom: '0.5rem' }}><strong>Price:</strong> $19/month</p>
        <p style={{ marginBottom: '0.5rem' }}><strong>Target:</strong> Startup founders and small teams</p>
      </div>
      
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Revenue Readiness Score</h3>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          {demoReport.score.total_score}/100
        </div>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
          {demoReport.score.interpretation}
        </p>
        
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          {demoReport.score.category_scores.map((cat) => (
            <div key={cat.category} style={{ padding: '1rem', background: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold' }}>{cat.category}</span>
                <span>{cat.weighted_score.toFixed(1)}/{cat.max_possible}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(cat.weighted_score / cat.max_possible) * 100}%`,
                    height: '100%',
                    background: cat.weighted_score < cat.max_possible * 0.6 ? '#ef4444' : '#10b981',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Niche Rewrite</h3>
        <p style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '4px', lineHeight: '1.8' }}>
          {demoReport.market_clarity.niche_rewrite}
        </p>
      </div>
      
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Positioning Rewrite</h3>
        <p style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '4px', lineHeight: '1.8' }}>
          {demoReport.positioning.positioning_rewrite}
        </p>
      </div>
      
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Pricing Feedback</h3>
        <p style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '4px', lineHeight: '1.8' }}>
          {demoReport.pricing.pricing_feedback}
        </p>
        <p style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px', lineHeight: '1.8' }}>
          <strong>Recommended Price:</strong> ${demoReport.pricing.recommended_price}/mo
        </p>
      </div>
      
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Conversion Killers</h3>
        <ul style={{ paddingLeft: '2rem' }}>
          {demoReport.conversion.conversion_killers.map((killer, i) => (
            <li key={i} style={{ marginBottom: '0.5rem', lineHeight: '1.8' }}>{killer}</li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>30-Day Action Plan</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {demoReport.action_plan.priority_actions.map((action, i) => (
            <div key={i} style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold' }}>Priority {action.priority}</span>
                <span style={{ color: '#666' }}>{action.timeframe}</span>
              </div>
              <p style={{ marginBottom: '0.5rem' }}>{action.action}</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}><strong>Impact:</strong> {action.impact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

