# RevenueZero

AI-powered revenue intelligence system for Micro SaaS founders stuck at $0 revenue.

## Overview

RevenueZero is a production-ready SaaS product that analyzes why a SaaS is still at $0 revenue and provides a tactical path to first revenue. It uses a modular agent-based architecture to diagnose issues across 5 critical dimensions and generates a Revenue Readiness Score (0-100).

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase** (Auth + Postgres DB)
- **Stripe** (Checkout + Webhooks)
- **Modular agent-based backend architecture**
- **Deterministic scoring engine**

## Project Structure

```
/app
  /api
    /analyze          # Analysis endpoint
    /checkout         # Stripe checkout creation
    /webhooks         # Stripe webhook handler
  /analyze            # Analysis form page
  /report             # Report display page
  page.tsx            # Landing page
  layout.tsx          # Root layout
  globals.css         # Global styles

/components
  DemoReport.tsx      # Public demo report component

/lib
  /agents
    MarketClarityAgent.ts
    PositioningAgent.ts
    PricingAgent.ts
    ConversionAgent.ts
    TrafficAgent.ts
    ActionPlanAgent.ts
  /orchestrator
    RevenueBrain.ts   # Main orchestrator
  /scoring
    revenueScore.ts   # Scoring engine
  /stripe
    checkout.ts       # Stripe utilities
  /database
    subscriptions.ts
    reports.ts
    projects.ts
  /utils
    supabase.ts
    stripe.ts

/types
  index.ts            # All TypeScript types

/database
  schema.sql          # Supabase database schema
```

## Core System Flow

1. User signs up (Supabase Auth)
2. User submits SaaS data via `/analyze` page
3. System generates preview Revenue Score
4. Full report is locked behind payment
5. User purchases plan via Stripe
6. Full report unlocks
7. Report stored in Supabase
8. Subscription status synced

## Agent Architecture

Six modular agents analyze different aspects:

1. **MarketClarityAgent** - Niche clarity, ICP specificity, problem clarity
2. **PositioningAgent** - Outcome promise, unique mechanism, differentiation
3. **PricingAgent** - Price-to-value alignment, tier clarity, psychological pricing
4. **ConversionAgent** - Headline clarity, CTA strength, social proof, risk reversal
5. **TrafficAgent** - Acquisition channels, first 10 user plan, growth loops
6. **ActionPlanAgent** - Generates prioritized action plan based on scores

## Scoring Engine

Revenue Readiness Score (0-100) with weighted categories:

- **Niche Clarity** (25%)
- **Positioning Strength** (25%)
- **Pricing Fit** (15%)
- **Conversion Strength** (20%)
- **Traffic Clarity** (15%)

Interpretation levels:
- 0-39: Guessing
- 40-59: Building not selling
- 60-79: Close but unclear
- 80-89: Revenue ready
- 90-100: Aggressive growth mode

## Pricing Plans

- **Starter**: $49 (one-time)
- **Growth**: $79 (one-time)
- **Launch Mode**: $149 (one-time)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

3. Run database migrations:
- Execute `database/schema.sql` in your Supabase SQL editor

4. Run development server:
```bash
npm run dev
```

## API Endpoints

### POST `/api/analyze`
Analyzes SaaS input and returns report (preview or full based on subscription).

**Request:**
```json
{
  "input": {
    "product_name": "string",
    "description": "string",
    "target_user_guess": "string",
    "pricing_model": "string",
    "monthly_price": number,
    "website_url": "string",
    "feature_list": ["string"],
    "competitors": ["string"]
  },
  "projectId": "string (optional)"
}
```

**Response:**
```json
{
  "report": RevenueReport,
  "projectId": "string",
  "hasAccess": boolean
}
```

### POST `/api/checkout`
Creates Stripe checkout session.

**Request:**
```json
{
  "plan": "starter" | "growth" | "launch_mode",
  "projectId": "string"
}
```

### POST `/api/webhooks`
Handles Stripe webhooks (checkout.session.completed, invoice.payment_succeeded, customer.subscription.deleted).

## Database Schema

See `database/schema.sql` for complete schema. Main tables:

- `users` - User profiles
- `projects` - User SaaS projects
- `analysis_reports` - Generated reports
- `subscriptions` - Stripe subscription data

## Production Deployment

1. Deploy to Vercel/Netlify
2. Set up Supabase project
3. Configure Stripe products and webhooks
4. Set environment variables
5. Run database migrations

## License

Proprietary - RevenueZero

