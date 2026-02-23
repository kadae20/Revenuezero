# RevenueZero → Subscription-Based SaaS Intelligence Platform
## Updated Folder Structure

```
revenue zero/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts              # [UPDATED] Monthly/project usage enforcement
│   │   ├── checkout/route.ts             # [UPDATED] Recurring Stripe subscription
│   │   ├── webhooks/route.ts             # [UPDATED] subscription lifecycle events
│   │   ├── admin/route.ts
│   │   ├── analytics/route.ts
│   │   ├── insights/route.ts
│   │   └── monthly-summary/route.ts      # [NEW] Monthly analytics generation
│   ├── dashboard/
│   │   └── page.tsx                      # [NEW] Project dashboard
│   ├── p/
│   │   └── [projectSlug]/page.tsx        # [NEW] Public SaaS profile
│   ├── admin/page.tsx
│   ├── analyze/page.tsx
│   ├── report/page.tsx
│   └── page.tsx
├── components/
│   ├── DemoReport.tsx
│   ├── LiveStats.tsx
│   └── ScoreHistoryChart.tsx             # [NEW]
├── lib/
│   ├── database/
│   │   ├── projects.ts                   # [UPDATED] +website_url, niche, slug, is_public
│   │   ├── subscriptions.ts              # [UPDATED] New tier logic, billing cycle
│   │   ├── monthlySnapshots.ts           # [NEW]
│   │   └── ...
│   ├── stripe/
│   │   └── checkout.ts                   # [UPDATED] mode: 'subscription'
│   └── utils/
│       └── monthlySummary.ts             # [NEW] Email-ready summary generation
├── types/index.ts                        # [UPDATED] New plan limits, subscription types
├── database/
│   ├── schema.sql
│   └── migrations/
│       ├── 002_intelligence_platform.sql
│       └── 003_subscription_model.sql    # [NEW]
└── package.json
```

## New / Modified Tables (003_subscription_model.sql)

**projects** (ALTER):
- Add: website_url, niche, slug (unique), is_public

**subscriptions** (ALTER):
- plan_type: starter | growth | launch (new tiers)
- analyses_used_this_month
- projects_count
- billing_cycle_start, billing_cycle_end
- Keep: stripe_customer_id, stripe_subscription_id, status

**monthly_snapshots** (NEW):
- user_id, project_id, month, score_trend, top_issues, most_improved_category, summary_json
