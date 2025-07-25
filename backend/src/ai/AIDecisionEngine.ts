import { IAIEntity } from '../models/AIEntity';
import { IGameSession } from '../models/GameSession';
import { ITransaction } from '../models/Transaction';

// Decision types for AI actions
export interface AIDecision {
  type: 'work' | 'trade' | 'invest' | 'socialize' | 'move' | 'start_business' | 'learn_skill' | 'idle';
  action: string;
  confidence: number; // 0-1 scale
  expectedOutcome: number; // -1 to 1 scale
  reasoning: string;
  parameters?: any;
}

// Market conditions and opportunities
export interface MarketContext {
  economyState: 'recession' | 'stable' | 'growth' | 'boom';
  opportunities: Array<{
    type: 'job' | 'investment' | 'business' | 'trade';
    description: string;
    requirements: string[];
    expectedReturn: number;
    riskLevel: number;
  }>;
  competitorAnalysis: Array<{
    aiId: string;
    threatLevel: number;
    competitiveAdvantage: string[];
  }>;
}

export class AIDecisionEngine {
  private ai: IAIEntity;
  private gameSession: IGameSession;
  private marketContext: MarketContext;
  
  constructor(ai: IAIEntity, gameSession: IGameSession, marketContext: MarketContext) {
    this.ai = ai;
    this.gameSession = gameSession;
    this.marketContext = marketContext;
  }
  
  // Main decision-making method
  public makeDecision(): AIDecision {
    // Analyze current situation
    const situationAnalysis = this.analyzeSituation();
    
    // Generate possible actions
    const possibleActions = this.generatePossibleActions();
    
    // Evaluate each action
    const evaluatedActions = possibleActions.map(action => this.evaluateAction(action));
    
    // Select best action based on AI personality and situation
    const selectedAction = this.selectBestAction(evaluatedActions);
    
    return selectedAction;
  }
  
  // Analyze current situation
  private analyzeSituation() {
    const financialHealth = this.assessFinancialHealth();
    const skillGaps = this.identifySkillGaps();
    const threats = this.identifyThreats();
    const opportunities = this.identifyOpportunities();
    
    return {
      financialHealth,
      skillGaps,
      threats,
      opportunities,
      urgency: this.calculateUrgency(financialHealth, threats)
    };
  }
  
  // Assess financial health
  private assessFinancialHealth() {
    const balance = this.ai.balance;
    const netWorth = this.calculateNetWorth();
    const bankruptcyRisk = balance <= this.gameSession.config.bankruptcyThreshold * 1.5;
    
    return {
      balance,
      netWorth,
      bankruptcyRisk,
      liquidityRatio: balance / Math.max(netWorth, 1),
      financialStress: bankruptcyRisk ? 0.9 : Math.max(0, (1000 - balance) / 1000)
    };
  }
  
  // Calculate net worth including assets
  private calculateNetWorth(): number {
    const assetValue = this.ai.assets.reduce((total, asset) => total + asset.value, 0);
    return this.ai.balance + assetValue;
  }
  
  // Identify skill gaps based on market opportunities
  private identifySkillGaps(): string[] {
    const requiredSkills = this.marketContext.opportunities
      .flatMap(opp => opp.requirements)
      .filter(req => req.toLowerCase().includes('skill'));
    
    return requiredSkills.filter(skill => {
      const skillName = skill.toLowerCase().replace('skill', '').trim();
      return (this.ai.skills[skillName] || 0) < 70; // Below proficiency threshold
    });
  }
  
  // Identify threats from competitors and market
  private identifyThreats(): Array<{type: string, severity: number, description: string}> {
    const threats = [];
    
    // Bankruptcy threat
    if (this.ai.balance < this.gameSession.config.bankruptcyThreshold * 2) {
      threats.push({
        type: 'bankruptcy',
        severity: 0.9,
        description: 'Low balance approaching bankruptcy threshold'
      });
    }
    
    // Competitor threats
    this.marketContext.competitorAnalysis.forEach(competitor => {
      if (competitor.threatLevel > 0.7) {
        threats.push({
          type: 'competition',
          severity: competitor.threatLevel,
          description: `Strong competitor with advantages: ${competitor.competitiveAdvantage.join(', ')}`
        });
      }
    });
    
    // Market threats
    if (this.marketContext.economyState === 'recession') {
      threats.push({
        type: 'economic',
        severity: 0.6,
        description: 'Economic recession reducing opportunities'
      });
    }
    
    return threats;
  }
  
  // Identify opportunities in the market
  private identifyOpportunities(): Array<{type: string, attractiveness: number, description: string}> {
    return this.marketContext.opportunities.map(opp => ({
      type: opp.type,
      attractiveness: this.calculateOpportunityAttractiveness(opp),
      description: opp.description
    }));
  }
  
  // Calculate how attractive an opportunity is for this AI
  private calculateOpportunityAttractiveness(opportunity: any): number {
    const baseAttractiveness = opportunity.expectedReturn * (1 - opportunity.riskLevel);
    
    // Adjust based on AI personality
    const riskAdjustment = this.ai.personality.riskTolerance * 0.5;
    const ambitionBonus = this.ai.personality.ambition * 0.3;
    
    // Adjust based on skills match
    const skillMatch = this.calculateSkillMatch(opportunity.requirements);
    
    return baseAttractiveness + riskAdjustment + ambitionBonus + skillMatch;
  }
  
