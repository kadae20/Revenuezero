# Performance Audit — SaaS Intelligence OS

## Added Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `projects` | `idx_projects_slug` (WHERE slug IS NOT NULL) | Badge & public project lookup by slug |
| `analysis_reports` | `idx_analysis_reports_project_created` (project_id, created_at DESC) | Latest report per project; score credibility |
| `analysis_reports` | `idx_analysis_reports_created_at` (created_at DESC) | Recency ordering; stats sampling |
| `project_rankings` | `idx_project_rankings_score` (score DESC) | Leaderboard ordering |
| `project_rankings` | `idx_project_rankings_niche_score` (niche, score DESC) | Leaderboard by niche; percentile RPC |
| `project_rankings` | `idx_project_rankings_updated` | Freshness checks |
| `subscriptions` | `idx_subscriptions_user_id` | Usage checks (ensure exists) |
| `free_analysis_attempts` | `idx_free_analysis_ip_created` (ip_hash, created_at) | Abuse detection |
| `rate_limit_attempts` | (existing) | IP rate limiting |

**Recommended additional index (if not present):**
- `subscriptions.user_id` — used by `getSubscriptionByUserId`, `checkUsageLimits`
- `webhook_events_processed.stripe_event_id` — UNIQUE for idempotency

---

## Estimated Query Cost (100k Projects)

### Leaderboard (GET /api/leaderboard)

- **Primary path:** `project_rankings` with `idx_project_rankings_niche_score` or `idx_project_rankings_score`
- **Plan:** Index scan + limit 20–100 rows
- **JOIN:** `projects!inner` on project_id (indexed FK)
- **Estimated cost:** ~0.1–1 ms index lookup; negligible at 100k rows

### Stats (GET /api/stats)

- **RPC `get_platform_stats`:** 4 COUNT aggregates; no full table scan
- **Fallback:** Parallel counts + sample of analysis_reports (limit 10k)
- **average_score_by_niche:** In-memory aggregation from sampled rows
- **Estimated cost:** ~10–50 ms depending on dataset size

### Percentile (compute_percentile RPC)

- **Input:** project_rankings table, filtered by niche
- **Plan:** Index scan on `idx_project_rankings_niche_score`
- **Operations:** 2 × COUNT(*) with WHERE niche = $1 and (optional) score < $2
- **Estimated cost:** ~1–5 ms per call (niche cardinality matters)

### Badge (GET /api/badge/[slug])

- **Lookup:** projects by slug (idx_projects_slug) → project_rankings by project_id
- **Cache:** 5 min (300s) via Cache-Control
- **Estimated cost:** <1 ms cached; ~2–5 ms uncached

---

## Risk Areas at 100k Projects

1. **get_platform_stats fallback**
   - If RPC missing, stats endpoint runs parallel full counts + 10k sample
   - Mitigation: Apply migration 005; avoid fallback in production

2. **average_score_by_niche in stats**
   - Uses sample (10k–20k reports); may under-represent rare niches
   - Mitigation: Pre-aggregate into materialized view if needed

3. **Leaderboard fallback**
   - On `project_rankings` error, falls back to full analysis_reports scan + dedupe
   - Risk: O(n) at 100k+ analyses
   - Mitigation: Ensure project_rankings populated; avoid fallback path

4. **Percentile RPC**
   - Two index scans per analysis; acceptable
   - If niche cardinality is very high, consider partitioning

5. **Free analysis attempts / rate limits**
   - Inserts per anonymous analysis; index on (ip_hash, created_at)
   - Risk: Hot rows if one IP generates many requests
   - Mitigation: Rate limit at edge (Vercel/Cloudflare) before DB

---

## Bottlenecks

- **Analysis flow:** RevenueBrain + saveReport + upsertProjectRanking + updateReportPercentile
  - Percentile RPC adds ~2–5 ms
  - All non-blocking; no serialization

- **Webhook processing:** Idempotency via unique index on stripe_event_id
  - No lock; insert-first pattern

- **Billing cycle reset:** Handled inside `try_increment_*` RPC
  - Single transaction; FOR UPDATE on subscription row
  - No cross-boundary race

---

## Summary

| Endpoint / Operation | Target Latency | Notes |
|----------------------|----------------|-------|
| /api/leaderboard | <50 ms | Index-backed; 100k safe |
| /api/stats | <100 ms | RPC preferred |
| /api/badge/[slug] | <10 ms | Cached 5 min |
| compute_percentile | <5 ms | Per analysis |
| Analysis (full flow) | N/A | Dominated by AI; DB overhead minimal |
