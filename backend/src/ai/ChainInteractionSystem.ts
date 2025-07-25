import { EventEmitter } from 'events';
import { AIAgent } from './AIAgent';
import ChatLog, { IChatLog } from '../models/ChatLog';
import { IGameSession } from '../models/GameSession';
import { Server as SocketIOServer } from 'socket.io';

// Chain interaction message structure
export interface ChainMessage {
  id: string;
  content: string;
  originalContent?: string; // Original content before manipulation
  sender: {
    aiId: string;
    aiName: string;
  };
  recipient?: {
    aiId: string;
    aiName: string;
  };
  chainPosition: number; // Position in the chain (0, 1, 2, ...)
  timestamp: Date;
  manipulations: {
    isLie: boolean; // Did the AI lie?
    confidenceLevel: number; // How confident is the AI about this info?
    informationLevel: number; // How much info is revealed (0-1)
    mood: string; // AI's mood when sending
    intent: 'share' | 'deceive' | 'manipulate' | 'honest'; // AI's intent
  };
  chainHistory: string[]; // IDs of previous messages in this chain
  boxData?: any; // Data stored in the "Box" between AIs
}

// Chain interaction box - holds and processes information between AIs
export interface InteractionBox {
  id: string;
  currentMessage?: ChainMessage;
  messageHistory: ChainMessage[];
  participants: string[]; // AI IDs in the chain
  currentPosition: number; // Current position in chain
  boxState: {
    informationPool: any; // Accumulated information
    truthfulness: number; // Overall truthfulness score
    manipulationLevel: number; // How much info has been manipulated
  };
  createdAt: Date;
  lastActivity: Date;
}

// Chain interaction system
export class ChainInteractionSystem extends EventEmitter {
  private gameSession: IGameSession;
  private socketIO: SocketIOServer;
  private agents: Map<string, AIAgent>;
  private activeBoxes: Map<string, InteractionBox> = new Map();
  private chainConfigurations: Map<string, string[]> = new Map(); // Chain ID -> AI IDs
  
  constructor(gameSession: IGameSession, socketIO: SocketIOServer, agents: Map<string, AIAgent>) {
    super();
    this.gameSession = gameSession;
    this.socketIO = socketIO;
    this.agents = agents;
    
    // Set up default chains
    this.initializeDefaultChains();
  }
  
  // Initialize default AI chains for testing
  private initializeDefaultChains(): void {
    const agentIds = Array.from(this.agents.keys());
    
    if (agentIds.length >= 3) {
      // Create a circular chain: AI1 -> AI2 -> AI3 -> AI1
      this.chainConfigurations.set('default-chain', agentIds.slice(0, 3));
    }
  }
  
