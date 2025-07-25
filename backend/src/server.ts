import express from 'express';
import cors from 'cors';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import GameSession from './models/GameSession';
import { AIManager } from './ai/AIManager';

const app = express();
const httpServer = new HTTPServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', '*.clackypaas.com'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', '*.clackypaas.com'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:zVSeOEHa@127.0.0.1:27017/admin';

// Global AI Manager instance
let aiManager: AIManager | null = null;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Initialize or get the default game session
    await initializeGameSession();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

// Initialize game session and AI manager
async function initializeGameSession() {
  try {
    // Check if a game session already exists
    let gameSession = await GameSession.findOne({ status: 'active' });
    
    if (!gameSession) {
      // Create a new game session
      gameSession = new GameSession({
        sessionName: 'Default Market Game',
        status: 'active',
        startedAt: new Date(),
        config: {
          tickInterval: 10000, // 10 seconds
          bankruptcyThreshold: 0,
          maxPlayers: 10,
          startingBalance: 10000,
          allowLying: true,
          enableAntiCheat: true,
          difficultyLevel: 'medium'
        },
        gameState: {
          currentTick: 0,
          totalTicks: 0,
          elapsedTime: 0,
          phase: 'early_game',
          marketConditions: {
            economyState: 'stable',
            inflationRate: 0.02,
            unemploymentRate: 0.05,
            stockMarketTrend: 'stable'
          }
        },
        participants: [],
        events: [],
        leaderboard: [],
        statistics: {
          totalTransactions: 0,
          totalVolume: 0,
          averageWealthPerAI: 0,
          bankruptcyRate: 0,
          flaggedTransactions: 0,
          penaltiesIssued: 0
        },
        adminNotes: []
      });
      
      await gameSession.save();
      console.log('✅ Created new game session');
    } else {
      console.log('✅ Found existing game session');
    }
    
    // Initialize AI Manager
    aiManager = new AIManager(gameSession, io);
    
    // Start AI Manager
    await aiManager.start();
    
    // Spawn some default AIs for testing
    setTimeout(async () => {
      if (aiManager) {
        console.log('🤖 Spawning default AIs...');
        await aiManager.spawnDefaultAIs(3);
      }
    }, 2000);
    
    console.log('🎮 Game session initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing game session:', error);
  }
}

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Market Game Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    aiManager: aiManager ? 'Active' : 'Inactive'
  });
});

// AI Management Routes
app.get('/api/ai/agents', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const agents = Array.from(aiManager.getAgents().values()).map(agent => {
      const entity = agent.getEntity();
      const status = agent.getStatus();
      return {
        id: entity.id,
        name: entity.name,
        balance: entity.balance,
        position: entity.position,
        status: status,
        employment: entity.employment,
        skills: entity.skills,
        gameStats: entity.gameStats
      };
    });
    
    res.json({
      success: true,
      agents: agents,
      count: agents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agents'
    });
  }
});

app.get('/api/ai/stats', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const stats = aiManager.getStats();
    const leaderboard = aiManager.getLeaderboard();
    
    res.json({
      success: true,
      stats: stats,
      leaderboard: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats'
    });
  }
});