  // Calculate how well AI's skills match requirements
  private calculateSkillMatch(requirements: string[]): number {
    if (requirements.length === 0) return 0.5;
    
    const skillMatches = requirements.map(req => {
      const skillName = req.toLowerCase().replace('skill', '').trim();
      return (this.ai.skills[skillName] || 0) / 100;
    });
    
    return skillMatches.reduce((sum, match) => sum + match, 0) / skillMatches.length;
  }
  
  // Calculate urgency of action needed
  private calculateUrgency(financialHealth: any, threats: any[]): number {
    let urgency = 0;
    
    // Financial urgency
    if (financialHealth.bankruptcyRisk) urgency += 0.8;
    if (financialHealth.balance < 1000) urgency += 0.4;
    
    // Threat urgency
    const maxThreatSeverity = Math.max(...threats.map(t => t.severity), 0);
    urgency += maxThreatSeverity * 0.3;
    
    return Math.min(urgency, 1);
  }
  
  // Generate possible actions based on current state
  private generatePossibleActions(): AIDecision[] {
    const actions: AIDecision[] = [];
    
    // Always can idle
    actions.push({
      type: 'idle',
      action: 'Rest and observe the market',
      confidence: 0.8,
      expectedOutcome: 0,
      reasoning: 'Taking time to analyze the situation'
    });
    
    // Work actions
    if (this.ai.employment.status === 'unemployed') {
      actions.push(...this.generateJobSearchActions());
    } else if (this.ai.employment.status === 'employed') {
      actions.push(...this.generateWorkActions());
    }
    
    // Business actions
    if (this.ai.employment.status === 'entrepreneur' || this.ai.balance > 5000) {
      actions.push(...this.generateBusinessActions());
    }
    
    // Investment actions
    if (this.ai.balance > 1000) {
      actions.push(...this.generateInvestmentActions());
    }
    
    // Social actions
    actions.push(...this.generateSocialActions());
    
    // Skill development actions
    actions.push(...this.generateSkillDevelopmentActions());
    
    return actions;
  }
  
  // Generate job search actions
  private generateJobSearchActions(): AIDecision[] {
    const jobOpportunities = this.marketContext.opportunities.filter(opp => opp.type === 'job');
    
    return jobOpportunities.map(job => ({
      type: 'work' as const,
      action: `Apply for: ${job.description}`,
      confidence: this.calculateSkillMatch(job.requirements),
      expectedOutcome: job.expectedReturn * 0.8,
      reasoning: `Job matches skills and offers good income potential`,
      parameters: { jobDescription: job.description, requirements: job.requirements }
    }));
  }
  
  // Generate work-related actions
  private generateWorkActions(): AIDecision[] {
    const actions: AIDecision[] = [];
    
    // Regular work
    actions.push({
      type: 'work',
      action: 'Perform regular work duties',
      confidence: 0.9,
      expectedOutcome: 0.6,
      reasoning: 'Consistent income from employment'
    });
    
    // Ask for promotion/raise
    if (this.ai.gameStats.transactionCount > 5) {
      actions.push({
        type: 'work',
        action: 'Request promotion or salary increase',
        confidence: this.ai.skills.negotiation / 100,
        expectedOutcome: 0.8,
        reasoning: 'Experience and skills justify better compensation'
      });
    }
    
    return actions;
  }
  
  // Generate business-related actions
  private generateBusinessActions(): AIDecision[] {
    const actions: AIDecision[] = [];
    
    if (this.ai.employment.status !== 'entrepreneur') {
      // Start new business
      actions.push({
        type: 'start_business',
        action: 'Start a new business venture',
        confidence: (this.ai.skills.business + this.ai.personality.ambition * 50) / 150,
        expectedOutcome: this.ai.personality.riskTolerance,
        reasoning: 'Entrepreneurship offers higher income potential',
        parameters: { initialInvestment: Math.min(this.ai.balance * 0.7, 3000) }
      });
    } else {
      // Expand existing business
      actions.push({
        type: 'invest',
        action: 'Expand current business operations',
        confidence: this.ai.skills.business / 100,
        expectedOutcome: 0.7,
        reasoning: 'Business expansion can increase revenue'
      });
    }
    
    return actions;
  }
  
  // Generate investment actions
  private generateInvestmentActions(): AIDecision[] {
    const investmentOpportunities = this.marketContext.opportunities.filter(opp => opp.type === 'investment');
    
    return investmentOpportunities.map(investment => ({
      type: 'invest' as const,
      action: `Invest in: ${investment.description}`,
      confidence: this.ai.skills.trading / 100 * (1 - investment.riskLevel),
      expectedOutcome: investment.expectedReturn,
      reasoning: `Investment opportunity with ${investment.expectedReturn > 0.5 ? 'high' : 'moderate'} returns`,
      parameters: { 
        investmentType: investment.description,
        amount: Math.min(this.ai.balance * this.ai.personality.riskTolerance, 2000)
      }
    }));
  }
  
