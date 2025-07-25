import { AIAgent, AIAgentStatus } from './AIAgent';
import AIEntity, { IAIEntity } from '../models/AIEntity';
import GameSession, { IGameSession } from '../models/GameSession';
import { ChainInteractionSystem } from './ChainInteractionSystem';
import { GameRuleEngine, RuleViolation } from './GameRuleEngine';
import { EventEmitter } from 'events';
import { Server as SocketIOServer } from 'socket.io';

// AI Manager statistics
export interface AIManagerStats {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  healthyAgents: number;
  strugglingAgents: number;
  criticalAgents: number;
  totalDecisions: number;
  totalTransactions: number;
  totalMessages: number;
}

// AI spawn configuration
export interface AISpawnConfig {
  name: string;
  personality?: {
    riskTolerance?: number;
    trustfulness?: number;
    ambition?: number;
    creativity?: number;
    sociability?: number;
  };
  skills?: {
    programming?: number;
    business?: number;
    trading?: number;
    negotiation?: number;
    marketing?: number;
  };
  startingBalance?: number;
  position?: {
    latitude: number;
    longitude: number;
  };
}

// AI Manager class
export class AIManager extends EventEmitter {
  private agents: Map<string, AIAgent> = new Map();
  private gameSession: IGameSession;
  private socketIO: SocketIOServer;
  private stats: AIManagerStats;
  private isRunning = false;
  private chainInteractionSystem: ChainInteractionSystem;
  private gameRuleEngine: GameRuleEngine;
  private ruleCheckInterval: NodeJS.Timeout | null = null;
  
  constructor(gameSession: IGameSession, socketIO: SocketIOServer) {
    super();
    this.gameSession = gameSession;
    this.socketIO = socketIO;
    this.stats = {
      totalAgents: 0,
      activeAgents: 0,
      inactiveAgents: 0,
      healthyAgents: 0,
      strugglingAgents: 0,
      criticalAgents: 0,
      totalDecisions: 0,
      totalTransactions: 0,
      totalMessages: 0
    };
    
    // Initialize chain interaction system
    this.chainInteractionSystem = new ChainInteractionSystem(gameSession, socketIO, this.agents);
    
    // Initialize game rule engine
    this.gameRuleEngine = new GameRuleEngine(gameSession, {
      bankruptcyThreshold: gameSession.config.bankruptcyThreshold,
      maxTransactionAmount: 50000,
      maxTransactionsPerMinute: 15,
      antiCheatSensitivity: 'medium'
    });
    
    // Set up rule engine event listeners
    this.setupRuleEngineListeners();
    
    // Forward chain events
    this.chainInteractionSystem.on('chain-started', (data) => {
      this.emit('chain-started', data);
      this.socketIO.emit('chain-started', data);
    });
    
    this.chainInteractionSystem.on('message-processed', (data) => {
      this.stats.totalMessages++;
      this.emit('message-processed', data);
      this.socketIO.emit('message-processed', data);
    });
    
    this.chainInteractionSystem.on('chain-completed', (data) => {
      this.emit('chain-completed', data);
      this.socketIO.emit('chain-completed', data);
    });
    
    this.chainInteractionSystem.on('ai-thought-process', (data) => {
      this.emit('ai-thought-process', data);
      this.socketIO.emit('ai-thought-process', data);
    });
  }
  
  // Start the AI Manager
  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🤖 AI Manager starting...');
    
    // Set up agent event listeners
    this.setupAgentEventListeners();
    
    console.log(`🤖 AI Manager started with ${this.agents.size} agents`);
    this.emit('manager-started', { agentCount: this.agents.size });
    
    // Start some test chain interactions after a delay
    if (this.agents.size >= 2) {
      setTimeout(() => {
        this.startRandomChainInteractions();
      }, 10000);
    }
    
