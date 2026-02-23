import { SaaSInput, TrafficOutput } from '@/types';

export class TrafficAgent {
  analyze(input: SaaSInput): TrafficOutput {
    // Acquisition Channel (0-5)
    const acquisitionChannel = this.scoreAcquisitionChannel(input);
    
    // First 10 User Plan (0-5)
    const first10UserPlan = this.scoreFirst10UserPlan(input);
    
    // Repeatable Loop (0-5)
    const repeatableLoop = this.scoreRepeatableLoop(input);
    
    // Generate outputs
    const channelAnalysis = this.generateChannelAnalysis(input);
    const first10Plan = this.generateFirst10Plan(input);
    const acquisitionStrategy = this.generateAcquisitionStrategy(input);
    const growthLoop = this.generateGrowthLoop(input);

    return {
      acquisition_channel: acquisitionChannel,
      first_10_user_plan: first10UserPlan,
      repeatable_loop: repeatableLoop,
      channel_analysis: channelAnalysis,
      first_10_plan: first10Plan,
      acquisition_strategy: acquisitionStrategy,
      growth_loop: growthLoop,
    };
  }

  private scoreAcquisitionChannel(input: SaaSInput): number {
    const website = input.website_url.toLowerCase();
    const desc = input.description.toLowerCase();
    const combined = `${website} ${desc}`;
    
    // Check if they mention specific channels
    const hasChannel = /(twitter|linkedin|reddit|indie hackers|product hunt|hacker news|youtube|content|seo|paid ads|email|community)/i.test(combined);
    
    if (hasChannel) {
      return 3;
    }
    
    // If website exists, assume some channel awareness
    if (input.website_url && input.website_url.length > 0) {
      return 2;
    }
    
    return 1; // No clear channel
  }

  private scoreFirst10UserPlan(input: SaaSInput): number {
    // Can't assess from input, but can infer
    // If at $0 revenue, likely no plan
    return 1.5; // Default low score
  }

  private scoreRepeatableLoop(input: SaaSInput): number {
    // Can't assess from input
    // Pre-revenue = likely no loop
    return 1; // Default low score
  }

  private generateChannelAnalysis(input: SaaSInput): string {
    const target = input.target_user_guess.toLowerCase();
    
    if (target.includes('founder') || target.includes('startup') || target.includes('saas')) {
      return `Your target (${input.target_user_guess}) is on: Twitter/X (build in public), Indie Hackers, Reddit (r/SaaS, r/entrepreneur), LinkedIn (founder groups), Micro SaaS communities. Pick ONE channel, go deep.`;
    }
    
    if (target.includes('developer') || target.includes('engineer')) {
      return `Your target (${input.target_user_guess}) is on: Twitter/X, GitHub, Dev.to, Hacker News, Reddit (r/programming), Discord communities. Technical audience = technical channels.`;
    }
    
    if (target.includes('marketer') || target.includes('marketing')) {
      return `Your target (${input.target_user_guess}) is on: LinkedIn, Twitter/X, marketing communities, email lists, industry forums. B2B marketers = LinkedIn + email.`;
    }
    
    return `Define your primary acquisition channel. Where does ${input.target_user_guess} spend time online? Go there. One channel, deep focus, not scattered.`;
  }

  private generateFirst10Plan(input: SaaSInput): string {
    const target = input.target_user_guess;
    const product = input.product_name;
    
    return `First 10 users plan:
1. Manual outreach: Find 50 ${target} on [primary channel]. DM/email: "I built ${product} to solve [problem]. Can I show you a quick demo? Free access for feedback."
2. Give value first: Share [relevant content/insight] before asking for signup.
3. Personal touch: Each of first 10 gets direct access to you. Build relationships.
4. Ask for feedback: "What would make you pay for this?" Listen. Iterate.
5. Ask for referrals: After they see value, "Know 2 others with this problem?"
Timeline: 30 days. Goal: 10 paying users or 10 committed beta users.`;
  }

  private generateAcquisitionStrategy(input: SaaSInput): string {
    const price = input.monthly_price;
    
    if (price < 30) {
      return `Low-price strategy: Focus on volume channels. Twitter/X threads, Reddit posts, Indie Hackers posts. Content that demonstrates value, then CTA. Self-serve signup.`;
    }
    
    if (price >= 30 && price < 100) {
      return `Mid-price strategy: Mix of content (demonstrates value) + direct outreach (builds trust). LinkedIn posts, Twitter threads, email sequences. Free trial to reduce friction.`;
    }
    
    return `Higher-price strategy: Requires trust-building. Content marketing (case studies, deep dives), webinars, demos, founder-led sales. Slower but higher LTV.`;
  }

  private generateGrowthLoop(input: SaaSInput): string {
    const product = input.product_name;
    const desc = input.description.toLowerCase();
    
    if (desc.includes('revenue') || desc.includes('growth') || desc.includes('analytics')) {
      return `Growth loop: User gets value → Shares result/insight → Others see value → Sign up → Loop continues. For ${product}: Users share their revenue score/insights → Others want same analysis → Sign up. Make sharing easy (one-click share, embeddable results).`;
    }
    
    if (desc.includes('productivity') || desc.includes('automate')) {
      return `Growth loop: User saves time → Shares time saved/result → Others want same efficiency → Sign up. Make results shareable (screenshots, metrics, before/after).`;
    }
    
    return `Growth loop: User achieves outcome → Shares outcome → Others want outcome → Sign up. Design your product so success is visible and shareable. Build sharing into product.`;
  }
}