app.post('/api/ai/spawn', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const { name, startingBalance, position } = req.body;
    
    const aiId = await aiManager.spawnAI({
      name: name || `AI-${Date.now()}`,
      startingBalance: startingBalance || 10000,
      position: position
    });
    
    res.json({
      success: true,
      aiId: aiId,
      message: `Spawned AI: ${name}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to spawn AI'
    });
  }
});

app.post('/api/ai/spawn-defaults', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const { count = 3 } = req.body;
    const aiIds = await aiManager.spawnDefaultAIs(count);
    
    res.json({
      success: true,
      aiIds: aiIds,
      count: aiIds.length,
      message: `Spawned ${aiIds.length} default AIs`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to spawn default AIs'
    });
  }
});

// Chain Interaction Routes
app.get('/api/chains/active', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const activeChains = aiManager.getActiveChains();
    
    res.json({
      success: true,
      chains: activeChains,
      count: activeChains.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get active chains'
    });
  }
});

app.post('/api/chains/start', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const { initiatorAiId, message } = req.body;
    
    if (!initiatorAiId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: initiatorAiId, message'
      });
    }
    
    const boxId = await aiManager.startChainInteraction(initiatorAiId, message);
    
    res.json({
      success: true,
      boxId: boxId,
      message: 'Chain interaction started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start chain interaction'
    });
  }
});

app.post('/api/chains/test', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const chainSystem = aiManager.getChainInteractionSystem();
    const boxId = await chainSystem.startTestChain();
    
    res.json({
      success: true,
      boxId: boxId,
      message: 'Test chain interaction started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start test chain'
    });
  }
});

app.get('/api/chains/:boxId', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const { boxId } = req.params;
    const chainSystem = aiManager.getChainInteractionSystem();
    const chainHistory = chainSystem.getChainHistory(boxId);
    
    if (!chainHistory) {
      return res.status(404).json({
        success: false,
        error: 'Chain not found'
      });
    }
    
    res.json({
      success: true,
      chain: chainHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chain history'
    });
  }
});

// GameRuleEngine Routes
app.get('/api/rules/stats', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const ruleEngine = aiManager.getRuleEngine();
    const stats = ruleEngine.getRuleStatistics();
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rule statistics'
    });
  }
});

app.get('/api/rules/violations/:aiId', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const { aiId } = req.params;
    const ruleEngine = aiManager.getRuleEngine();
    const violations = ruleEngine.getViolationHistory(aiId);
    
    res.json({
      success: true,
      aiId: aiId,
      violations: violations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get violation history'
    });
  }
});

app.get('/api/rules/eligibility/:aiId', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const { aiId } = req.params;
    const ruleEngine = aiManager.getRuleEngine();
    const eligibility = ruleEngine.isEligibleToPlay(aiId);
    
    res.json({
      success: true,
      aiId: aiId,
      isEligible: eligibility
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check eligibility'
    });
  }
});

app.post('/api/rules/reinstate/:aiId', async (req, res) => {
  try {
    if (!aiManager) {
      return res.status(503).json({
        success: false,
        error: 'AI Manager not initialized'
      });
    }
    
    const { aiId } = req.params;
    const ruleEngine = aiManager.getRuleEngine();
    
    // Check if AI exists and is suspended/eliminated
    const agent = aiManager.getAgent(aiId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'AI agent not found'
      });
    }
    
    ruleEngine.reinstateAI(aiId);
    
    res.json({
      success: true,
      aiId: aiId,
      message: 'AI successfully reinstated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reinstate AI'
    });
  }
});

// Test database collections endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db?.listCollections().toArray() || [];
    
    // Get document counts for each collection
    const stats: any = {};
    for (const col of collections) {
      try {
        stats[col.name] = await db?.collection(col.name).countDocuments() || 0;
      } catch (err) {
        stats[col.name] = 'Error counting';
      }
    }
    
    res.json({
      status: 'Database test successful',
      collections: collections.map(col => col.name),
      documentCounts: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  // AI interaction events
  socket.on('ai-message', (data) => {
    console.log('AI Message:', data);
    // Broadcast to all connected clients
    io.emit('ai-message-broadcast', data);
  });
  
  // AI thought process events
  socket.on('ai-thought', (data) => {
    console.log('AI Thought:', data);
    io.emit('ai-thought-broadcast', data);
  });
  
  // Game state events
  socket.on('game-state-update', (data) => {
    console.log('Game State Update:', data);
    io.emit('game-state-broadcast', data);
  });
  
  // AI position updates
  socket.on('ai-position-update', (data) => {
    console.log('AI Position Update:', data);
    io.emit('ai-position-broadcast', data);
  });
  
  // Financial data updates
  socket.on('financial-update', (data) => {
    console.log('Financial Update:', data);
    io.emit('financial-broadcast', data);
  });
  
  // Chain interaction events
  socket.on('request-chain-data', () => {
    if (aiManager) {
      const activeChains = aiManager.getActiveChains();
      socket.emit('chain-data-update', activeChains);
    }
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

const PORT = process.env.PORT || 3002;

httpServer.listen(PORT, () => {
  console.log(`🚀 AI Market Game Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 Server accessible at http://localhost:${PORT}`);
  console.log(`🎮 Game system ready`);
  console.log(`🤖 AI system integrated`);
  console.log(`🔗 Chain interaction system ready`);
});