    // Start periodic rule checking
    this.startRuleChecking();
  }
  
  // Stop the AI Manager
  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    console.log('🤖 AI Manager stopping...');
    
    this.agents.forEach(agent => {
      agent.stop();
    });
    
    // Stop rule checking
    if (this.ruleCheckInterval) {
      clearInterval(this.ruleCheckInterval);
      this.ruleCheckInterval = null;
    }
    
    console.log('🤖 AI Manager stopped');
    this.emit('manager-stopped');
  }
  
  // Spawn a new AI agent (simplified version)
  public async spawnAI(config: AISpawnConfig): Promise<string> {
    try {
      const aiEntity = new AIEntity({
        name: config.name,
        balance: config.startingBalance || 10000,
        position: {
          latitude: config.position?.latitude || 40.7128,
          longitude: config.position?.longitude || -74.0060,
          lastUpdated: new Date()
        }
      });
      
      await aiEntity.save();
      
      const agent = new AIAgent(aiEntity, this.gameSession);
      this.agents.set(aiEntity.id, agent);
      
      // Set up event listeners for the new agent if we're already running
      if (this.isRunning) {
        this.setupSingleAgentEventListeners(agent);
        agent.start();
      }
      
      console.log(`🤖 Spawned new AI: ${config.name}`);
      return aiEntity.id;
      
    } catch (error) {
      console.error('Error spawning AI:', error);
      throw error;
    }
  }
  
  // Spawn default AIs for testing
  public async spawnDefaultAIs(count: number = 3): Promise<string[]> {
    const aiNames = ['Alex Trader', 'Sam Business', 'Jordan Investor'];
    const spawnedIds: string[] = [];
    
    for (let i = 0; i < Math.min(count, aiNames.length); i++) {
      try {
        const aiId = await this.spawnAI({ name: aiNames[i] });
        spawnedIds.push(aiId);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to spawn AI ${aiNames[i]}:`, error);
      }
    }
    
    return spawnedIds;
  }
  
  // Get statistics
  public getStats(): AIManagerStats {
    this.stats.totalAgents = this.agents.size;
    this.updateHealthStats();
    return { ...this.stats };
  }
  
  // Update health statistics
  private updateHealthStats(): void {
    let active = 0, healthy = 0, struggling = 0, critical = 0;
    
    this.agents.forEach(agent => {
      const status = agent.getStatus();
      if (status.isActive) active++;
      
      switch (status.health) {
        case 'healthy': healthy++; break;
        case 'struggling': struggling++; break;
        case 'critical': critical++; break;
      }
    });
    
    this.stats.activeAgents = active;
    this.stats.inactiveAgents = this.agents.size - active;
    this.stats.healthyAgents = healthy;
    this.stats.strugglingAgents = struggling;
    this.stats.criticalAgents = critical;
  }
  
  // Get leaderboard
  public getLeaderboard(): Array<{aiId: string, name: string, balance: number, netWorth: number}> {
    return Array.from(this.agents.values()).map(agent => {
      const entity = agent.getEntity();
      return {
        aiId: entity.id,
        name: entity.name,
        balance: entity.balance,
        netWorth: entity.balance
      };
    }).sort((a, b) => b.netWorth - a.netWorth);
  }
  
  // Setup event listeners for all agents
  private setupAgentEventListeners(): void {
    this.agents.forEach(agent => {
      this.setupSingleAgentEventListeners(agent);
    });
  }
  
  // Setup event listeners for a single agent
  private setupSingleAgentEventListeners(agent: AIAgent): void {
    agent.on('decision-made', (data: any) => {
      this.stats.totalDecisions++;
      this.emit('ai-decision', data);
      this.socketIO.emit('ai-decision', data);
    });
    
    agent.on('message-sent', (data: any) => {
      this.stats.totalMessages++;
      this.emit('ai-message', data);
      this.socketIO.emit('ai-message', data);
    });
    
    agent.on('money-gained', (data: any) => {
      this.stats.totalTransactions++;
      this.emit('ai-money-gained', data);
      this.socketIO.emit('ai-money-gained', data);
    });
    
    agent.on('money-spent', (data: any) => {
      this.stats.totalTransactions++;
      this.emit('ai-money-spent', data);
      this.socketIO.emit('ai-money-spent', data);
    });
    
    agent.on('position-updated', (data: any) => {
      this.emit('ai-position-updated', data);
      this.socketIO.emit('ai-position-updated', data);
    });
    
    agent.on('thought-generated', (data: any) => {
      this.emit('ai-thought', data);
      this.socketIO.emit('ai-thought', data);
    });
  }
  
  // Start random chain interactions for demonstration
  private async startRandomChainInteractions(): Promise<void> {
    try {
      const agentIds = Array.from(this.agents.keys());
      
      if (agentIds.length >= 2) {
        // Start a test chain interaction
        console.log('🔗 Starting test chain interaction...');
        await this.chainInteractionSystem.startTestChain();
        
        // Schedule periodic chain interactions
        setInterval(() => {
          if (Math.random() < 0.3) { // 30% chance every interval
            this.chainInteractionSystem.startTestChain().catch(console.error);
          }
        }, 30000); // Every 30 seconds
      }
    } catch (error) {
      console.error('Error starting chain interactions:', error);
    }
  }
  
  // Get chain interaction system
  public getChainInteractionSystem(): ChainInteractionSystem {
    return this.chainInteractionSystem;
  }
  
  // Get active chain interactions
  public getActiveChains() {
    return this.chainInteractionSystem.getActiveChains();
  }
  
  // Manually start a chain interaction
  public async startChainInteraction(initiatorAiId: string, message: string): Promise<string> {
    return this.chainInteractionSystem.startChainInteraction(initiatorAiId, message);
  }
  
  // Get all agents
  public getAgents(): Map<string, AIAgent> {
    return this.agents;
  }
  
  // Get agent by ID
  public getAgent(aiId: string): AIAgent | undefined {
    return this.agents.get(aiId);
  }
  
  // Remove an agent (for bankruptcy or rule violations)
  public removeAgent(aiId: string): boolean {
    const agent = this.agents.get(aiId);
    if (!agent) return false;
    
    agent.stop();
    this.agents.delete(aiId);
    
    console.log(`🤖 Removed AI agent: ${agent.getEntity().name}`);
    this.emit('agent-removed', { aiId, name: agent.getEntity().name });
    this.socketIO.emit('agent-removed', { aiId, name: agent.getEntity().name });
    
    return true;
  }
  
  // Set up rule engine event listeners
  private setupRuleEngineListeners(): void {
    this.gameRuleEngine.on('rule-violation', (violation: RuleViolation) => {
      console.log(`⚠️ Rule violation detected: ${violation.aiId} - ${violation.description}`);
      this.socketIO.emit('rule-violation', violation);
      
      // Handle the violation
      this.gameRuleEngine.handleViolation(violation);
    });
    
    this.gameRuleEngine.on('ai-warning', (data) => {
      console.log(`⚠️ Warning issued to ${data.aiId}: ${data.reason}`);
      this.socketIO.emit('ai-warning', data);
    });
    
    this.gameRuleEngine.on('ai-penalty', (data) => {
      console.log(`💰 Penalty applied to ${data.aiId}: -$${data.penalty}`);
      this.socketIO.emit('ai-penalty', data);
      this.updateAgentAfterPenalty(data.aiId, data.newBalance);
    });
    
    this.gameRuleEngine.on('ai-suspension', (data) => {
      console.log(`⏸️ AI ${data.aiId} suspended: ${data.reason}`);
      this.socketIO.emit('ai-suspension', data);
      this.suspendAgent(data.aiId);
    });
    
    this.gameRuleEngine.on('ai-eliminated', (data) => {
      console.log(`❌ AI ${data.aiId} eliminated: ${data.reason}`);
      this.socketIO.emit('ai-eliminated', data);
      this.eliminateAgent(data.aiId);
    });
    
    this.gameRuleEngine.on('ai-reinstated', (data) => {
      console.log(`✅ AI ${data.aiId} reinstated`);
      this.socketIO.emit('ai-reinstated', data);
      this.reinstateAgent(data.aiId);
    });
  }
  
  // Start periodic rule checking
  private startRuleChecking(): void {
    // Check rules every 30 seconds
    this.ruleCheckInterval = setInterval(async () => {
      await this.performRuleCheck();
    }, 30000);
  }
  
  // Perform rule check on all active agents
  private async performRuleCheck(): Promise<void> {
    for (const [aiId, agent] of this.agents) {
      try {
        const entity = agent.getEntity();
        const status = agent.getStatus();
        
        // Only check active agents
        if (status.isActive && entity.status === 'active') {
          const validation = await this.gameRuleEngine.validateGameState(entity);
          
          if (!validation.valid) {
            // Process each violation
            for (const violation of validation.violations) {
              await this.gameRuleEngine.handleViolation(violation);
            }
          }
        }
      } catch (error) {
        console.error(`Error checking rules for AI ${aiId}:`, error);
      }
    }
  }
  
  // Update agent after penalty
  private async updateAgentAfterPenalty(aiId: string, newBalance: number): Promise<void> {
    const agent = this.agents.get(aiId);
    if (agent) {
      await agent.updateEntity({ balance: newBalance });
    }
  }
  
  // Suspend an agent
  private suspendAgent(aiId: string): void {
    const agent = this.agents.get(aiId);
    if (agent) {
      agent.stop();
    }
  }
  
  // Eliminate an agent from the game
  private eliminateAgent(aiId: string): void {
    const agent = this.agents.get(aiId);
    if (agent) {
      agent.stop();
      this.agents.delete(aiId);
    }
  }
  
  // Reinstate a suspended agent
  private async reinstateAgent(aiId: string): Promise<void> {
    const agent = this.agents.get(aiId);
    if (agent) {
      const entity = agent.getEntity();
      if (entity.status === 'active') {
        agent.start();
      }
    }
  }
  
  // Get rule engine instance
  public getRuleEngine(): GameRuleEngine {
    return this.gameRuleEngine;
  }
  
  // Get rule engine statistics
  public getRuleStats(): any {
    return this.gameRuleEngine.getGameStats();
  }
  
  // Get violation history for an AI
  public getViolationHistory(aiId: string): RuleViolation[] {
    return this.gameRuleEngine.getViolationHistory(aiId);
  }
  
  // Check if AI is eligible to play
  public async isAIEligible(aiId: string): Promise<{eligible: boolean, reason?: string}> {
    return await this.gameRuleEngine.isEligibleToPlay(aiId);
  }
}