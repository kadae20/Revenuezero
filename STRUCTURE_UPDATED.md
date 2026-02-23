# RevenueZero → Revenue Intelligence Platform
## Updated Folder Structure

```
revenue zero/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts          # [UPDATED] + website scrape, rate limit, analytics
│   │   ├── checkout/route.ts
│   │   ├── webhooks/route.ts
│   │   ├── admin/route.ts            # [NEW] Admin stats API
│   │   ├── analytics/route.ts        # [NEW] Event tracking endpoint
│   │   └── rate-limit/route.ts       # [NEW] Check rate limit status
│   ├── admin/
│   │   └── page.tsx                  # [NEW] Protected admin dashboard
│   ├── analyze/page.tsx
│   ├── report/page.tsx               # [UPDATED] Advanced scoring, conversion, iteration
│   ├── page.tsx                      # [UPDATED] + LiveStats component
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── DemoReport.tsx
│   └── LiveStats.tsx                 # [NEW] Social proof stats on landing
├── lib/
│   ├── agents/                       # (unchanged)
│   ├── orchestrator/RevenueBrain.ts  # [UPDATED] + advanced score metadata
│   ├── scoring/
│   │   └── revenueScore.ts           # [UPDATED] + risk, leakage, confidence
│   ├── database/
│   │   ├── projects.ts
│   │   ├── reports.ts
│   │   ├── subscriptions.ts
│   │   ├── analysisPatterns.ts       # [NEW]
│   │   ├── globalInsights.ts         # [NEW]
│   │   ├── caseSnapshots.ts          # [NEW]
│   │   ├── analyticsEvents.ts        # [NEW]
│   │   └── rateLimitAttempts.ts      # [NEW]
│   ├── stripe/
│   ├── utils/
│   │   ├── supabase.ts
│   │   ├── stripe.ts
│   │   ├── websiteScraper.ts         # [NEW]
│   │   └── insightAggregator.ts      # [NEW]
├── types/
│   └── index.ts                      # [UPDATED] + new types
├── database/
│   ├── schema.sql                    # (existing)
│   └── migrations/
│       └── 002_intelligence_platform.sql   # [NEW] New tables
├── middleware.ts                     # [UPDATED] + rate limit, admin protection
└── package.json                      # [UPDATED] + cheerio
```

## New Tables (migrations/002_intelligence_platform.sql)

- **analysis_patterns** – Per-report anonymized pattern storage
- **global_insights** – Aggregate metrics (singleton row)
- **case_snapshots** – Anonymized success summaries for social proof
- **analytics_events** – Event tracking
- **rate_limit_attempts** – Per-IP analysis attempts
