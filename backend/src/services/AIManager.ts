import { MockMoonshotAI as MoonshotAI, ThoughtProcess } from './MockMoonshotAI';
import { EventEmitter } from 'events';

export interface AIAgent {
  id: string;
  name: string;
  ai: MoonshotAI;
  isActive: boolean;
  lastActivity: Date;
  thoughtCount: number;
}

export class AIManager extends EventEmitter {
  private agents: Map<string, AIAgent> = new Map();
  private thoughtGenerationInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    super();
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Initialize default AI agents
    const defaultAgents = [
      { id: 'trader-001', name: 'Alex Chen (交易员)' },
      { id: 'analyst-002', name: 'Sarah Kim (分析师)' },
      { id: 'strategist-003', name: 'David Wang (策略师)' },
      { id: 'observer-004', name: 'Emily Zhang (观察员)' }
    ];

    defaultAgents.forEach(agent => {
      this.createAgent(agent.id, agent.name);
    });
  }

  createAgent(id: string, name: string): AIAgent {
    const ai = new MoonshotAI(id, name);
    const agent: AIAgent = {
      id,
      name,
      ai,
      isActive: true,
      lastActivity: new Date(),
      thoughtCount: 0
    };

    this.agents.set(id, agent);
    this.emit('agentCreated', agent);
    
    console.log(`AI Agent created: ${name} (${id})`);
    return agent;
  }

  removeAgent(id: string): boolean {
    const agent = this.agents.get(id);
    if (agent) {
      this.agents.delete(id);
      this.emit('agentRemoved', agent);
      console.log(`AI Agent removed: ${agent.name} (${id})`);
      return true;
    }
    return false;
  }

  getAgent(id: string): AIAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AIAgent[] {
    return Array.from(this.agents.values());
  }

  getActiveAgents(): AIAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.isActive);
  }

  async sendMessageToAgent(agentId: string, message: string): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    try {
      const response = await agent.ai.chat(message);
      agent.lastActivity = new Date();
      
      this.emit('agentResponse', {
        agentId,
        message,
        response,
        timestamp: new Date()
      });

      return response;
    } catch (error) {
      console.error(`Error sending message to agent ${agentId}:`, error);
      throw error;
    }
  }

  async generateThought(agentId: string, context: any): Promise<ThoughtProcess> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    try {
      const thought = await agent.ai.generateThought(context);
      agent.lastActivity = new Date();
      agent.thoughtCount++;
      
      this.emit('thoughtGenerated', thought);
      return thought;
    } catch (error) {
      console.error(`Error generating thought for agent ${agentId}:`, error);
      throw error;
    }
  }

  async makeDecision(agentId: string, scenario: string, options: string[]): Promise<{
    decision: string;
    reasoning: string;
    confidence: number;
  }> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    try {
      const decision = await agent.ai.makeDecision(scenario, options);
      agent.lastActivity = new Date();
      
      this.emit('decisionMade', {
        agentId,
        scenario,
        options,
        decision,
        timestamp: new Date()
      });

      return decision;
    } catch (error) {
      console.error(`Error making decision for agent ${agentId}:`, error);
      throw error;
    }
  }

  startThoughtGeneration(intervalMs: number = 10000): void {
    if (this.isRunning) {
      console.log('Thought generation already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting thought generation with ${intervalMs}ms interval`);

    this.thoughtGenerationInterval = setInterval(async () => {
      const activeAgents = this.getActiveAgents();
      
      for (const agent of activeAgents) {
        try {
          // Generate random context for thought generation
          const context = this.generateRandomContext();
          await this.generateThought(agent.id, context);
        } catch (error) {
          console.error(`Error generating thought for ${agent.id}:`, error);
        }
      }
    }, intervalMs);
  }

  stopThoughtGeneration(): void {
    if (this.thoughtGenerationInterval) {
      clearInterval(this.thoughtGenerationInterval);
      this.thoughtGenerationInterval = null;
    }
    this.isRunning = false;
    console.log('Thought generation stopped');
  }

  private generateRandomContext(): any {
    const scenarios = [
      { 
        marketTrend: 'bullish', 
        price: Math.random() * 1000 + 500, 
        volume: Math.random() * 10000 + 1000,
        news: '市场显示积极信号'
      },
      { 
        marketTrend: 'bearish', 
        price: Math.random() * 1000 + 500, 
        volume: Math.random() * 10000 + 1000,
        news: '市场出现下跌趋势'
      },
      { 
        marketTrend: 'neutral', 
        price: Math.random() * 1000 + 500, 
        volume: Math.random() * 10000 + 1000,
        news: '市场保持稳定'
      },
      {
        marketTrend: 'volatile',
        price: Math.random() * 1000 + 500,
        volume: Math.random() * 10000 + 1000,
        news: '市场波动较大'
      }
    ];

    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  toggleAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.isActive = !agent.isActive;
      this.emit('agentToggled', agent);
      return agent.isActive;
    }
    return false;
  }

  getStats(): {
    totalAgents: number;
    activeAgents: number;
    totalThoughts: number;
    isRunning: boolean;
  } {
    const agents = Array.from(this.agents.values());
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.isActive).length,
      totalThoughts: agents.reduce((sum, agent) => sum + agent.thoughtCount, 0),
      isRunning: this.isRunning
    };
  }

  clearAgentHistory(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.ai.clearHistory();
      agent.thoughtCount = 0;
      this.emit('agentHistoryCleared', agent);
      return true;
    }
    return false;
  }
}