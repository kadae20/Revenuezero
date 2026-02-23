import { SaaSInput, PositioningOutput } from '@/types';

export class PositioningAgent {
  analyze(input: SaaSInput): PositioningOutput {
    // Outcome Promise (0-10)
    const outcomePromise = this.scoreOutcomePromise(input.description);
    
    // Unique Mechanism (0-5)
    const uniqueMechanism = this.scoreUniqueMechanism(input.description, input.competitors);
    
    // Differentiation (0-5)
    const differentiation = this.scoreDifferentiation(input.description, input.competitors);
    
    // Category Clarity (0-5)
    const categoryClarity = this.scoreCategoryClarity(input.description);
    
    // Generate outputs
    const positioningRewrite = this.generatePositioningRewrite(input);
    const uniqueValueProp = this.generateUniqueValueProp(input);
    const categoryDefinition = this.generateCategoryDefinition(input);
    const differentiationAnalysis = this.generateDifferentiationAnalysis(input);

    return {
      outcome_promise: outcomePromise,
      unique_mechanism: uniqueMechanism,
      differentiation: differentiation,
      category_clarity: categoryClarity,
      positioning_rewrite: positioningRewrite,
      unique_value_prop: uniqueValueProp,
      category_definition: categoryDefinition,
      differentiation_analysis: differentiationAnalysis,
    };
  }

  private scoreOutcomePromise(description: string): number {
    const lower = description.toLowerCase();
    const hasSpecificOutcome = /(increase|decrease|save|reduce|eliminate|achieve|reach|get)/i.test(lower);
    const hasQuantifiable = /(\$|percent|%|hours|minutes|days|times|faster|more|less)/i.test(lower);
    const hasTimeframe = /(in [0-9]|within|by|before|after|daily|weekly|monthly)/i.test(lower);
    const hasEmotionalOutcome = /(confidence|peace|freedom|control|clarity|success)/i.test(lower);
    const hasAvoidanceOutcome = /(avoid|prevent|stop|eliminate|never|no more)/i.test(lower);
    
    let score = 0;
    if (hasSpecificOutcome) score += 2;
    if (hasQuantifiable) score += 3;
    if (hasTimeframe) score += 2;
    if (hasEmotionalOutcome || hasAvoidanceOutcome) score += 3;
    
    return Math.min(10, score);
  }

  private scoreUniqueMechanism(description: string, competitors: string[]): number {
    const lower = description.toLowerCase();
    const hasUniqueMethod = /(using|via|through|with|method|approach|system|way)/i.test(lower);
    const hasSpecificTech = /(ai|ml|algorithm|automation|integration|api|workflow)/i.test(lower);
    const hasProcess = /(step|process|flow|sequence|pipeline)/i.test(lower);
    
    let score = 0;
    if (hasUniqueMethod) score += 2;
    if (hasSpecificTech) score += 1.5;
    if (hasProcess) score += 1.5;
    
    // If competitors are similar, reduce score
    if (competitors.length > 0 && competitors.some(c => 
      description.toLowerCase().includes(c.toLowerCase()) || 
      c.toLowerCase().includes(description.toLowerCase().split(' ')[0])
    )) {
      score -= 1;
    }
    
    return Math.max(0, Math.min(5, Math.round(score * 10) / 10));
  }

  private scoreDifferentiation(description: string, competitors: string[]): number {
    if (competitors.length === 0) return 2.5; // Can't assess without competitors
    
    const descWords = new Set(description.toLowerCase().split(/\s+/));
    let similarityCount = 0;
    
    competitors.forEach(comp => {
      const compWords = comp.toLowerCase().split(/\s+/);
      const overlap = compWords.filter(w => descWords.has(w) && w.length > 3).length;
      if (overlap > 2) similarityCount++;
    });
    
    const similarityRatio = similarityCount / competitors.length;
    let score = 5;
    score -= similarityRatio * 3;
    
    return Math.max(0, Math.round(score * 10) / 10);
  }

  private scoreCategoryClarity(description: string): number {
    const lower = description.toLowerCase();
    const hasCategory = /(platform|tool|software|app|system|service|solution)/i.test(lower);
    const hasSpecificCategory = /(crm|analytics|automation|dashboard|saas|marketplace|api)/i.test(lower);
    const isVague = /(all-in-one|complete|comprehensive|everything|universal)/i.test(lower);
    
    let score = 0;
    if (hasCategory) score += 2;
    if (hasSpecificCategory) score += 2;
    if (!isVague) score += 1;
    
    return Math.min(5, score);
  }

  private generatePositioningRewrite(input: SaaSInput): string {
    return `For ${input.target_user_guess} who ${this.extractProblem(input.description)}, ${input.product_name} is the ${this.extractCategory(input.description)} that ${this.extractOutcome(input.description)}. Unlike ${input.competitors.length > 0 ? input.competitors[0] : 'other solutions'}, we ${this.extractUniqueMechanism(input.description)}.`;
  }

  private generateUniqueValueProp(input: SaaSInput): string {
    if (input.competitors.length === 0) {
      return `Your unique mechanism isn't clear. Define: What specific method/approach/technology do you use that others don't? This is your defensible moat.`;
    }
    
    return `Your unique mechanism: [How you solve the problem differently]. This matters because [why this approach is better]. Your competitors do [what they do], but you do [what you do uniquely].`;
  }

  private generateCategoryDefinition(input: SaaSInput): string {
    const desc = input.description.toLowerCase();
    if (desc.includes('revenue') || desc.includes('sales')) {
      return `Revenue Intelligence Platform - not just analytics, but actionable diagnosis of why revenue isn't happening.`;
    }
    
    if (desc.includes('productivity') || desc.includes('automate')) {
      return `[Specific] Automation Tool - not generic productivity, but [specific task] automation for [specific user].`;
    }
    
    return `Define your category narrowly. Instead of "productivity tool," be "revenue diagnosis platform" or "micro-saas growth system." Category clarity = faster customer understanding.`;
  }

  private generateDifferentiationAnalysis(input: SaaSInput): string {
    if (input.competitors.length === 0) {
      return `No competitors listed. Either: 1) Market doesn't exist (bad), 2) You haven't researched (worse), or 3) You're truly first (rare). Research competitors immediately.`;
    }
    
    return `You compete with ${input.competitors.length} solutions. Differentiation required. Your edge: [specific differentiator]. If you can't articulate this in one sentence, you're a commodity.`;
  }

  private extractProblem(description: string): string {
    const lower = description.toLowerCase();
    if (lower.includes('struggle') || lower.includes('problem')) {
      return 'struggle with [specific problem]';
    }
    return 'need [outcome]';
  }

  private extractCategory(description: string): string {
    const lower = description.toLowerCase();
    if (lower.includes('platform')) return 'platform';
    if (lower.includes('tool')) return 'tool';
    if (lower.includes('system')) return 'system';
    return 'solution';
  }

  private extractOutcome(description: string): string {
    const lower = description.toLowerCase();
    if (lower.includes('increase') || lower.includes('grow')) return 'increases [metric]';
    if (lower.includes('save') || lower.includes('reduce')) return 'saves [time/money]';
    if (lower.includes('automate')) return 'automates [task]';
    return 'delivers [outcome]';
  }

  private extractUniqueMechanism(description: string): string {
    return 'use [unique method] to achieve [outcome]';
  }
}

