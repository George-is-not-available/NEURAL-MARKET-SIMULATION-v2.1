import { useEffect, useState, useCallback } from 'react';
import { socketService, AIMessage, AIThought, AIPosition, FinancialUpdate, GameState } from '../services/socketService';

// Hook for AI Messages
export const useAIMessages = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);

  useEffect(() => {
    const unsubscribe = socketService.onMessage((message) => {
      setMessages(prev => [...prev.slice(-99), message]); // Keep last 100 messages
    });

    return unsubscribe;
  }, []);

  const sendMessage = useCallback((message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    socketService.sendMessage(message);
  }, []);

  return { messages, sendMessage };
};

// Hook for AI Thoughts
export const useAIThoughts = () => {
  const [thoughts, setThoughts] = useState<AIThought[]>([]);

  useEffect(() => {
    const unsubscribe = socketService.onThought((thought) => {
      setThoughts(prev => [...prev.slice(-49), thought]); // Keep last 50 thoughts
    });

    return unsubscribe;
  }, []);

  const sendThought = useCallback((thought: Omit<AIThought, 'id' | 'timestamp'>) => {
    socketService.sendThought(thought);
  }, []);

  return { thoughts, sendThought };
};

// Hook for AI Positions
export const useAIPositions = () => {
  const [positions, setPositions] = useState<Map<string, AIPosition>>(new Map());

  useEffect(() => {
    const unsubscribe = socketService.onPosition((position) => {
      setPositions(prev => new Map(prev.set(position.id, position)));
    });

    return unsubscribe;
  }, []);

  const updatePosition = useCallback((position: Omit<AIPosition, 'timestamp'>) => {
    socketService.updatePosition(position);
  }, []);

  return { 
    positions: Array.from(positions.values()), 
    updatePosition 
  };
};

// Hook for Financial Updates
export const useFinancialUpdates = () => {
  const [financialUpdates, setFinancialUpdates] = useState<FinancialUpdate[]>([]);
  const [totalMarketValue, setTotalMarketValue] = useState(0);

  useEffect(() => {
    const unsubscribe = socketService.onFinancial((financial) => {
      setFinancialUpdates(prev => [...prev.slice(-199), financial]); // Keep last 200 updates
      
      // Update total market value calculation
      setTotalMarketValue(prev => {
        const change = financial.currentBalance - financial.previousBalance;
        return Math.max(0, prev + change);
      });
    });

    return unsubscribe;
  }, []);

  const updateFinancial = useCallback((financial: Omit<FinancialUpdate, 'timestamp'>) => {
    socketService.updateFinancial(financial);
  }, []);

  return { 
    financialUpdates, 
    totalMarketValue, 
    updateFinancial 
  };
};

// Hook for Game State
export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    isRunning: false,
    activeAgents: 0,
    totalMarketValue: 0,
    gameStartTime: new Date(),
    currentRound: 0,
    bankruptAgents: [],
  });

  useEffect(() => {
    const unsubscribe = socketService.onGameState((state) => {
      setGameState(state);
    });

    return unsubscribe;
  }, []);

  const startSimulation = useCallback(() => {
    socketService.startSimulation();
  }, []);

  const pauseSimulation = useCallback(() => {
    socketService.pauseSimulation();
  }, []);

  const resetSimulation = useCallback(() => {
    socketService.resetSimulation();
  }, []);

  const updateGameState = useCallback((state: GameState) => {
    socketService.updateGameState(state);
  }, []);

  return {
    gameState,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    updateGameState,
  };
};

// Hook for Socket Connection Status
export const useSocketConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'reconnecting'>('disconnected');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const status = socketService.getConnectionStatus();
      const connected = socketService.isConnected();
      
      setConnectionStatus(status);
      setIsConnected(connected);
    };

    // Check connection status every second
    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const reconnect = useCallback(async () => {
    try {
      await socketService.connect();
    } catch (error) {
      console.error('Manual reconnection failed:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  return {
    connectionStatus,
    isConnected,
    reconnect,
    disconnect,
  };
};