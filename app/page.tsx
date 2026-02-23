import DemoReport from '@/components/DemoReport';
import LiveStats from '@/components/LiveStats';
import { BetaLandingOverrides, BetaCTA, BetaTrustLine, BetaHideWhenActive } from '@/components/BetaLandingOverrides';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <BetaLandingOverrides />
      {/* Hero Section */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '1.5rem', lineHeight: '1.2' }}>
          Stop Shipping. Start Selling.
        </h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#666', lineHeight: '1.6' }}>
          Your SaaS isn't failing because of your code.
          It's failing because nobody understands why they should pay.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <BetaCTA>
          <Link
            href="/analyze"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              background: '#000',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
            }}
          >
            Get My Revenue Audit
          </Link>
        </BetaCTA>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            background: 'transparent',
            color: '#000',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            border: '2px solid #000',
          }}
        >
          Dashboard
        </Link>
        </div>
        <BetaTrustLine />
      </section>

      {/* Problem Section */}
      <section style={{ padding: '4rem 2rem', background: '#f9f9f9' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold' }}>
            You Didn't Fail. You Avoided Sales.
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
            You built a product. You shipped features. You optimized code.
          </p>
          <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
            But you never learned to sell.
          </p>
          <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
            Your product might be good. Your code might be clean. Your features might be useful.
          </p>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
            But if nobody pays, you're building in the dark.
          </p>
        </div>
      </section>

      {/* Diagnosis Section */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold' }}>
            Here's What's Actually Broken
          </h2>
          <div style={{ display: 'grid', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Your niche is too broad.
              </h3>
              <p style={{ lineHeight: '1.8', color: '#666' }}>
                "For everyone" means "for no one." You can't message to a crowd. You need a narrow target.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Your positioning is vague.
              </h3>
              <p style={{ lineHeight: '1.8', color: '#666' }}>
                "Better productivity" doesn't mean anything. What specific outcome do you deliver?
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Your pricing doesn't signal value.
              </h3>
              <p style={{ lineHeight: '1.8', color: '#666' }}>
                Too low = cheap. Too high = risky. Price is positioning. Get it wrong, revenue stays at zero.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Your conversion funnel leaks.
              </h3>
              <p style={{ lineHeight: '1.8', color: '#666' }}>
                Vague headlines. Weak CTAs. No risk reversal. Visitors don't know why they should sign up.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                You have no traffic strategy.
              </h3>
              <p style={{ lineHeight: '1.8', color: '#666' }}>
                "Build it and they will come" is a lie. You need a plan to get your first 10 paying users.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section style={{ padding: '4rem 2rem', background: '#f9f9f9' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold' }}>
            RevenueZero Acts Like a Ruthless Co-Founder.
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
            We analyze your SaaS across 5 critical dimensions:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
            <li style={{ marginBottom: '1rem', paddingLeft: '2rem', position: 'relative' }}>
              <strong>Niche Clarity:</strong> Is your target audience narrow enough?
            </li>
            <li style={{ marginBottom: '1rem', paddingLeft: '2rem', position: 'relative' }}>
              <strong>Positioning Strength:</strong> Do visitors understand why they should pay?
            </li>
            <li style={{ marginBottom: '1rem', paddingLeft: '2rem', position: 'relative' }}>
              <strong>Pricing Fit:</strong> Does your price signal the right value?
            </li>
            <li style={{ marginBottom: '1rem', paddingLeft: '2rem', position: 'relative' }}>
              <strong>Conversion Strength:</strong> Does your funnel convert visitors to customers?
            </li>
            <li style={{ marginBottom: '1rem', paddingLeft: '2rem', position: 'relative' }}>
              <strong>Traffic Clarity:</strong> Do you have a plan to get paying users?
            </li>
          </ul>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
            We score each category. We identify what's broken. We give you a tactical action plan.
          </p>
        </div>
      </section>

      {/* Revenue Readiness Score Explanation */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: 'bold' }}>
            Revenue Readiness Score
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', lineHeight: '1.8' }}>
            Your score (0-100) tells you exactly where you stand:
          </p>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', background: '#fee', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
              <strong style={{ fontSize: '1.2rem' }}>0-39: Guessing</strong>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>
                You're building without clear direction. Stop. Fix positioning first.
              </p>
            </div>
            <div style={{ padding: '1.5rem', background: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '4px' }}>
              <strong style={{ fontSize: '1.2rem' }}>40-59: Building not selling</strong>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>
                You have a product, but messaging and positioning are weak. Revenue is blocked.
              </p>
            </div>
            <div style={{ padding: '1.5rem', background: '#dbeafe', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
              <strong style={{ fontSize: '1.2rem' }}>60-79: Close but unclear</strong>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>
                You're on the right track, but clarity issues are preventing conversion.
              </p>
            </div>
            <div style={{ padding: '1.5rem', background: '#d1fae5', borderLeft: '4px solid #10b981', borderRadius: '4px' }}>
              <strong style={{ fontSize: '1.2rem' }}>80-89: Revenue ready</strong>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>
                Strong foundation. Optimize conversion and scale acquisition.
              </p>
            </div>
            <div style={{ padding: '1.5rem', background: '#dcfce7', borderLeft: '4px solid #16a34a', borderRadius: '4px' }}>
              <strong style={{ fontSize: '1.2rem' }}>90-100: Aggressive growth mode</strong>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>
                Everything is aligned. Focus on scaling and growth loops.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats - Social Proof (Part 3) */}
      <LiveStats />

      {/* Demo Report */}
      <section style={{ padding: '4rem 2rem', background: '#f9f9f9' }}>
        <DemoReport />
      </section>

      {/* Pricing Section - hidden in BETA_MODE */}
      <BetaHideWhenActive>
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            Pricing
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '3rem', color: '#666' }}>
            Monthly subscription. Cancel anytime.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ padding: '2rem', border: '2px solid #ddd', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Starter</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>$19<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#666' }}>/mo</span></div>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>1 active project</li>
                <li style={{ marginBottom: '0.5rem' }}>3 analyses per month</li>
                <li style={{ marginBottom: '0.5rem' }}>Basic insights</li>
              </ul>
            </div>
            <div style={{ padding: '2rem', border: '2px solid #000', borderRadius: '8px', background: '#f9f9f9' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Growth</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>$49<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#666' }}>/mo</span></div>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>3 active projects</li>
                <li style={{ marginBottom: '0.5rem' }}>10 analyses per month</li>
                <li style={{ marginBottom: '0.5rem' }}>Iteration intelligence</li>
                <li style={{ marginBottom: '0.5rem' }}>Advanced scoring + Export PDF</li>
              </ul>
            </div>
            <div style={{ padding: '2rem', border: '2px solid #ddd', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Launch</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>$99<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#666' }}>/mo</span></div>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Unlimited projects</li>
                <li style={{ marginBottom: '0.5rem' }}>Unlimited analyses</li>
                <li style={{ marginBottom: '0.5rem' }}>Public profile option</li>
                <li style={{ marginBottom: '0.5rem' }}>Priority analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      </BetaHideWhenActive>

      {/* Final CTA */}
      <section style={{ padding: '4rem 2rem', background: '#000', color: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
            Your Code Isn't the Problem. Your Market Is.
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', lineHeight: '1.8' }}>
            Stop building. Start selling. Get your revenue audit.
          </p>
          <BetaCTA>
            <Link
              href="/analyze"
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: '#fff',
                color: '#000',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
              }}
            >
              Get My Revenue Audit
            </Link>
          </BetaCTA>
        </div>
      </section>
    </div>
  );
}

