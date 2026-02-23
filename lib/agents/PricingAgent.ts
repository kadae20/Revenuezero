import { SaaSInput, PricingOutput } from '@/types';

export class PricingAgent {
  analyze(input: SaaSInput): PricingOutput {
    // Price-to-Value Alignment (0-5)
    const priceValueAlignment = this.scorePriceValueAlignment(input);
    
    // Tier Clarity (0-5)
    const tierClarity = this.scoreTierClarity(input.pricing_model);
    
    // Psychological Pricing (0-5)
    const psychologicalPricing = this.scorePsychologicalPricing(input.monthly_price);
    
    // Generate outputs
    const pricingFeedback = this.generatePricingFeedback(input);
    const recommendedPrice = this.generateRecommendedPrice(input);
    const pricingStrategy = this.generatePricingStrategy(input);
    const tierRecommendations = this.generateTierRecommendations(input);

    return {
      price_value_alignment: priceValueAlignment,
      tier_clarity: tierClarity,
      psychological_pricing: psychologicalPricing,
      pricing_feedback: pricingFeedback,
      recommended_price: recommendedPrice,
      pricing_strategy: pricingStrategy,
      tier_recommendations: tierRecommendations,
    };
  }

  private scorePriceValueAlignment(input: SaaSInput): number {
    const price = input.monthly_price;
    const featureCount = input.feature_list.length;
    const hasComplexFeatures = input.feature_list.some(f => 
      /(ai|automation|integration|api|analytics|dashboard)/i.test(f)
    );
    
    let score = 2.5; // Base score
    
    // Price too low for value
    if (price < 10 && (featureCount > 5 || hasComplexFeatures)) {
      score -= 1.5;
    }
    
    // Price too high for simple product
    if (price > 100 && featureCount < 3 && !hasComplexFeatures) {
      score -= 1.5;
    }
    
    // Sweet spot: $19-$99 for most SaaS
    if (price >= 19 && price <= 99) {
      score += 1;
    }
    
    // Feature-value alignment
    if (featureCount >= 5 && price >= 29) {
      score += 0.5;
    }
    
    return Math.max(0, Math.min(5, Math.round(score * 10) / 10));
  }

  private scoreTierClarity(pricingModel: string): number {
    const lower = pricingModel.toLowerCase();
    
    if (lower.includes('free') && lower.includes('pro') && lower.includes('enterprise')) {
      return 5; // Clear 3-tier structure
    }
    
    if (lower.includes('starter') || lower.includes('basic') || lower.includes('pro') || lower.includes('growth')) {
      return 4; // Named tiers
    }
    
    if (lower.includes('tier') || lower.includes('plan') || lower.includes('package')) {
      return 3; // Mentions tiers but unclear
    }
    
    if (lower.includes('single') || lower.includes('one') || lower.includes('flat')) {
      return 2; // Single price point
    }
    
    return 1; // Unclear
  }

  private scorePsychologicalPricing(price: number): number {
    // Psychological pricing: $19, $29, $49, $79, $99, $149, $199
    const psychologicalPrices = [19, 29, 49, 79, 99, 149, 199, 299];
    
    if (psychologicalPrices.includes(price)) {
      return 5;
    }
    
    // Round numbers are okay
    if (price % 10 === 0 || price % 5 === 0) {
      return 3;
    }
    
    // Odd numbers like $17, $23 are less optimal
    if (price % 10 !== 0 && price % 5 !== 0) {
      return 2;
    }
    
    return 3;
  }

  private generatePricingFeedback(input: SaaSInput): string {
    const price = input.monthly_price;
    const featureCount = input.feature_list.length;
    
    if (price < 10) {
      return `Price too low ($${price}/mo). Signals low value. Micro SaaS founders often underprice to avoid sales friction, but this backfires. Minimum viable price: $19/mo.`;
    }
    
    if (price > 200) {
      return `Price high ($${price}/mo). Requires enterprise positioning, sales process, and proof. If you're pre-revenue, start lower and raise after validation.`;
    }
    
    if (price >= 19 && price <= 99) {
      return `Price in good range ($${price}/mo). This is the sweet spot for self-serve SaaS. Ensure your value prop justifies it.`;
    }
    
    return `Price at $${price}/mo. Consider psychological pricing ($19, $29, $49, $79, $99) for better conversion.`;
  }

  private generateRecommendedPrice(input: SaaSInput): number {
    const currentPrice = input.monthly_price;
    const featureCount = input.feature_list.length;
    const hasComplexFeatures = input.feature_list.some(f => 
      /(ai|automation|integration|api|analytics)/i.test(f)
    );
    
    // If price is reasonable, keep it
    if (currentPrice >= 19 && currentPrice <= 99) {
      // Round to nearest psychological price
      const psychologicalPrices = [19, 29, 49, 79, 99];
      return psychologicalPrices.reduce((prev, curr) => 
        Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice) ? curr : prev
      );
    }
    
    // Recommend based on features
    if (hasComplexFeatures && featureCount >= 5) {
      return 79;
    }
    
    if (featureCount >= 3) {
      return 49;
    }
    
    return 29;
  }

  private generatePricingStrategy(input: SaaSInput): string {
    const price = input.monthly_price;
    const model = input.pricing_model.toLowerCase();
    
    if (model.includes('free')) {
      return `Free tier strategy: Use free tier to acquire users, but ensure paid tier has clear upgrade path. Free users should hit limits that make paid tier obvious.`;
    }
    
    if (price < 20) {
      return `Low-price strategy: You're competing on price, not value. This is a race to the bottom. Raise price and improve positioning.`;
    }
    
    if (price >= 20 && price <= 99) {
      return `Self-serve SaaS pricing: Good range for impulse purchases and credit card signups. Focus on clear value prop and risk reversal (money-back guarantee).`;
    }
    
    return `Higher-price strategy: Requires sales process, demos, or trials. Not ideal for $0 revenue stage. Consider lower entry point with upgrade path.`;
  }

  private generateTierRecommendations(input: SaaSInput): string {
    const model = input.pricing_model.toLowerCase();
    
    if (model.includes('single') || model.includes('one') || model.includes('flat')) {
      return `Single price point: Consider adding Starter ($${Math.round(input.monthly_price * 0.6)}) and Growth ($${input.monthly_price}) tiers. Starter removes friction, Growth is your target.`;
    }
    
    if (model.includes('tier') || model.includes('plan')) {
      return `Multi-tier structure: Ensure tiers are clearly differentiated by usage/features, not just price. Each tier should have clear "next step" upgrade path.`;
    }
    
    return `Pricing model unclear. Recommended structure: Starter ($${Math.round(input.monthly_price * 0.6)}/mo) for early adopters, Growth ($${input.monthly_price}/mo) as main tier, Launch Mode ($${Math.round(input.monthly_price * 2)}/mo) for power users.`;
  }
}

