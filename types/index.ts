// Scraped website content (from websiteScraper)
export interface ScrapedWebsite {
  title: string;
  h1: string[];
  h2: string[];
  hero_copy: string;
  pricing_section: string;
  cta_buttons: string[];
  testimonials: string[];
  raw_text_sample: string;
  success: boolean;
  error?: string;
}

// Core SaaS Input Types
export interface SaaSInput {
  product_name: string;
  description: string;
  target_user_guess: string;
  pricing_model: string;
  monthly_price: number;
  website_url: string;
  feature_list: string[];
  competitors: string[];
  /** Enriched from website scrape when website_url exists */
  scraped_website?: ScrapedWebsite;
}

// Agent Output Types
export interface MarketClarityOutput {
  icp_specificity: number; // 0-10
  problem_clarity: number; // 0-5
  market_narrowness: number; // 0-5
  language_specificity: number; // 0-5
  niche_rewrite: string;
  problem_statement: string;
  target_icp: string;
  market_analysis: string;
}

export interface PositioningOutput {
  outcome_promise: number; // 0-10
  unique_mechanism: number; // 0-5
  differentiation: number; // 0-5
  category_clarity: number; // 0-5
  positioning_rewrite: string;
  unique_value_prop: string;
  category_definition: string;
  differentiation_analysis: string;
}

export interface PricingOutput {
  price_value_alignment: number; // 0-5
  tier_clarity: number; // 0-5
  psychological_pricing: number; // 0-5
  pricing_feedback: string;
  recommended_price: number;
  pricing_strategy: string;
  tier_recommendations: string;
}

export interface ConversionOutput {
  headline_clarity: number; // 0-5
  cta_strength: number; // 0-5
  social_proof: number; // 0-5
  risk_reversal: number; // 0-5
  conversion_killers: string[];
  headline_rewrite: string;
  cta_rewrite: string;
  social_proof_recommendations: string;
  risk_reversal_tactics: string;
}

export interface TrafficOutput {
  acquisition_channel: number; // 0-5
  first_10_user_plan: number; // 0-5
  repeatable_loop: number; // 0-5
  channel_analysis: string;
  first_10_plan: string;
  acquisition_strategy: string;
  growth_loop: string;
}

export interface ActionPlanOutput {
  priority_actions: Array<{
    action: string;
    priority: number;
    timeframe: string;
    impact: string;
  }>;
  quick_wins: string[];
  strategic_moves: string[];
  timeline: string;
}

// Advanced scoring interpretation (Part 4)
export type RiskLevel = 'Low' | 'Medium' | 'High';
export interface AdvancedScoreMetadata {
  risk_level: RiskLevel;
  revenue_leakage_indicator: string;
  confidence_score: number; // 0-100
}

// Scoring Types
export interface CategoryScore {
  category: string;
  raw_score: number;
  weighted_score: number;
  max_possible: number;
  breakdown: Record<string, number>;
}

export interface RevenueScore {
  total_score: number; // 0-100
  interpretation: 'Guessing' | 'Building not selling' | 'Close but unclear' | 'Revenue ready' | 'Aggressive growth mode';
  /** Advanced interpretation (Part 4) */
  advanced?: AdvancedScoreMetadata;
  category_scores: CategoryScore[];
  improvement_priorities: Array<{
    category: string;
    priority: number;
    reason: string;
  }>;
}

// Full Report Type
export interface RevenueReport {
  id?: string;
  user_id?: string;
  project_id?: string;
  input: SaaSInput;
  market_clarity: MarketClarityOutput;
  positioning: PositioningOutput;
  pricing: PricingOutput;
  conversion: ConversionOutput;
  traffic: TrafficOutput;
  action_plan: ActionPlanOutput;
  score: RevenueScore;
  created_at?: string;
}

// Database Types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  input: SaaSInput;
  website_url?: string | null;
  niche?: string | null;
  slug?: string | null;
  is_public?: boolean;
  created_at: string;
}

export interface AnalysisReport {
  id: string;
  user_id: string;
  project_id: string;
  version: number;
  full_report_json: RevenueReport;
  score: number;
  category_breakdown: Record<string, number>;
  created_at: string;
}

export interface ScoreComparison {
  previous_score: number;
  current_score: number;
  delta: number;
  category_deltas: Array<{
    category: string;
    previous: number;
    current: number;
    delta: number;
  }>;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan: PlanType;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  reports_used: number;
  reanalyses_used: number;
  analyses_used_this_month?: number;
  projects_count?: number;
  billing_cycle_start?: string | null;
  billing_cycle_end?: string | null;
  current_period_end: string | null;
  created_at: string;
}

/** New subscription tiers: monthly limits */
export const SUBSCRIPTION_TIERS = {
  starter: {
    maxProjects: 1,
    analysesPerMonth: 3,
    price: 19,
    features: ['Basic insights'],
  },
  growth: {
    maxProjects: 3,
    analysesPerMonth: 10,
    price: 49,
    features: ['Iteration intelligence', 'Advanced scoring', 'Export PDF'],
  },
  launch: {
    maxProjects: -1,
    analysesPerMonth: -1,
    price: 99,
    features: ['Unlimited projects', 'Unlimited analyses', 'Public profile', 'Priority analysis'],
  },
} as const;

export const PLAN_LIMITS: Record<PlanType, { reports: number; reanalyses: number; maxProjects: number; analysesPerMonth: number }> = {
  starter: { reports: 1, reanalyses: 0, maxProjects: 1, analysesPerMonth: 3 },
  growth: { reports: 1, reanalyses: 1, maxProjects: 3, analysesPerMonth: 10 },
  launch_mode: { reports: 1, reanalyses: 3, maxProjects: -1, analysesPerMonth: -1 },
  launch: { reports: -1, reanalyses: -1, maxProjects: -1, analysesPerMonth: -1 },
};

// Stripe Types
export interface StripeCheckoutSession {
  id: string;
  url: string;
}

export type PlanType = 'starter' | 'growth' | 'launch_mode' | 'launch';

export const PLAN_PRICES: Record<PlanType, number> = {
  starter: 19,
  growth: 49,
  launch_mode: 79,
  launch: 99,
};

