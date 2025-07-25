import AIEntity, { IAIEntity } from '../models/AIEntity';
import GameSession, { IGameSession } from '../models/GameSession';
import Transaction, { ITransaction } from '../models/Transaction';
import ThoughtProcess, { IThoughtProcess } from '../models/ThoughtProcess';
import ChatLog, { IChatLog } from '../models/ChatLog';
import { AIDecisionEngine, AIDecision, MarketContext } from './AIDecisionEngine';
import { EventEmitter } from 'events';

// AI Agent status
export interface AIAgentStatus {
  isActive: boolean;
  currentActivity: string;
  lastDecision: Date;
  nextDecision: Date;
  health: 'healthy' | 'struggling' | 'critical';
}

// AI Agent class - represents an autonomous AI entity in the game
export class AIAgent extends EventEmitter {
  private entity: IAIEntity;
  private gameSession: IGameSession;
  private decisionEngine: AIDecisionEngine;
  private decisionInterval: NodeJS.Timeout | null = null;
  private status: AIAgentStatus;
  
  constructor(entity: IAIEntity, gameSession: IGameSession) {
    super();
    this.entity = entity;
    this.gameSession = gameSession;
    this.status = {
      isActive: false,
      currentActivity: 'idle',
      lastDecision: new Date(),
      nextDecision: new Date(Date.now() + gameSession.config.tickInterval),
      health: this.calculateHealth()
    };
    
    // Initialize decision engine with market context
    const marketContext = this.generateMarketContext();
    this.decisionEngine = new AIDecisionEngine(entity, gameSession, marketContext);
  }
  
  // Start the AI agent's autonomous behavior
  public start(): void {
    if (this.status.isActive) return;
    
    this.status.isActive = true;
    this.emit('agent-started', { aiId: this.entity.id, name: this.entity.name });
    
    // Start decision-making loop
    this.scheduleNextDecision();
  }
  
  // Stop the AI agent
  public stop(): void {
    if (!this.status.isActive) return;
    
    this.status.isActive = false;
    if (this.decisionInterval) {
      clearTimeout(this.decisionInterval);
      this.decisionInterval = null;
    }
    
    this.emit('agent-stopped', { aiId: this.entity.id, name: this.entity.name });
  }
  
  // Get current status
  public getStatus(): AIAgentStatus {
    return { ...this.status };
  }
  
  // Get entity data
  public getEntity(): IAIEntity {
    return this.entity;
  }
  
  // Update entity data
  public async updateEntity(updates: Partial<IAIEntity>): Promise<void> {
    Object.assign(this.entity, updates);
    await AIEntity.findByIdAndUpdate(this.entity.id, updates);
    this.emit('entity-updated', { aiId: this.entity.id, updates });
  }
  
  // Schedule the next decision
  private scheduleNextDecision(): void {
    if (!this.status.isActive) return;
    
    const delay = this.calculateDecisionDelay();
    this.status.nextDecision = new Date(Date.now() + delay);
    
    this.decisionInterval = setTimeout(() => {
      this.makeDecision();
    }, delay);
  }
  
  // Calculate delay until next decision based on AI characteristics
  private calculateDecisionDelay(): number {
    const baseDelay = this.gameSession.config.tickInterval;
    
    // Fast decision makers decide more frequently
    const speedFactor = 0.5 + (1 - this.entity.behaviorSettings.decisionSpeed) * 0.5;
    
    // Urgent situations reduce delay
    const urgencyFactor = this.status.health === 'critical' ? 0.5 : 
                         this.status.health === 'struggling' ? 0.7 : 1.0;
    
    // Add some randomness
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    
    return Math.floor(baseDelay * speedFactor * urgencyFactor * randomFactor);
  }
  
