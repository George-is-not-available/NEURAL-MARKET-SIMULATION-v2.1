import { io, Socket } from 'socket.io-client';
import { MoonshotThought, MoonshotAgentResponse, MoonshotDecision } from '../types/moonshot';

export interface AIMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
  messageType: 'public' | 'private' | 'chain';
  isLie?: boolean;
}

export interface AIThought {
  id: string;
  agentId: string;
  agentName: string;
  thought: string;
  decision?: string;
  confidence?: number;
  timestamp: Date;
  processingTime?: number;
}

export interface AIPosition {
  id: string;
  name: string;
  lng: number;
  lat: number;
  status: 'active' | 'trading' | 'thinking' | 'idle' | 'bankrupt';
  balance: number;
  color: string;
  timestamp: Date;
}

export interface FinancialUpdate {
  agentId: string;
  agentName: string;
  previousBalance: number;
  currentBalance: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  transactionType?: 'income' | 'expense' | 'investment' | 'trade';
}

export interface GameState {
  isRunning: boolean;
  activeAgents: number;
  totalMarketValue: number;
  gameStartTime: Date;
  currentRound: number;
  bankruptAgents: string[];
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  // Callbacks for real-time updates
  private messageCallbacks: ((message: AIMessage) => void)[] = [];
  private thoughtCallbacks: ((thought: AIThought) => void)[] = [];
  private positionCallbacks: ((position: AIPosition) => void)[] = [];
  private financialCallbacks: ((financial: FinancialUpdate) => void)[] = [];
  private gameStateCallbacks: ((gameState: GameState) => void)[] = [];
  
