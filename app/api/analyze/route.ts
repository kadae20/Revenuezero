import { NextRequest, NextResponse } from 'next/server';
import { RevenueBrain } from '@/lib/orchestrator/RevenueBrain';
import { getSubscriptionByUserId, checkUsageLimits, incrementReportCount, incrementReanalysisCount, incrementProjectsCount } from '@/lib/database/subscriptions';
import { createProject, getProjectById } from '@/lib/database/projects';
import { saveReport, getLatestReportByProjectId, getPreviousReportByProjectId } from '@/lib/database/reports';
import { SaaSInput } from '@/types';
import { createClient } from '@supabase/supabase-js';
import { scrapeWebsite } from '@/lib/utils/websiteScraper';
import { checkRateLimit, incrementRateLimitAttempt, hashIp } from '@/lib/database/rateLimitAttempts';
import { recordFreeAnalysisAttempt } from '@/lib/database/freeAnalysisAttempts';
import { upsertProjectRanking } from '@/lib/database/projectRankings';
import { updateReportPercentile } from '@/lib/database/reports';
import { trackEvent } from '@/lib/database/analyticsEvents';
import { aggregateInsights } from '@/lib/utils/insightAggregator';
import { BETA_MODE, MONETIZATION_ENABLED } from '@/lib/config/featureFlags';
import type { ScrapedWebsite } from '@/types';