  // Main decision-making process
  private async makeDecision(): Promise<void> {
    try {
      this.status.lastDecision = new Date();
      
      // Update market context
      const marketContext = this.generateMarketContext();
      this.decisionEngine = new AIDecisionEngine(this.entity, this.gameSession, marketContext);
      
      // Make decision
      const decision = this.decisionEngine.makeDecision();
      
      // Generate thought process
      const thoughtProcess = this.decisionEngine.generateThoughtProcess(decision);
      
      // Save thought process to database
      await this.saveThoughtProcess(thoughtProcess);
      
      // Execute the decision
      await this.executeDecision(decision);
      
      // Update current activity
      this.status.currentActivity = decision.action;
      const activityTypeMap: {[key: string]: 'idle' | 'working' | 'trading' | 'socializing' | 'traveling' | 'thinking'} = {
        'work': 'working',
        'trade': 'trading',
        'invest': 'trading',
        'socialize': 'socializing',
        'move': 'traveling',
        'start_business': 'working',
        'learn_skill': 'thinking',
        'idle': 'idle'
      };
      
      await this.updateEntity({
        currentActivity: {
          type: activityTypeMap[decision.type] || 'idle',
          description: decision.action,
          startTime: new Date(),
          expectedEndTime: new Date(Date.now() + this.calculateActionDuration(decision))
        }
      });
      
      // Update health status
      this.status.health = this.calculateHealth();
      
      // Emit decision event
      this.emit('decision-made', {
        aiId: this.entity.id,
        decision,
        thoughtProcess
      });
      
      // Schedule next decision
      this.scheduleNextDecision();
      
    } catch (error) {
      console.error(`Error in AI decision making for ${this.entity.name}:`, error);
      // Try again in a shorter interval on error
      setTimeout(() => this.scheduleNextDecision(), 5000);
    }
  }
  
  // Execute a decision and perform the actual action
  private async executeDecision(decision: AIDecision): Promise<void> {
    switch (decision.type) {
      case 'work':
        await this.executeWorkDecision(decision);
        break;
      case 'start_business':
        await this.executeBusinessDecision(decision);
        break;
      case 'invest':
        await this.executeInvestmentDecision(decision);
        break;
      case 'trade':
        await this.executeTradeDecision(decision);
        break;
      case 'socialize':
        await this.executeSocialDecision(decision);
        break;
      case 'learn_skill':
        await this.executeSkillDecision(decision);
        break;
      case 'move':
        await this.executeMoveDecision(decision);
        break;
      case 'idle':
        // No action needed for idle
        break;
      default:
        console.warn(`Unknown decision type: ${decision.type}`);
    }
  }
  
  // Execute work-related decisions
  private async executeWorkDecision(decision: AIDecision): Promise<void> {
    if (decision.action.includes('Apply for')) {
      // Job application logic
      const success = Math.random() < decision.confidence;
      
      if (success) {
        const salary = 1000 + Math.random() * 2000; // $1000-$3000
        await this.updateEntity({
          employment: {
            status: 'employed',
            company: 'Generic Corp',
            position: decision.parameters?.jobDescription || 'Employee',
            salary: salary
          }
        });
        
        await this.sendMessage(`Great news! I got hired at Generic Corp as ${decision.parameters?.jobDescription} with a salary of $${salary.toFixed(0)}!`, 'system');
      } else {
        await this.sendMessage(`Unfortunately, my job application was rejected. I'll keep looking for opportunities.`, 'system');
      }
    } else if (decision.action.includes('regular work')) {
      // Regular work - earn salary
      const salary = this.entity.employment.salary || 1000;
      const earnings = salary * (0.8 + Math.random() * 0.4) / 30; // Daily earnings
      
      await this.addMoney(earnings, 'salary', 'Daily work earnings');
    } else if (decision.action.includes('promotion')) {
      // Promotion request
      const success = Math.random() < decision.confidence;
      
      if (success) {
        const raise = (this.entity.employment.salary || 1000) * 0.2;
        const updatedEmployment = {
          ...this.entity.employment,
          salary: (this.entity.employment.salary || 1000) + raise
        };
        await this.updateEntity({
          employment: updatedEmployment
        });
        
        await this.sendMessage(`Excellent! I got a promotion and a $${raise.toFixed(0)} raise!`, 'system');
      } else {
        await this.sendMessage(`My promotion request was declined, but I'll keep working hard.`, 'system');
      }
    }
  }
  
