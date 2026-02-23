import {
  RevenueScore,
  CategoryScore,
  AdvancedScoreMetadata,
  RiskLevel,
  MarketClarityOutput,
  PositioningOutput,
  PricingOutput,
  ConversionOutput,
  TrafficOutput,
} from '@/types';

interface AgentOutputs {
  marketClarity: MarketClarityOutput;
  positioning: PositioningOutput;
  pricing: PricingOutput;
  conversion: ConversionOutput;
  traffic: TrafficOutput;
}

export function calculateRevenueScore(agentOutputs: AgentOutputs): RevenueScore {
  // 1. Niche Clarity (25%)
  const nicheClarityRaw =
    agentOutputs.marketClarity.icp_specificity +
    agentOutputs.marketClarity.problem_clarity +
    agentOutputs.marketClarity.market_narrowness +
    agentOutputs.marketClarity.language_specificity;
  const nicheClarityMax = 25;
  const nicheClarityWeighted = (nicheClarityRaw / nicheClarityMax) * 25;

  const nicheClarityBreakdown = {
    icp_specificity: agentOutputs.marketClarity.icp_specificity,
    problem_clarity: agentOutputs.marketClarity.problem_clarity,
    market_narrowness: agentOutputs.marketClarity.market_narrowness,
    language_specificity: agentOutputs.marketClarity.language_specificity,
  };

  // 2. Positioning Strength (25%)
  const positioningRaw =
    agentOutputs.positioning.outcome_promise +
    agentOutputs.positioning.unique_mechanism +
    agentOutputs.positioning.differentiation +
    agentOutputs.positioning.category_clarity;
  const positioningMax = 25;
  const positioningWeighted = (positioningRaw / positioningMax) * 25;

  const positioningBreakdown = {
    outcome_promise: agentOutputs.positioning.outcome_promise,
    unique_mechanism: agentOutputs.positioning.unique_mechanism,
    differentiation: agentOutputs.positioning.differentiation,
    category_clarity: agentOutputs.positioning.category_clarity,
  };

  // 3. Pricing Fit (15%)
  const pricingRaw =
    agentOutputs.pricing.price_value_alignment +
    agentOutputs.pricing.tier_clarity +
    agentOutputs.pricing.psychological_pricing;
  const pricingMax = 15;
  const pricingWeighted = (pricingRaw / pricingMax) * 15;

  const pricingBreakdown = {
    price_value_alignment: agentOutputs.pricing.price_value_alignment,
    tier_clarity: agentOutputs.pricing.tier_clarity,
    psychological_pricing: agentOutputs.pricing.psychological_pricing,
  };

  // 4. Conversion Strength (20%)
  const conversionRaw =
    agentOutputs.conversion.headline_clarity +
    agentOutputs.conversion.cta_strength +
    agentOutputs.conversion.social_proof +
    agentOutputs.conversion.risk_reversal;
  const conversionMax = 20;
  const conversionWeighted = (conversionRaw / conversionMax) * 20;

  const conversionBreakdown = {
    headline_clarity: agentOutputs.conversion.headline_clarity,
    cta_strength: agentOutputs.conversion.cta_strength,
    social_proof: agentOutputs.conversion.social_proof,
    risk_reversal: agentOutputs.conversion.risk_reversal,
  };

  // 5. Traffic Clarity (15%)
  const trafficRaw =
    agentOutputs.traffic.acquisition_channel +
    agentOutputs.traffic.first_10_user_plan +
    agentOutputs.traffic.repeatable_loop;
  const trafficMax = 15;
  const trafficWeighted = (trafficRaw / trafficMax) * 15;

  const trafficBreakdown = {
    acquisition_channel: agentOutputs.traffic.acquisition_channel,
    first_10_user_plan: agentOutputs.traffic.first_10_user_plan,
    repeatable_loop: agentOutputs.traffic.repeatable_loop,
  };

  // Total Score
  const totalScore = Math.round(
    nicheClarityWeighted +
    positioningWeighted +
    pricingWeighted +
    conversionWeighted +
    trafficWeighted
  );

  // Interpretation
  let interpretation: RevenueScore['interpretation'];
  if (totalScore < 40) {
    interpretation = 'Guessing';
  } else if (totalScore < 60) {
    interpretation = 'Building not selling';
  } else if (totalScore < 80) {
    interpretation = 'Close but unclear';
  } else if (totalScore < 90) {
    interpretation = 'Revenue ready';
  } else {
    interpretation = 'Aggressive growth mode';
  }

  // Category Scores
  const categoryScores: CategoryScore[] = [
    {
      category: 'Niche Clarity',
      raw_score: nicheClarityRaw,
      weighted_score: nicheClarityWeighted,
      max_possible: 25,
      breakdown: nicheClarityBreakdown,
    },
    {
      category: 'Positioning Strength',
      raw_score: positioningRaw,
      weighted_score: positioningWeighted,
      max_possible: 25,
      breakdown: positioningBreakdown,
    },
    {
      category: 'Pricing Fit',
      raw_score: pricingRaw,
      weighted_score: pricingWeighted,
      max_possible: 15,
      breakdown: pricingBreakdown,
    },
    {
      category: 'Conversion Strength',
      raw_score: conversionRaw,
      weighted_score: conversionWeighted,
      max_possible: 20,
      breakdown: conversionBreakdown,
    },
    {
      category: 'Traffic Clarity',
      raw_score: trafficRaw,
      weighted_score: trafficWeighted,
      max_possible: 15,
      breakdown: trafficBreakdown,
    },
  ];

  // Advanced metadata (Part 4)
  const advanced = computeAdvancedMetadata(totalScore, categoryScores);

  // Improvement Priorities (sorted by gap from max)
  const improvementPriorities = categoryScores
    .map((cat) => ({
      category: cat.category,
      priority: cat.max_possible - cat.weighted_score,
      reason: getPriorityReason(cat.category, cat.weighted_score, cat.max_possible),
    }))
    .sort((a, b) => b.priority - a.priority);

  return {
    total_score: totalScore,
    interpretation,
    advanced,
    category_scores: categoryScores,
    improvement_priorities: improvementPriorities,
  };
}

