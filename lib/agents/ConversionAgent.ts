import { SaaSInput, ConversionOutput } from '@/types';

export class ConversionAgent {
  analyze(input: SaaSInput): ConversionOutput {
    // Headline Clarity (0-5)
    const headlineClarity = this.scoreHeadlineClarity(input);
    
    // CTA Strength (0-5)
    const ctaStrength = this.scoreCTAStrength(input);
    
    // Social Proof (0-5)
    const socialProof = this.scoreSocialProof(input);
    
    // Risk Reversal (0-5)
    const riskReversal = this.scoreRiskReversal(input);
    
    // Generate outputs
    const conversionKillers = this.identifyConversionKillers(input);
    const headlineRewrite = this.generateHeadlineRewrite(input);
    const ctaRewrite = this.generateCTARewrite(input);
    const socialProofRecommendations = this.generateSocialProofRecommendations(input);
    const riskReversalTactics = this.generateRiskReversalTactics(input);

    return {
      headline_clarity: headlineClarity,
      cta_strength: ctaStrength,
      social_proof: socialProof,
      risk_reversal: riskReversal,
      conversion_killers: conversionKillers,
      headline_rewrite: headlineRewrite,
      cta_rewrite: ctaRewrite,
      social_proof_recommendations: socialProofRecommendations,
      risk_reversal_tactics: riskReversalTactics,
    };
  }

  private scoreHeadlineClarity(input: SaaSInput): number {
    const name = input.product_name.toLowerCase();
    const desc = input.description.toLowerCase();
    const combined = `${name} ${desc}`;
    
    const hasOutcome = /(increase|save|reduce|eliminate|achieve|get)/i.test(combined);
    const hasSpecificBenefit = /(\$|percent|%|hours|minutes|times|faster)/i.test(combined);
    const hasTargetUser = /(for|help|enables|lets)/i.test(combined);
    const isVague = /(better|improve|enhance|optimize|solution|platform)/i.test(combined);
    
    let score = 0;
    if (hasOutcome) score += 1.5;
    if (hasSpecificBenefit) score += 1.5;
    if (hasTargetUser) score += 1;
    if (!isVague) score += 1;
    
    return Math.min(5, Math.round(score * 10) / 10);
  }

  private scoreCTAStrength(input: SaaSInput): number {
    // Can't assess CTA from input alone, but can infer from website
    const hasWebsite = input.website_url && input.website_url.length > 0;
    
    if (!hasWebsite) {
      return 1; // No website = no CTA
    }
    
    // Default: assume weak CTA if we can't see it
    return 2.5;
  }

  private scoreSocialProof(input: SaaSInput): number {
    // Can't assess from input, but can infer
    // If at $0 revenue, likely no social proof
    return 1; // Default low score for pre-revenue
  }

  private scoreRiskReversal(input: SaaSInput): number {
    // Can't assess from input, but can infer
    // Pre-revenue products typically lack risk reversal
    return 1.5; // Default low score
  }

  private identifyConversionKillers(input: SaaSInput): string[] {
    const killers: string[] = [];
    
    const desc = input.description.toLowerCase();
    const isVague = /(better|improve|enhance|optimize|solution|platform|tool)/i.test(desc);
    if (isVague) {
      killers.push('Vague headline that doesn\'t promise specific outcome');
    }
    
    if (!input.website_url || input.website_url.length === 0) {
      killers.push('No website or landing page');
    }
    
    const hasGenericTarget = /(everyone|anyone|all|business|people)/i.test(input.target_user_guess.toLowerCase());
    if (hasGenericTarget) {
      killers.push('Generic target audience - visitors can\'t self-identify');
    }
    
    const price = input.monthly_price;
    if (price > 50 && !desc.includes('enterprise') && !desc.includes('team')) {
      killers.push('High price without enterprise positioning or risk reversal');
    }
    
    if (input.feature_list.length === 0) {
      killers.push('No clear feature list or value demonstration');
    }
    
    return killers;
  }

  private generateHeadlineRewrite(input: SaaSInput): string {
    const target = input.target_user_guess;
    const price = input.monthly_price;
    
    if (input.description.toLowerCase().includes('revenue') || input.description.toLowerCase().includes('$0')) {
      return `Stop Shipping. Start Selling.`;
    }
    
    if (input.description.toLowerCase().includes('productivity') || input.description.toLowerCase().includes('automate')) {
      return `[Product Name] automates [specific task] for ${target}, saving [time/money].`;
    }
    
    return `[Product Name] helps ${target} [achieve specific outcome] in [timeframe].`;
  }

  private generateCTARewrite(input: SaaSInput): string {
    const price = input.monthly_price;
    
    if (price < 30) {
      return `Start Free Trial` or `Get Started - ${price}/mo`;
    }
    
    if (price >= 30 && price < 100) {
      return `Start Your Free Trial` or `Try Free for 14 Days`;
    }
    
    return `Book a Demo` or `See How It Works`;
  }

  private generateSocialProofRecommendations(input: SaaSInput): string {
    return `You're at $0 revenue, so traditional social proof (customer logos, testimonials) isn't available. Use: 1) Founder credibility (your background), 2) Early access badges ("Join 50 beta users"), 3) Transparent metrics ("Built by founder who [achievement]"), 4) Demo report (show what analysis looks like), 5) Money-back guarantee as proof of confidence.`;
  }

  private generateRiskReversalTactics(input: SaaSInput): string {
    const price = input.monthly_price;
    
    if (price < 50) {
      return `For $${price}/mo, offer: 1) 30-day money-back guarantee, 2) Cancel anytime, 3) No credit card required for trial, 4) "If this doesn't [outcome], we'll refund you." Risk reversal removes friction.`;
    }
    
    return `For $${price}/mo, offer: 1) 14-day free trial, 2) Money-back guarantee, 3) Demo call to show value before purchase, 4) Case study or example output. Higher price = higher risk perception = need stronger reversal.`;
  }
}