  // Moonshot AI callbacks
  private moonshotThoughtCallbacks: ((thought: MoonshotThought) => void)[] = [];
  private moonshotAgentResponseCallbacks: ((response: MoonshotAgentResponse) => void)[] = [];
  private moonshotDecisionCallbacks: ((decision: MoonshotDecision) => void)[] = [];

  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(true);
        return;
      }

      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('🔗 Socket.io connected to server');
        this.reconnectAttempts = 0;
        resolve(true);
        this.setupEventListeners();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket.io connection error:', error);
        this.handleReconnect();
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.io disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, attempt reconnection
          this.handleReconnect();
        }
      });
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectInterval);
    } else {
      console.error('💥 Max reconnection attempts reached');
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // AI Message events
    this.socket.on('ai-message-broadcast', (data: AIMessage) => {
      this.messageCallbacks.forEach(callback => callback(data));
    });

    // AI Thought events
    this.socket.on('ai-thought-broadcast', (data: AIThought) => {
      this.thoughtCallbacks.forEach(callback => callback(data));
    });

    // AI Position events
    this.socket.on('ai-position-broadcast', (data: AIPosition) => {
      this.positionCallbacks.forEach(callback => callback(data));
    });

    // Financial events
    this.socket.on('financial-broadcast', (data: FinancialUpdate) => {
      this.financialCallbacks.forEach(callback => callback(data));
    });

    // Game State events
    this.socket.on('game-state-broadcast', (data: GameState) => {
      this.gameStateCallbacks.forEach(callback => callback(data));
    });

    // Moonshot AI events
    this.socket.on('thoughtGenerated', (data: MoonshotThought) => {
      this.moonshotThoughtCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('agentResponse', (data: MoonshotAgentResponse) => {
      this.moonshotAgentResponseCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('decisionMade', (data: MoonshotDecision) => {
      this.moonshotDecisionCallbacks.forEach(callback => callback(data));
    });
  }

  // Event subscription methods
  onMessage(callback: (message: AIMessage) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) this.messageCallbacks.splice(index, 1);
    };
  }

  onThought(callback: (thought: AIThought) => void) {
    this.thoughtCallbacks.push(callback);
    return () => {
      const index = this.thoughtCallbacks.indexOf(callback);
      if (index > -1) this.thoughtCallbacks.splice(index, 1);
    };
  }

  onPosition(callback: (position: AIPosition) => void) {
    this.positionCallbacks.push(callback);
    return () => {
      const index = this.positionCallbacks.indexOf(callback);
      if (index > -1) this.positionCallbacks.splice(index, 1);
    };
  }

  onFinancial(callback: (financial: FinancialUpdate) => void) {
    this.financialCallbacks.push(callback);
    return () => {
      const index = this.financialCallbacks.indexOf(callback);
      if (index > -1) this.financialCallbacks.splice(index, 1);
    };
  }

  onGameState(callback: (gameState: GameState) => void) {
    this.gameStateCallbacks.push(callback);
    return () => {
      const index = this.gameStateCallbacks.indexOf(callback);
      if (index > -1) this.gameStateCallbacks.splice(index, 1);
    };
  }

  // Moonshot AI event subscription methods
  onMoonshotThought(callback: (thought: MoonshotThought) => void) {
    this.moonshotThoughtCallbacks.push(callback);
    return () => {
      const index = this.moonshotThoughtCallbacks.indexOf(callback);
      if (index > -1) this.moonshotThoughtCallbacks.splice(index, 1);
    };
  }

  onMoonshotAgentResponse(callback: (response: MoonshotAgentResponse) => void) {
    this.moonshotAgentResponseCallbacks.push(callback);
    return () => {
      const index = this.moonshotAgentResponseCallbacks.indexOf(callback);
      if (index > -1) this.moonshotAgentResponseCallbacks.splice(index, 1);
    };
  }

  onMoonshotDecision(callback: (decision: MoonshotDecision) => void) {
    this.moonshotDecisionCallbacks.push(callback);
    return () => {
      const index = this.moonshotDecisionCallbacks.indexOf(callback);
      if (index > -1) this.moonshotDecisionCallbacks.splice(index, 1);
    };
  }

  // Emit events to server
  sendMessage(message: Omit<AIMessage, 'id' | 'timestamp'>) {
    if (this.socket?.connected) {
      this.socket.emit('ai-message', {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date(),
      });
    }
  }

  sendThought(thought: Omit<AIThought, 'id' | 'timestamp'>) {
    if (this.socket?.connected) {
      this.socket.emit('ai-thought', {
        ...thought,
        id: Date.now().toString(),
        timestamp: new Date(),
      });
    }
  }

  updatePosition(position: Omit<AIPosition, 'timestamp'>) {
    if (this.socket?.connected) {
      this.socket.emit('ai-position-update', {
        ...position,
        timestamp: new Date(),
      });
    }
  }

  updateFinancial(financial: Omit<FinancialUpdate, 'timestamp'>) {
    if (this.socket?.connected) {
      this.socket.emit('financial-update', {
        ...financial,
        timestamp: new Date(),
      });
    }
  }

  updateGameState(gameState: GameState) {
    if (this.socket?.connected) {
      this.socket.emit('game-state-update', gameState);
    }
  }

  // Game control methods
  startSimulation() {
    if (this.socket?.connected) {
      this.socket.emit('start-simulation');
    }
  }

  pauseSimulation() {
    if (this.socket?.connected) {
      this.socket.emit('pause-simulation');
    }
  }

  resetSimulation() {
    if (this.socket?.connected) {
      this.socket.emit('reset-simulation');
    }
  }

  // Moonshot AI methods
  sendMoonshotMessage(agentId: string, message: string) {
    if (this.socket?.connected) {
      this.socket.emit('moonshot-message', { agentId, message });
    }
  }

  requestMoonshotDecision(agentId: string, scenario: string, options: string[]) {
    if (this.socket?.connected) {
      this.socket.emit('moonshot-decision', { agentId, scenario, options });
    }
  }

  // API methods for Moonshot AI
  async getMoonshotAgents(): Promise<any> {
    try {
      const response = await fetch('/api/moonshot/agents');
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to fetch Moonshot agents:', error);
      return null;
    }
  }

  async getMoonshotStats(): Promise<any> {
    try {
      const response = await fetch('/api/moonshot/stats');
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to fetch Moonshot stats:', error);
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Clear all callbacks
    this.messageCallbacks = [];
    this.thoughtCallbacks = [];
    this.positionCallbacks = [];
    this.financialCallbacks = [];
    this.gameStateCallbacks = [];
    
    // Clear Moonshot AI callbacks
    this.moonshotThoughtCallbacks = [];
    this.moonshotAgentResponseCallbacks = [];
    this.moonshotDecisionCallbacks = [];
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' | 'reconnecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    if (this.reconnectAttempts > 0 && this.reconnectAttempts < this.maxReconnectAttempts) return 'reconnecting';
    return 'connecting';
  }

  // Clear all Moonshot AI callbacks
  clearMoonshotCallbacks() {
    this.moonshotThoughtCallbacks = [];
    this.moonshotAgentResponseCallbacks = [];
    this.moonshotDecisionCallbacks = [];
  }
}

// Create singleton instance
export const socketService = new SocketService();

// Auto-connect when module loads
socketService.connect().catch(console.error);