function computeAdvancedMetadata(
  totalScore: number,
  categoryScores: CategoryScore[]
): AdvancedScoreMetadata {
  const worstCat = [...categoryScores].sort(
    (a, b) => a.weighted_score - b.weighted_score
  )[0];
  const avgGap = categoryScores.reduce(
    (acc, c) => acc + (c.max_possible - c.weighted_score),
    0
  ) / categoryScores.length;
  const pricingScore =
    categoryScores.find((c) => c.category === 'Pricing Fit')?.weighted_score ?? 15;
  const conversionScore =
    categoryScores.find((c) => c.category === 'Conversion Strength')?.weighted_score ?? 20;
  const hasPricingIssue = pricingScore < 8;
  const hasConversionIssue = conversionScore < 10;

  let risk_level: RiskLevel = 'Low';
  if (totalScore < 40 || avgGap > 12) risk_level = 'High';
  else if (totalScore < 60 || avgGap > 8) risk_level = 'Medium';

  let revenue_leakage = 'Minimal';
  if (totalScore < 40) revenue_leakage = 'Severe - multiple blockers';
  else if (totalScore < 60) revenue_leakage = 'Significant - positioning/pricing gaps';
  else if (totalScore < 80) revenue_leakage = 'Moderate - optimization needed';
  else if (worstCat && worstCat.weighted_score < worstCat.max_possible * 0.6) {
    revenue_leakage = `Leak in ${worstCat.category}`;
  }

  const confidence_score = Math.min(
    95,
    Math.round(
      70 +
        (totalScore / 100) * 15 +
        (hasPricingIssue ? -5 : 0) +
        (hasConversionIssue ? -5 : 0)
    )
  );

  return {
    risk_level,
    revenue_leakage_indicator: revenue_leakage,
    confidence_score: Math.max(50, confidence_score),
  };
}

function getPriorityReason(
  category: string,
  weightedScore: number,
  maxPossible: number
): string {
  const gap = maxPossible - weightedScore;
  const percentage = (weightedScore / maxPossible) * 100;

  if (percentage < 50) {
    return `${category} is critically weak. This is blocking revenue.`;
  } else if (percentage < 70) {
    return `${category} needs significant improvement to unlock revenue.`;
  } else if (percentage < 85) {
    return `${category} is decent but optimization will accelerate growth.`;
  } else {
    return `${category} is strong. Focus elsewhere.`;
  }
}