  // Generate social actions
  private generateSocialActions(): AIDecision[] {
    const actions: AIDecision[] = [];
    
    if (this.ai.personality.sociability > 0.5) {
      actions.push({
        type: 'socialize',
        action: 'Network with other AIs',
        confidence: this.ai.personality.sociability,
        expectedOutcome: 0.4,
        reasoning: 'Networking can lead to business opportunities'
      });
      
      actions.push({
        type: 'trade',
        action: 'Negotiate trades with other AIs',
        confidence: (this.ai.skills.negotiation + this.ai.personality.sociability * 50) / 150,
        expectedOutcome: 0.5,
        reasoning: 'Trading can be mutually beneficial'
      });
    }
    
    return actions;
  }
  
  // Generate skill development actions
  private generateSkillDevelopmentActions(): AIDecision[] {
    const skillGaps = this.identifySkillGaps();
    
    return skillGaps.map(skill => ({
      type: 'learn_skill' as const,
      action: `Improve ${skill} skill`,
      confidence: this.ai.personality.creativity,
      expectedOutcome: 0.3,
      reasoning: `Improving ${skill} will open up more opportunities`,
      parameters: { skillName: skill }
    }));
  }
  
  // Evaluate a single action
  private evaluateAction(action: AIDecision): AIDecision {
    // Adjust confidence based on AI personality
    let adjustedConfidence = action.confidence;
    
    // Risk tolerance affects confidence in risky actions
    if (action.type === 'invest' || action.type === 'start_business') {
      adjustedConfidence *= (0.5 + this.ai.personality.riskTolerance * 0.5);
    }
    
    // Ambition affects confidence in growth actions
    if (action.type === 'start_business' || action.type === 'work') {
      adjustedConfidence *= (0.7 + this.ai.personality.ambition * 0.3);
    }
    
    // Adjust expected outcome based on current situation
    let adjustedOutcome = action.expectedOutcome;
    
    // Desperate situations make risky actions more attractive
    if (this.ai.balance < 500 && (action.type === 'work' || action.type === 'start_business')) {
      adjustedOutcome *= 1.5;
    }
    
    return {
      ...action,
      confidence: Math.min(adjustedConfidence, 1),
      expectedOutcome: Math.max(-1, Math.min(1, adjustedOutcome))
    };
  }
  
  // Select the best action from evaluated options
  private selectBestAction(actions: AIDecision[]): AIDecision {
    // Calculate score for each action
    const scoredActions = actions.map(action => {
      const urgencyWeight = this.calculateUrgency(this.assessFinancialHealth(), this.identifyThreats());
      
      // Base score combines confidence and expected outcome
      let score = (action.confidence * 0.4) + (action.expectedOutcome * 0.6);
      
      // Urgent situations prioritize immediate gain actions
      if (urgencyWeight > 0.7) {
        if (action.type === 'work' || action.type === 'trade') {
          score *= 1.5;
        }
      }
      
      // Add some randomness based on AI creativity
      const randomFactor = (Math.random() - 0.5) * this.ai.personality.creativity * 0.2;
      score += randomFactor;
      
      return { action, score };
    });
    
    // Sort by score and return the best action
    scoredActions.sort((a, b) => b.score - a.score);
    
    return scoredActions[0].action;
  }
  
  // Generate a thought process explaining the decision
  public generateThoughtProcess(decision: AIDecision): any {
    const situation = this.analyzeSituation();
    
    return {
      thought: {
        content: `I've decided to ${decision.action}. ${decision.reasoning}`,
        type: 'decision',
        category: this.categorizeDecision(decision.type),
        processingTime: Math.random() * 2000 + 1000 // 1-3 seconds
      },
      decisionContext: {
        situation: `Balance: $${this.ai.balance}, Net Worth: $${this.calculateNetWorth()}`,
        availableOptions: [`${decision.action} (chosen)`, 'Consider alternatives', 'Stay idle'],
        chosenOption: decision.action,
        reasoning: decision.reasoning,
        confidenceLevel: decision.confidence,
        riskAssessment: {
          level: decision.expectedOutcome > 0.5 ? 'high' : decision.expectedOutcome > 0 ? 'medium' : 'low',
          factors: this.identifyThreats().map(t => t.description),
          mitigation: ['Monitor progress closely', 'Have backup plan ready']
        }
      },
      emotionalState: {
        primary: situation.urgency > 0.7 ? 'anxious' : decision.confidence > 0.7 ? 'confident' : 'cautious',
        intensity: Math.abs(decision.expectedOutcome),
        triggers: situation.threats.map(t => t.description),
        impactOnDecision: decision.confidence - 0.5
      }
    };
  }
  
  private categorizeDecision(decisionType: string): string {
    const categoryMap: {[key: string]: string} = {
      'work': 'operational',
      'trade': 'financial',
      'invest': 'financial',
      'socialize': 'social',
      'move': 'operational',
      'start_business': 'strategic',
      'learn_skill': 'operational',
      'idle': 'operational'
    };
    
    return categoryMap[decisionType] || 'operational';
  }
}