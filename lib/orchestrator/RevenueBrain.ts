import { SaaSInput, RevenueReport } from '@/types';
import { MarketClarityAgent } from '@/lib/agents/MarketClarityAgent';
import { PositioningAgent } from '@/lib/agents/PositioningAgent';
import { PricingAgent } from '@/lib/agents/PricingAgent';
import { ConversionAgent } from '@/lib/agents/ConversionAgent';
import { TrafficAgent } from '@/lib/agents/TrafficAgent';
import { ActionPlanAgent } from '@/lib/agents/ActionPlanAgent';
import { calculateRevenueScore } from '@/lib/scoring/revenueScore';

export class RevenueBrain {
  async analyze(input: SaaSInput): Promise<RevenueReport> {
    // Initialize agents
    const marketClarityAgent = new MarketClarityAgent();
    const positioningAgent = new PositioningAgent();
    const pricingAgent = new PricingAgent();
    const conversionAgent = new ConversionAgent();
    const trafficAgent = new TrafficAgent();
    const actionPlanAgent = new ActionPlanAgent();

    // Run agents sequentially
    const marketClarity = marketClarityAgent.analyze(input);
    const positioning = positioningAgent.analyze(input);
    const pricing = pricingAgent.analyze(input);
    const conversion = conversionAgent.analyze(input);
    const traffic = trafficAgent.analyze(input);

    // Calculate score
    const score = calculateRevenueScore({
      marketClarity,
      positioning,
      pricing,
      conversion,
      traffic,
    });

    // Generate action plan
    const actionPlan = actionPlanAgent.generate(
      input,
      score,
      marketClarity,
      positioning,
      pricing,
      conversion,
      traffic
    );

    // Assemble full report
    const report: RevenueReport = {
      input,
      market_clarity: marketClarity,
      positioning,
      pricing,
      conversion,
      traffic,
      action_plan: actionPlan,
      score,
    };

    return report;
  }

  generatePreviewReport(report: RevenueReport): Partial<RevenueReport> {
    // Show only top 2 category scores (worst performers)
    const sortedCategories = [...report.score.category_scores].sort(
      (a, b) => a.weighted_score - b.weighted_score
    );
    const top2Categories = sortedCategories.slice(0, 2);
    
    // Get top 3 revenue killers from conversion_killers
    const top3Killers = report.conversion.conversion_killers.slice(0, 3);
    
    // Create limited category scores array
    const limitedCategoryScores = report.score.category_scores.map((cat) => {
      const isVisible = top2Categories.some((c) => c.category === cat.category);
      return {
        ...cat,
        // Only show breakdown for visible categories
        breakdown: isVisible ? cat.breakdown : {},
      };
    });
    
    return {
      input: report.input,
      score: {
        ...report.score,
        category_scores: limitedCategoryScores,
        // Show full improvement priorities (top 3)
        improvement_priorities: report.score.improvement_priorities.slice(0, 3),
      },
      // Show only top 3 conversion killers
      conversion: {
        ...report.conversion,
        conversion_killers: top3Killers,
        headline_rewrite: '[Full analysis locked]',
        cta_rewrite: '[Full analysis locked]',
        social_proof_recommendations: '[Full analysis locked]',
        risk_reversal_tactics: '[Full analysis locked]',
      },
      // Blur everything else
      market_clarity: {
        ...report.market_clarity,
        niche_rewrite: '[Full analysis locked]',
        problem_statement: '[Full analysis locked]',
        target_icp: '[Full analysis locked]',
        market_analysis: '[Full analysis locked]',
      },
      positioning: {
        ...report.positioning,
        positioning_rewrite: '[Full analysis locked]',
        unique_value_prop: '[Full analysis locked]',
        category_definition: '[Full analysis locked]',
        differentiation_analysis: '[Full analysis locked]',
      },
      pricing: {
        ...report.pricing,
        pricing_feedback: '[Full analysis locked]',
        pricing_strategy: '[Full analysis locked]',
        tier_recommendations: '[Full analysis locked]',
      },
      traffic: {
        ...report.traffic,
        channel_analysis: '[Full analysis locked]',
        first_10_plan: '[Full analysis locked]',
        acquisition_strategy: '[Full analysis locked]',
        growth_loop: '[Full analysis locked]',
      },
      action_plan: {
        priority_actions: [],
        quick_wins: [],
        strategic_moves: [],
        timeline: '[Full analysis locked]',
      },
    };
  }
  
  compareReports(previous: RevenueReport, current: RevenueReport) {
    const categoryDeltas = current.score.category_scores.map((currentCat) => {
      const previousCat = previous.score.category_scores.find(
        (c) => c.category === currentCat.category
      );
      return {
        category: currentCat.category,
        previous: previousCat?.weighted_score || 0,
        current: currentCat.weighted_score,
        delta: currentCat.weighted_score - (previousCat?.weighted_score || 0),
      };
    });
    
    return {
      previous_score: previous.score.total_score,
      current_score: current.score.total_score,
      delta: current.score.total_score - previous.score.total_score,
      category_deltas: categoryDeltas,
    };
  }
}