  // Execute business-related decisions
  private async executeBusinessDecision(decision: AIDecision): Promise<void> {
    const investment = decision.parameters?.initialInvestment || 2000;
    
    if (this.entity.balance >= investment) {
      await this.spendMoney(investment, 'investment', 'Started new business');
      
      const businessValue = investment * (1.5 + Math.random() * 2); // 1.5x to 3.5x initial value
      
      await this.updateEntity({
        employment: {
          status: 'entrepreneur',
          businessName: this.generateBusinessName(),
          businessType: 'General Business',
          businessValue: businessValue
        },
        assets: [...this.entity.assets, {
          type: 'business',
          name: this.entity.employment.businessName || 'My Business',
          value: businessValue,
          quantity: 1,
          purchasePrice: investment,
          purchaseDate: new Date()
        }]
      });
      
      await this.sendMessage(`I've started my own business: ${this.entity.employment.businessName}! Initial investment: $${investment}`, 'system');
    } else {
      await this.sendMessage(`I don't have enough funds to start a business right now. Need $${investment} but only have $${this.entity.balance}`, 'system');
    }
  }
  
  // Execute investment decisions
  private async executeInvestmentDecision(decision: AIDecision): Promise<void> {
    const amount = decision.parameters?.amount || Math.min(1000, this.entity.balance * 0.3);
    
    if (this.entity.balance >= amount) {
      await this.spendMoney(amount, 'investment', `Investment: ${decision.parameters?.investmentType}`);
      
      // Simulate investment outcome
      const success = Math.random() < decision.confidence;
      const multiplier = success ? (1 + Math.random() * 1.5) : (0.5 + Math.random() * 0.5);
      const finalValue = amount * multiplier;
      
      // Add to assets
      await this.updateEntity({
        assets: [...this.entity.assets, {
          type: 'stock',
          name: decision.parameters?.investmentType || 'Investment',
          value: finalValue,
          quantity: 1,
          purchasePrice: amount,
          purchaseDate: new Date()
        }]
      });
      
      const outcome = success ? 'performing well' : 'underperforming';
      await this.sendMessage(`I invested $${amount} in ${decision.parameters?.investmentType}. It's currently ${outcome}.`, 'system');
    }
  }
  
  // Execute trade decisions
  private async executeTradeDecision(decision: AIDecision): Promise<void> {
    // For now, simulate trading with the market
    const tradeAmount = Math.min(500, this.entity.balance * 0.2);
    
    if (this.entity.balance >= tradeAmount) {
      const success = Math.random() < decision.confidence;
      const change = success ? tradeAmount * (0.1 + Math.random() * 0.3) : -tradeAmount * (0.1 + Math.random() * 0.2);
      
      if (change > 0) {
        await this.addMoney(change, 'trading', 'Successful trade');
        await this.sendMessage(`Great! My trading made me $${change.toFixed(2)}`, 'system');
      } else {
        await this.spendMoney(Math.abs(change), 'trading', 'Trading loss');
        await this.sendMessage(`My trade lost $${Math.abs(change).toFixed(2)}. I'll be more careful next time.`, 'system');
      }
    }
  }
  
