import { SaaSInput, MarketClarityOutput } from '@/types';

export class MarketClarityAgent {
  analyze(input: SaaSInput): MarketClarityOutput {
    // ICP Specificity (0-10)
    const icpSpecificity = this.scoreICPSpecificity(input.target_user_guess);
    
    // Problem Clarity (0-5)
    const problemClarity = this.scoreProblemClarity(input.description);
    
    // Market Narrowness (0-5)
    const marketNarrowness = this.scoreMarketNarrowness(input.target_user_guess, input.competitors);
    
    // Language Specificity (0-5)
    const languageSpecificity = this.scoreLanguageSpecificity(input.description, input.target_user_guess);
    
    // Generate outputs
    const nicheRewrite = this.generateNicheRewrite(input);
    const problemStatement = this.generateProblemStatement(input);
    const targetICP = this.generateTargetICP(input);
    const marketAnalysis = this.generateMarketAnalysis(input);

    return {
      icp_specificity: icpSpecificity,
      problem_clarity: problemClarity,
      market_narrowness: marketNarrowness,
      language_specificity: languageSpecificity,
      niche_rewrite: nicheRewrite,
      problem_statement: problemStatement,
      target_icp: targetICP,
      market_analysis: marketAnalysis,
    };
  }

  private scoreICPSpecificity(targetUser: string): number {
    const lower = targetUser.toLowerCase();
    const hasSpecificRole = /(founder|ceo|manager|director|developer|designer|marketer)/i.test(lower);
    const hasSpecificIndustry = /(saas|ecommerce|healthcare|finance|education|real estate|legal)/i.test(lower);
    const hasSpecificSize = /(startup|small business|enterprise|solo|team|company)/i.test(lower);
    const hasSpecificPain = /(struggling|problem|challenge|issue|pain|frustrated)/i.test(lower);
    
    let score = 0;
    if (hasSpecificRole) score += 3;
    if (hasSpecificIndustry) score += 3;
    if (hasSpecificSize) score += 2;
    if (hasSpecificPain) score += 2;
    
    return Math.min(10, score);
  }

  private scoreProblemClarity(description: string): number {
    const lower = description.toLowerCase();
    const hasProblem = /(problem|issue|challenge|pain|struggle|frustration|difficulty)/i.test(lower);
    const hasSpecificOutcome = /(save|increase|reduce|improve|automate|eliminate)/i.test(lower);
    const hasQuantifiable = /(\$|percent|%|hours|minutes|days|times|faster)/i.test(lower);
    const hasEmotion = /(stress|overwhelm|waste|miss|lose|fail)/i.test(lower);
    
    let score = 0;
    if (hasProblem) score += 1.5;
    if (hasSpecificOutcome) score += 1.5;
    if (hasQuantifiable) score += 1;
    if (hasEmotion) score += 1;
    
    return Math.min(5, Math.round(score * 10) / 10);
  }

  private scoreMarketNarrowness(targetUser: string, competitors: string[]): number {
    const isGeneric = /(everyone|anyone|all|business|people|users)/i.test(targetUser.toLowerCase());
    const competitorCount = competitors.length;
    
    let score = 5;
    if (isGeneric) score -= 2;
    if (competitorCount > 10) score -= 1.5;
    if (competitorCount > 5) score -= 1;
    
    return Math.max(0, Math.round(score * 10) / 10);
  }

  private scoreLanguageSpecificity(description: string, targetUser: string): number {
    const combined = `${description} ${targetUser}`.toLowerCase();
    const hasJargon = /(solution|platform|tool|system|software|app)/i.test(combined);
    const hasVagueWords = /(better|improve|enhance|optimize|streamline|leverage)/i.test(combined);
    const hasSpecificTerms = /(revenue|conversion|retention|churn|mrr|arr|cac|ltv)/i.test(combined);
    const hasActionVerbs = /(ship|launch|scale|grow|acquire|convert|retain)/i.test(combined);
    
    let score = 0;
    if (!hasJargon) score += 1.5;
    if (!hasVagueWords) score += 1.5;
    if (hasSpecificTerms) score += 1;
    if (hasActionVerbs) score += 1;
    
    return Math.min(5, Math.round(score * 10) / 10);
  }

  private generateNicheRewrite(input: SaaSInput): string {
    const generic = input.target_user_guess.toLowerCase();
    if (generic.includes('everyone') || generic.includes('anyone') || generic.includes('all')) {
      return `Micro SaaS founders stuck at $0-$500 MRR who have built a product but can't get paying customers. Specifically: solo founders or 2-person teams, technical background, launched in last 6 months, have 0-10 paying customers, spending more time building than selling.`;
    }
    
    if (generic.includes('startup') || generic.includes('founder')) {
      return `${input.target_user_guess} who are pre-revenue or under $1K MRR, specifically struggling with customer acquisition and conversion.`;
    }
    
    return `${input.target_user_guess} who are actively struggling with [specific problem from description] and have tried [competitor solutions] without success.`;
  }

  private generateProblemStatement(input: SaaSInput): string {
    const desc = input.description.toLowerCase();
    if (desc.includes('productivity') || desc.includes('automate')) {
      return `Wasting [X hours/days] per [timeframe] on [repetitive task] that could be automated, leading to [specific cost: missed revenue, burnout, errors].`;
    }
    
    if (desc.includes('revenue') || desc.includes('sales') || desc.includes('growth')) {
      return `Stuck at $0 revenue despite having a product because [specific blocker: no clear positioning, wrong pricing, no traffic strategy].`;
    }
    
    return `[Target user] struggles with [core problem] which costs them [quantifiable impact] and prevents them from [desired outcome].`;
  }

  private generateTargetICP(input: SaaSInput): string {
    return `Primary: ${input.target_user_guess} who [specific behavior/pain point]. Secondary: [related but narrower segment]. Exclude: [who this is NOT for].`;
  }

  private generateMarketAnalysis(input: SaaSInput): string {
    const competitorCount = input.competitors.length;
    if (competitorCount === 0) {
      return `No direct competitors identified. This suggests either: 1) Market doesn't exist, 2) Problem isn't painful enough, or 3) You haven't researched. High risk.`;
    }
    
    if (competitorCount > 10) {
      return `Highly competitive market with ${competitorCount}+ competitors. Differentiation is critical. Your unique mechanism must be clear and defensible.`;
    }
    
    return `Moderate competition (${competitorCount} competitors). Market exists but positioning and execution will determine success. Focus on specific niche within this market.`;
  }
}

