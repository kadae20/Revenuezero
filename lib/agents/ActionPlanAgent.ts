import { SaaSInput, ActionPlanOutput, RevenueScore } from '@/types';

export class ActionPlanAgent {
  generate(
    input: SaaSInput,
    score: RevenueScore,
    marketClarity: any,
    positioning: any,
    pricing: any,
    conversion: any,
    traffic: any
  ): ActionPlanOutput {
    const priorityActions = this.generatePriorityActions(score, {
      marketClarity,
      positioning,
      pricing,
      conversion,
      traffic,
    });
    
    const quickWins = this.generateQuickWins(input, score);
    const strategicMoves = this.generateStrategicMoves(input, score);
    const timeline = this.generateTimeline(score);

    return {
      priority_actions: priorityActions,
      quick_wins: quickWins,
      strategic_moves: strategicMoves,
      timeline: timeline,
    };
  }

  private generatePriorityActions(
    score: RevenueScore,
    agents: any
  ): Array<{ action: string; priority: number; timeframe: string; impact: string }> {
    const actions: Array<{ action: string; priority: number; timeframe: string; impact: string }> = [];
    
    // Get top 3 improvement priorities
    const topPriorities = score.improvement_priorities.slice(0, 3);
    
    topPriorities.forEach((priority, index) => {
      const category = priority.category;
      let action = '';
      let timeframe = '';
      let impact = '';
      
      if (category === 'Niche Clarity') {
        action = `Rewrite target ICP: ${agents.marketClarity.niche_rewrite}. Update all copy to speak directly to this narrow segment.`;
        timeframe = 'Week 1';
        impact = 'High - Enables clear messaging and targeting';
      } else if (category === 'Positioning Strength') {
        action = `Rewrite positioning: ${agents.positioning.positioning_rewrite}. Update homepage headline and value prop.`;
        timeframe = 'Week 1';
        impact = 'High - Makes product purpose clear to visitors';
      } else if (category === 'Pricing Fit') {
        action = `Adjust pricing: ${agents.pricing.pricing_feedback}. Implement recommended price: $${agents.pricing.recommended_price}/mo.`;
        timeframe = 'Week 1-2';
        impact = 'Medium - Better price-to-value alignment';
      } else if (category === 'Conversion Strength') {
        action = `Fix conversion killers: ${agents.conversion.conversion_killers.join(', ')}. Implement headline: "${agents.conversion.headline_rewrite}" and CTA: "${agents.conversion.cta_rewrite}".`;
        timeframe = 'Week 2';
        impact = 'High - Directly impacts signup rate';
      } else if (category === 'Traffic Clarity') {
        action = `Define acquisition channel: ${agents.traffic.channel_analysis}. Execute first 10 user plan: ${agents.traffic.first_10_plan.substring(0, 100)}...`;
        timeframe = 'Week 1-4';
        impact = 'Critical - No traffic = no revenue';
      }
      
      actions.push({
        action,
        priority: index + 1,
        timeframe,
        impact,
      });
    });
    
    return actions;
  }

  private generateQuickWins(input: SaaSInput, score: RevenueScore): string[] {
    const wins: string[] = [];
    
    if (score.total_score < 60) {
      wins.push('Rewrite homepage headline to be outcome-focused (not feature-focused)');
      wins.push('Add risk reversal: 30-day money-back guarantee');
      wins.push('Narrow target audience from generic to specific ICP');
    }
    
    if (input.monthly_price < 19) {
      wins.push(`Raise price to $${Math.max(19, Math.round(input.monthly_price * 1.5))}/mo (signals value)`);
    }
    
    if (!input.website_url || input.website_url.length === 0) {
      wins.push('Create simple landing page with clear headline, value prop, and CTA');
    }
    
    wins.push('Add social proof placeholder: "Join 50+ founders using [Product]"');
    wins.push('Remove vague words from copy: "better", "improve", "optimize" → specific outcomes');
    
    return wins;
  }

  private generateStrategicMoves(input: SaaSInput, score: RevenueScore): string[] {
    const moves: string[] = [];
    
    if (score.total_score < 40) {
      moves.push('Pause building. Focus 100% on customer acquisition for 30 days.');
      moves.push('Interview 10 target users. Understand their actual problem, not your assumed problem.');
      moves.push('Redefine product positioning based on what users actually pay for.');
    } else if (score.total_score < 60) {
      moves.push('Stop adding features. Fix positioning and messaging first.');
      moves.push('Build in public. Share your journey on Twitter/X to attract early users.');
      moves.push('Create content that demonstrates value before asking for signup.');
    } else if (score.total_score < 80) {
      moves.push('Optimize conversion funnel: headline → value prop → CTA → pricing.');
      moves.push('Implement growth loop: make success shareable.');
      moves.push('Double down on one acquisition channel that works.');
    } else {
      moves.push('Scale acquisition channel that\'s working.');
      moves.push('Optimize pricing tiers based on user feedback.');
      moves.push('Build referral program to accelerate growth.');
    }
    
    return moves;
  }

  private generateTimeline(score: RevenueScore): string {
    if (score.total_score < 40) {
      return `Week 1-2: Fix positioning and ICP. Week 3-4: Manual outreach to first 10 users. Month 2: Iterate based on feedback. Month 3: Launch optimized version.`;
    }
    
    if (score.total_score < 60) {
      return `Week 1: Fix headline and CTA. Week 2: Implement pricing changes. Week 3-4: Execute first 10 user plan. Month 2: Optimize based on data.`;
    }
    
    if (score.total_score < 80) {
      return `Week 1: Quick wins (headline, CTA, risk reversal). Week 2-3: Optimize conversion funnel. Week 4: Scale acquisition channel. Month 2: Growth loop optimization.`;
    }
    
    return `Week 1: Fine-tune positioning. Week 2-4: Scale acquisition. Month 2: Optimize pricing and tiers. Month 3: Build growth loops.`;
  }
}