  // Execute social decisions
  private async executeSocialDecision(decision: AIDecision): Promise<void> {
    // Generate social interaction
    const messages = [
      "Hello everyone! How's business today?",
      "Anyone interested in a partnership opportunity?",
      "I'm looking for investment advice. What do you think about the current market?",
      "Has anyone seen any good opportunities lately?",
      "I'd like to network with other entrepreneurs here."
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    await this.sendMessage(message, 'text');
  }
  
  // Execute skill development decisions
  private async executeSkillDecision(decision: AIDecision): Promise<void> {
    const skillName = decision.parameters?.skillName || 'business';
    const improvementCost = 100 + Math.random() * 200; // $100-$300
    
    if (this.entity.balance >= improvementCost) {
      await this.spendMoney(improvementCost, 'training', `Skill training: ${skillName}`);
      
      // Improve skill
      const improvement = 5 + Math.random() * 10; // 5-15 point improvement
      const currentSkill = this.entity.skills[skillName] || 0;
      const newSkillLevel = Math.min(100, currentSkill + improvement);
      
      const updatedSkills = {
        ...this.entity.skills,
        [skillName]: newSkillLevel
      };
      await this.updateEntity({
        skills: updatedSkills
      });
      
      await this.sendMessage(`I invested in improving my ${skillName} skills! Now at level ${newSkillLevel.toFixed(1)}`, 'system');
    }
  }
  
  // Execute movement decisions
  private async executeMoveDecision(decision: AIDecision): Promise<void> {
    // Simulate random movement
    const newPosition = {
      latitude: this.entity.position.latitude + (Math.random() - 0.5) * 0.01,
      longitude: this.entity.position.longitude + (Math.random() - 0.5) * 0.01,
      lastUpdated: new Date()
    };
    
    await this.updateEntity({ position: newPosition });
    
    this.emit('position-updated', {
      aiId: this.entity.id,
      position: newPosition
    });
  }
  
  // Add money to AI's balance
  private async addMoney(amount: number, type: string, description: string): Promise<void> {
    const newBalance = this.entity.balance + amount;
    await this.updateEntity({ balance: newBalance });
    
    // Create transaction record
    await this.createTransaction({
      type: type as any,
      toAI: this.entity.id,
      amount: amount,
      description: description,
      category: 'income',
      status: 'completed'
    });
    
    this.emit('money-gained', {
      aiId: this.entity.id,
      amount: amount,
      newBalance: newBalance,
      reason: description
    });
  }
  
  // Spend money from AI's balance
  private async spendMoney(amount: number, type: string, description: string): Promise<void> {
    const newBalance = Math.max(0, this.entity.balance - amount);
    await this.updateEntity({ balance: newBalance });
    
    // Create transaction record
    await this.createTransaction({
      type: type as any,
      fromAI: this.entity.id,
      amount: amount,
      description: description,
      category: 'expense',
      status: 'completed'
    });
    
    this.emit('money-spent', {
      aiId: this.entity.id,
      amount: amount,
      newBalance: newBalance,
      reason: description
    });
  }
  
  // Create a transaction record
  private async createTransaction(transactionData: Partial<ITransaction>): Promise<void> {
    const transaction = new Transaction({
      ...transactionData,
      gameSessionId: this.gameSession.id,
      verificationStatus: 'verified' // Auto-verify internal transactions
    });
    
    await transaction.save();
    
    // Update game stats
    const updatedGameStats = {
      ...this.entity.gameStats,
      transactionCount: this.entity.gameStats.transactionCount + 1,
      totalEarnings: transactionData.category === 'income' ? 
        this.entity.gameStats.totalEarnings + (transactionData.amount || 0) : 
        this.entity.gameStats.totalEarnings,
      totalLosses: transactionData.category === 'expense' ? 
        this.entity.gameStats.totalLosses + (transactionData.amount || 0) : 
        this.entity.gameStats.totalLosses
    };
    await this.updateEntity({
      gameStats: updatedGameStats
    });
  }
  
  // Send a message (chat)
  private async sendMessage(content: string, type: string): Promise<void> {
    const messageId = `${this.entity.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chatLog = new ChatLog({
      gameSessionId: this.gameSession.id,
      message: {
        content: content,
        type: type,
        timestamp: new Date(),
        messageId: messageId
      },
      participants: {
        sender: {
          aiId: this.entity.id,
          aiName: this.entity.name,
          type: 'ai'
        },
        recipients: [], // Broadcast message
        conversationType: 'broadcast'
      },
      context: {
        activity: this.status.currentActivity,
        mood: this.getCurrentMood(),
        urgency: this.status.health === 'critical' ? 'high' : 'medium'
      },
      informationData: {
        isDeceptive: this.shouldLie(),
        truthfulness: this.entity.behaviorSettings.canLie ? 
          Math.random() * this.entity.behaviorSettings.informationShareLevel : 1
      }
    });
    
    await chatLog.save();
    
    this.emit('message-sent', {
      aiId: this.entity.id,
      message: content,
      type: type
    });
  }
  
  // Save thought process to database
  private async saveThoughtProcess(thoughtData: any): Promise<void> {
    const thoughtProcess = new ThoughtProcess({
      aiId: this.entity.id,
      gameSessionId: this.gameSession.id,
      ...thoughtData
    });
    
    await thoughtProcess.save();
    
    this.emit('thought-generated', {
      aiId: this.entity.id,
      thought: thoughtData.thought.content
    });
  }
  
  // Calculate current health status
  private calculateHealth(): 'healthy' | 'struggling' | 'critical' {
    const balance = this.entity.balance;
    const bankruptcyThreshold = this.gameSession.config.bankruptcyThreshold;
    
    if (balance <= bankruptcyThreshold * 2) return 'critical';
    if (balance <= bankruptcyThreshold * 5) return 'struggling';
    return 'healthy';
  }
  
  // Get current mood based on situation
  private getCurrentMood(): string {
    if (this.status.health === 'critical') return 'anxious';
    if (this.entity.balance > 10000) return 'confident';
    if (this.entity.gameStats.totalEarnings > this.entity.gameStats.totalLosses * 2) return 'excited';
    return 'neutral';
  }
  
  // Determine if AI should lie in this context
  private shouldLie(): boolean {
    if (!this.entity.behaviorSettings.canLie) return false;
    
    // More likely to lie when struggling or when very secretive
    const stressFactor = this.status.health === 'critical' ? 0.3 : 0.1;
    const secretivenessFactor = (1 - this.entity.behaviorSettings.informationShareLevel) * 0.4;
    
    return Math.random() < (stressFactor + secretivenessFactor);
  }
  
  // Generate market context for decision making
  private generateMarketContext(): MarketContext {
    // In a real implementation, this would analyze the actual game state
    // For now, we'll generate simulated market conditions
    
    const economyStates = ['recession', 'stable', 'growth', 'boom'] as const;
    const economyState = economyStates[Math.floor(Math.random() * economyStates.length)];
    
    return {
      economyState,
      opportunities: this.generateOpportunities(economyState),
      competitorAnalysis: [] // Would be populated with other AIs in the game
    };
  }
  
  // Generate market opportunities
  private generateOpportunities(economyState: string): any[] {
    const opportunities = [];
    
    // Job opportunities
    if (this.entity.employment.status === 'unemployed') {
      opportunities.push({
        type: 'job',
        description: 'Software Developer',
        requirements: ['programming skill'],
        expectedReturn: 0.7,
        riskLevel: 0.1
      });
      
      opportunities.push({
        type: 'job',
        description: 'Sales Representative',
        requirements: ['negotiation skill'],
        expectedReturn: 0.6,
        riskLevel: 0.2
      });
    }
    
    // Investment opportunities
    if (economyState === 'growth' || economyState === 'boom') {
      opportunities.push({
        type: 'investment',
        description: 'Tech Stocks',
        requirements: ['trading skill'],
        expectedReturn: 0.8,
        riskLevel: 0.6
      });
    }
    
    // Business opportunities
    if (this.entity.balance > 2000) {
      opportunities.push({
        type: 'business',
        description: 'Online Store',
        requirements: ['business skill', 'marketing skill'],
        expectedReturn: 0.9,
        riskLevel: 0.7
      });
    }
    
    return opportunities;
  }
  
  // Generate a random business name
  private generateBusinessName(): string {
    const adjectives = ['Smart', 'Quick', 'Global', 'Digital', 'Premium', 'Elite', 'Innovative'];
    const nouns = ['Solutions', 'Ventures', 'Systems', 'Dynamics', 'Enterprises', 'Corp', 'Group'];
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj} ${noun}`;
  }
  
  // Calculate how long an action should take
  private calculateActionDuration(decision: AIDecision): number {
    const baseDurations = {
      'work': 8 * 60 * 60 * 1000, // 8 hours
      'trade': 30 * 60 * 1000, // 30 minutes
      'invest': 60 * 60 * 1000, // 1 hour
      'socialize': 2 * 60 * 60 * 1000, // 2 hours
      'start_business': 4 * 60 * 60 * 1000, // 4 hours
      'learn_skill': 3 * 60 * 60 * 1000, // 3 hours
      'move': 15 * 60 * 1000, // 15 minutes
      'idle': 30 * 60 * 1000 // 30 minutes
    };
    
    return baseDurations[decision.type] || baseDurations['idle'];
  }
}