const BETA_SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, projectId, isReanalysis } = body;

    // Validate input
    if (!input || !isValidSaaSInput(input)) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    
    // Rate limit for unauthenticated free previews (Part 6)
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId && !BETA_MODE) {
      const rateCheck = await checkRateLimit(clientIp);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: rateCheck.reason || 'Rate limit exceeded' },
          { status: 429 }
        );
      }
    }

    // Website auto-fetch when website_url exists (Part 1)
    let enrichedInput: SaaSInput = { ...input };
    if (input.website_url && typeof input.website_url === 'string' && input.website_url.trim()) {
      try {
        const scraped = await scrapeWebsite(input.website_url.trim());
        if (scraped.success) {
          enrichedInput = {
            ...input,
            scraped_website: scraped,
            description: mergeScrapedIntoDescription(input.description, scraped),
          };
        }
      } catch {
        // Invalid URL or timeout - continue with original input
      }
    }

    // Track analytics (Part 7)
    await trackEvent({ event_name: 'analysis_started', user_id: userId ?? undefined });

    // Part 5: Usage enforcement (bypassed when BETA_MODE or MONETIZATION_ENABLED=false)
    if (userId && MONETIZATION_ENABLED && !BETA_MODE) {
      const subscription = await getSubscriptionByUserId(userId);
      if (!subscription) {
        return NextResponse.json(
          { error: 'No active subscription. Payment may be past due.', code: 'SUBSCRIPTION_INACTIVE' },
          { status: 403 }
        );
      }
      const isNewProject = !projectId;
      const usageCheck = await checkUsageLimits(userId, projectId, isNewProject);
      if (!usageCheck.allowed) {
        return NextResponse.json(
          {
            error: usageCheck.reason,
            limitType: usageCheck.limitType,
            code: 'USAGE_LIMIT_EXCEEDED',
          },
          { status: 403 }
        );
      }
    }
    
    // Initialize RevenueBrain
    const revenueBrain = new RevenueBrain();

    // Generate full report (use enriched input with scraped content)
    const fullReport = await revenueBrain.analyze(enrichedInput as SaaSInput);

    // BETA_MODE: email gate flow - save report, return preview only (Part 2)
    if (BETA_MODE) {
      const betaUserId = BETA_SYSTEM_USER_ID;
      const project = await createProject(betaUserId, input.product_name, enrichedInput as SaaSInput);
      const savedReport = await saveReport(betaUserId, project.id, fullReport);

      const score = fullReport.score?.total_score ?? 0;
      const niche = input.target_user_guess || null;
      const { percentile } = await upsertProjectRanking(project.id, score, niche);
      await updateReportPercentile(savedReport.id, percentile, niche);

      await aggregateInsights(fullReport, project.id, undefined);
      await trackEvent({
        event_name: 'beta_analysis_completed',
        metadata: { niche: niche ?? 'general', score, percentile: percentile ?? null, timestamp: new Date().toISOString() },
      });

      const previewReport = revenueBrain.generatePreviewReport(fullReport);
      return NextResponse.json({
        report: previewReport,
        reportId: savedReport.id,
        projectId: project.id,
        projectSlug: (project as { slug?: string }).slug ?? null,
        projectName: input.product_name,
        websiteUrl: input.website_url || null,
        niche: niche,
        score,
        percentile: percentile ?? null,
        betaMode: true,
        emailGateRequired: true,
      });
    }
    
    // Get previous report for comparison if this is a re-analysis
    let previousReport = null;
    let comparison = null;
    
    if (userId && projectId) {
      previousReport = await getPreviousReportByProjectId(projectId, userId);
      if (previousReport && previousReport.full_report_json) {
        comparison = revenueBrain.compareReports(
          previousReport.full_report_json as any,
          fullReport
        );
      }
    }
    
    // If user is authenticated, save project and report
    if (userId) {
      let project;

      if (projectId) {
        project = await getProjectById(projectId, userId);
      }

      if (!project) {
        project = await createProject(userId, input.product_name, input as SaaSInput);
      }

      // Save report first - credit deduction only after success (Part 8)
      const savedReport = await saveReport(userId, project.id, fullReport);

      // Credit increment after successful save
      if (!projectId) {
        await incrementProjectsCount(userId);
        await incrementReportCount(userId);
      } else if (isReanalysis) {
        await incrementReanalysisCount(userId);
      }

      // Part 3: Percentile engine - update project_rankings and analysis_reports
      const score = fullReport.score?.total_score ?? 0;
      const niche = (project as { niche?: string | null }).niche ?? null;
      const { percentile } = await upsertProjectRanking(project.id, score, niche);
      await updateReportPercentile(savedReport.id, percentile, niche);

      // Aggregate insights for data intelligence (Part 2)
      const prevReport = previousReport?.full_report_json as { score?: { total_score?: number } } | undefined;
      const prevScore = prevReport?.score?.total_score;
      await aggregateInsights(fullReport, project.id, prevScore);

      const subscription = await getSubscriptionByUserId(userId);
      const hasAccess = subscription?.status === 'active';
      
      if (hasAccess) {
        return NextResponse.json({
          report: fullReport,
          projectId: project.id,
          reportId: savedReport.id,
          version: savedReport.version,
          hasAccess: true,
          comparison: comparison || undefined,
        });
      } else {
        // Return preview
        const previewReport = revenueBrain.generatePreviewReport(fullReport);
        return NextResponse.json({
          report: previewReport,
          projectId: project.id,
          reportId: savedReport.id,
          version: savedReport.version,
          hasAccess: false,
          comparison: comparison || undefined,
        });
      }
    } else {
      // No auth - return preview only; rate limit + record attempt (Part 6)
      await incrementRateLimitAttempt(clientIp);
      await recordFreeAnalysisAttempt(hashIp(clientIp)).catch(() => {});
      const previewReport = revenueBrain.generatePreviewReport(fullReport);
      return NextResponse.json({
        report: previewReport,
        hasAccess: false,
      });
    }
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze' },
      { status: 500 }
    );
  }
}

function mergeScrapedIntoDescription(
  description: string,
  scraped: ScrapedWebsite
): string {
  const parts = [description];
  if (scraped.hero_copy) parts.push(`Website hero: ${scraped.hero_copy}`);
  if (scraped.pricing_section) parts.push(`Pricing section: ${scraped.pricing_section}`);
  if (scraped.h1?.length) parts.push(`H1: ${scraped.h1.join(' | ')}`);
  if (scraped.cta_buttons?.length) parts.push(`CTAs: ${scraped.cta_buttons.join(', ')}`);
  return parts.join('\n\n');
}

function isValidSaaSInput(input: any): input is SaaSInput {
  return (
    typeof input === 'object' &&
    typeof input.product_name === 'string' &&
    typeof input.description === 'string' &&
    typeof input.target_user_guess === 'string' &&
    typeof input.pricing_model === 'string' &&
    typeof input.monthly_price === 'number' &&
    typeof input.website_url === 'string' &&
    Array.isArray(input.feature_list) &&
    Array.isArray(input.competitors)
  );
}