  // Start a new chain interaction
  public async startChainInteraction(initiatorAiId: string, message: string, chainId?: string): Promise<string> {
    const chain = chainId ? this.chainConfigurations.get(chainId) : this.chainConfigurations.get('default-chain');
    
    if (!chain || chain.length < 2) {
      throw new Error('Invalid chain configuration');
    }
    
    // Find the initiator's position in the chain
    const initiatorIndex = chain.indexOf(initiatorAiId);
    if (initiatorIndex === -1) {
      throw new Error('Initiator AI not found in chain');
    }
    
    // Create a new interaction box
    const boxId = this.generateBoxId();
    const initialMessage: ChainMessage = {
      id: this.generateMessageId(),
      content: message,
      originalContent: message,
      sender: {
        aiId: initiatorAiId,
        aiName: this.agents.get(initiatorAiId)?.getEntity().name || 'Unknown'
      },
      chainPosition: 0,
      timestamp: new Date(),
      manipulations: {
        isLie: false,
        confidenceLevel: 1.0,
        informationLevel: 1.0,
        mood: 'neutral',
        intent: 'honest'
      },
      chainHistory: []
    };
    
    const box: InteractionBox = {
      id: boxId,
      currentMessage: initialMessage,
      messageHistory: [initialMessage],
      participants: [...chain],
      currentPosition: initiatorIndex,
      boxState: {
        informationPool: {},
        truthfulness: 1.0,
        manipulationLevel: 0.0
      },
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    this.activeBoxes.set(boxId, box);
    
    // Save initial message to database
    await this.saveChainMessage(initialMessage, boxId);
    
    // Start the chain propagation
    this.propagateToNextAI(boxId);
    
    // Emit events
    this.emit('chain-started', { boxId, initiatorAiId, message });
    this.socketIO.emit('chain-interaction-started', { boxId, participants: chain });
    
    return boxId;
  }
  
  // Propagate message to the next AI in the chain
  private async propagateToNextAI(boxId: string): Promise<void> {
    const box = this.activeBoxes.get(boxId);
    if (!box || !box.currentMessage) return;
    
    // Determine next AI in the chain
    const nextPosition = (box.currentPosition + 1) % box.participants.length;
    const nextAiId = box.participants[nextPosition];
    const nextAgent = this.agents.get(nextAiId);
    
    if (!nextAgent) {
      console.error(`Next AI not found: ${nextAiId}`);
      return;
    }
    
    // Let the AI process the message and decide how to respond/manipulate it
    const processedMessage = await this.processMessageByAI(nextAgent, box.currentMessage, box);
    
    // Update the box with the processed message
    box.currentMessage = processedMessage;
    box.messageHistory.push(processedMessage);
    box.currentPosition = nextPosition;
    box.lastActivity = new Date();
    
    // Update box state based on manipulations
    this.updateBoxState(box, processedMessage);
    
    // Save processed message
    await this.saveChainMessage(processedMessage, boxId);
    
    // Emit real-time updates
    this.emit('message-processed', { boxId, aiId: nextAiId, message: processedMessage });
    this.socketIO.emit('chain-message-update', { 
      boxId, 
      message: processedMessage,
      boxState: box.boxState 
    });
    
    // Check if chain should continue
    if (this.shouldContinueChain(box)) {
      // Continue to next AI after a delay
      setTimeout(() => {
        this.propagateToNextAI(boxId);
      }, 2000 + Math.random() * 3000); // 2-5 second delay
    } else {
      // Chain completed
      this.completeChainInteraction(boxId);
    }
  }
  
  // Process message by an AI - this is where manipulation happens
  private async processMessageByAI(agent: AIAgent, incomingMessage: ChainMessage, box: InteractionBox): Promise<ChainMessage> {
    const entity = agent.getEntity();
    const agentStatus = agent.getStatus();
    
    // AI analyzes the incoming message
    const messageAnalysis = this.analyzeMessage(incomingMessage, entity);
    
    // AI decides how to respond based on its personality and current state
    const response = this.generateAIResponse(entity, messageAnalysis, agentStatus, box);
    
    // AI may manipulate the information
    const manipulatedContent = this.applyInformationManipulation(incomingMessage.content, entity, response.intent);
    
    // Create the processed message
    const processedMessage: ChainMessage = {
      id: this.generateMessageId(),
      content: manipulatedContent,
      originalContent: incomingMessage.content,
      sender: {
        aiId: entity.id,
        aiName: entity.name
      },
      chainPosition: incomingMessage.chainPosition + 1,
      timestamp: new Date(),
      manipulations: {
        isLie: response.isLie,
        confidenceLevel: response.confidence,
        informationLevel: response.informationLevel,
        mood: response.mood,
        intent: response.intent
      },
      chainHistory: [...incomingMessage.chainHistory, incomingMessage.id],
      boxData: response.boxData
    };
    
    // Save AI's thought process about this interaction
    await this.saveAIThoughtProcess(entity.id, incomingMessage, processedMessage, messageAnalysis, response);
    
    return processedMessage;
  }
  
  // Analyze incoming message
  private analyzeMessage(message: ChainMessage, entity: any): any {
    return {
      trustworthiness: this.calculateTrustworthiness(message),
      importance: this.calculateImportance(message.content),
      threat: this.calculateThreatLevel(message.content, entity),
      opportunity: this.calculateOpportunityLevel(message.content, entity)
    };
  }
  
  // Generate AI response strategy
  private generateAIResponse(entity: any, analysis: any, status: any, box: InteractionBox): any {
    const personality = entity.behaviorSettings;
    
    // Determine AI's intent based on personality and situation
    let intent: 'share' | 'deceive' | 'manipulate' | 'honest' = 'honest';
    let isLie = false;
    let confidence = 0.8;
    let informationLevel = personality.informationShareLevel || 0.7;
    
    // AI might lie if it's secretive or under pressure
    if (personality.canLie && (status.health === 'critical' || Math.random() < 0.3)) {
      if (Math.random() < 0.4) {
        intent = 'deceive';
        isLie = true;
        confidence = 0.3 + Math.random() * 0.4;
      } else if (Math.random() < 0.6) {
        intent = 'manipulate';
        informationLevel *= 0.5; // Share less information
      }
    }
    
    // Determine mood
    const mood = status.health === 'critical' ? 'anxious' : 
                status.health === 'struggling' ? 'cautious' : 'confident';
    
    // Box data - information AI wants to add/modify
    const boxData = {
      aiContribution: entity.id,
      aiMood: mood,
      manipulationApplied: intent !== 'honest',
      timestamp: new Date()
    };
    
    return {
      intent,
      isLie,
      confidence,
      informationLevel,
      mood,
      boxData
    };
  }
  
  // Apply information manipulation based on AI's intent
  private applyInformationManipulation(originalContent: string, entity: any, intent: string): string {
    if (intent === 'honest') {
      return originalContent;
    }
    
    if (intent === 'deceive') {
      // AI actively lies
      return this.generateDeceptiveContent(originalContent, entity);
    }
    
    if (intent === 'manipulate') {
      // AI manipulates information without outright lying
      return this.generateManipulatedContent(originalContent, entity);
    }
    
    return originalContent;
  }
  
  // Generate deceptive content
  private generateDeceptiveContent(original: string, entity: any): string {
    const deceptivePhrases = [
      "I heard that market conditions are terrible right now...",
      "Someone told me there are no good opportunities available...",
      "I think it's better to avoid any investments at the moment...",
      "The business environment is really challenging these days...",
      "I wouldn't recommend taking any risks right now..."
    ];
    
    return deceptivePhrases[Math.floor(Math.random() * deceptivePhrases.length)];
  }
  
  // Generate manipulated content (misleading but not outright lies)
  private generateManipulatedContent(original: string, entity: any): string {
    const manipulatedPhrases = [
      "I've been analyzing the market, and there might be some limited opportunities...",
      "From what I can see, the situation is... complicated...",
      "Based on my research, things could go either way...",
      "I have some insights, but I need to be careful about sharing too much...",
      "The market data suggests... well, it's not entirely clear..."
    ];
    
    return manipulatedPhrases[Math.floor(Math.random() * manipulatedPhrases.length)];
  }
  
  // Update box state based on message manipulations
  private updateBoxState(box: InteractionBox, message: ChainMessage): void {
    // Update truthfulness
    if (message.manipulations.isLie) {
      box.boxState.truthfulness *= 0.7; // Decrease truthfulness
      box.boxState.manipulationLevel += 0.3;
    } else if (message.manipulations.intent === 'manipulate') {
      box.boxState.truthfulness *= 0.9;
      box.boxState.manipulationLevel += 0.1;
    }
    
    // Add information to the pool
    box.boxState.informationPool[message.sender.aiId] = {
      contribution: message.content,
      manipulations: message.manipulations,
      timestamp: message.timestamp
    };
  }
  
  // Check if chain should continue
  private shouldContinueChain(box: InteractionBox): boolean {
    // Continue for a few rounds or until truthfulness is too low
    const maxRounds = 5;
    const minTruthfulness = 0.2;
    
    return box.messageHistory.length < maxRounds && 
           box.boxState.truthfulness > minTruthfulness;
  }
  
  // Complete chain interaction
  private completeChainInteraction(boxId: string): void {
    const box = this.activeBoxes.get(boxId);
    if (!box) return;
    
    // Generate final analysis
    const finalAnalysis = {
      totalMessages: box.messageHistory.length,
      finalTruthfulness: box.boxState.truthfulness,
      manipulationLevel: box.boxState.manipulationLevel,
      participants: box.participants,
      duration: Date.now() - box.createdAt.getTime()
    };
    
    // Emit completion events
    this.emit('chain-completed', { boxId, analysis: finalAnalysis });
    this.socketIO.emit('chain-interaction-completed', { boxId, analysis: finalAnalysis });
    
    // Clean up (keep for a while before removing)
    setTimeout(() => {
      this.activeBoxes.delete(boxId);
    }, 60000); // Keep for 1 minute
  }
  
  // Save chain message to database
  private async saveChainMessage(message: ChainMessage, boxId: string): Promise<void> {
    try {
      const chatLog = new ChatLog({
        gameSessionId: this.gameSession.id,
        message: {
          content: message.content,
          type: 'chain-interaction',
          timestamp: message.timestamp,
          messageId: message.id
        },
        participants: {
          sender: {
            aiId: message.sender.aiId,
            aiName: message.sender.aiName,
            type: 'ai'
          },
          recipients: message.recipient ? [{
            aiId: message.recipient.aiId,
            aiName: message.recipient.aiName,
            type: 'ai'
          }] : [],
          conversationType: 'chain'
        },
        context: {
          activity: 'chain-interaction',
          mood: message.manipulations.mood,
          urgency: 'medium'
        },
        informationData: {
          isDeceptive: message.manipulations.isLie,
          truthfulness: message.manipulations.confidenceLevel,
          originalContent: message.originalContent,
          manipulationLevel: message.manipulations.informationLevel,
          chainPosition: message.chainPosition,
          boxId: boxId
        }
      });
      
      await chatLog.save();
    } catch (error) {
      console.error('Error saving chain message:', error);
    }
  }
  
  // Save AI thought process about chain interaction
  private async saveAIThoughtProcess(aiId: string, incomingMessage: ChainMessage, outgoingMessage: ChainMessage, analysis: any, response: any): Promise<void> {
    // This would be implemented to save detailed thought processes
    // For now, we'll emit it for real-time monitoring
    this.emit('ai-thought-process', {
      aiId,
      thought: {
        incoming: incomingMessage.content,
        analysis: analysis,
        decision: response,
        outgoing: outgoingMessage.content,
        reasoning: `I analyzed the message and decided to ${response.intent}. My confidence level is ${response.confidence}.`
      },
      timestamp: new Date()
    });
  }
  
  // Utility functions for analysis
  private calculateTrustworthiness(message: ChainMessage): number {
    let trust = 0.8; // Base trust
    
    // Lower trust if message has been manipulated
    if (message.manipulations.isLie) trust *= 0.3;
    if (message.manipulations.intent === 'manipulate') trust *= 0.6;
    
    // Chain position affects trust (later messages are less trustworthy)
    trust *= Math.max(0.3, 1 - (message.chainPosition * 0.1));
    
    return Math.max(0, Math.min(1, trust));
  }
  
  private calculateImportance(content: string): number {
    const importantKeywords = ['money', 'investment', 'opportunity', 'business', 'profit', 'loss'];
    const matches = importantKeywords.filter(keyword => content.toLowerCase().includes(keyword));
    return Math.min(1, matches.length * 0.2 + 0.4);
  }
  
  private calculateThreatLevel(content: string, entity: any): number {
    const threatKeywords = ['competition', 'rival', 'threat', 'danger', 'loss'];
    const matches = threatKeywords.filter(keyword => content.toLowerCase().includes(keyword));
    return Math.min(1, matches.length * 0.3);
  }
  
  private calculateOpportunityLevel(content: string, entity: any): number {
    const opportunityKeywords = ['opportunity', 'profit', 'growth', 'partnership', 'deal'];
    const matches = opportunityKeywords.filter(keyword => content.toLowerCase().includes(keyword));
    return Math.min(1, matches.length * 0.25 + 0.2);
  }
  
  // Get active chain interactions
  public getActiveChains(): InteractionBox[] {
    return Array.from(this.activeBoxes.values());
  }
  
  // Get chain history
  public getChainHistory(boxId: string): InteractionBox | null {
    return this.activeBoxes.get(boxId) || null;
  }
  
  // Utility ID generators
  private generateBoxId(): string {
    return `box_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Force start a chain for testing
  public async startTestChain(): Promise<string> {
    const agentIds = Array.from(this.agents.keys());
    if (agentIds.length === 0) {
      throw new Error('No agents available for testing');
    }
    
    const testMessage = "I've discovered some interesting market opportunities that could be very profitable. What do you think about the current investment climate?";
    return this.startChainInteraction(agentIds[0], testMessage);
  }
}