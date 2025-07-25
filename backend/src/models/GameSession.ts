import mongoose, { Document, Schema } from 'mongoose';

// Game Session interface
export interface IGameSession extends Document {
  id: string;
  sessionName: string;
  status: 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';
  
  // Session configuration
  config: {
    maxPlayers: number;
    startingBalance: number;
    bankruptcyThreshold: number;
    gameDuration?: number; // in minutes, undefined for unlimited
    tickInterval: number; // milliseconds between AI decisions
    allowLying: boolean;
    enableAntiCheat: boolean;
    difficultyLevel: 'easy' | 'medium' | 'hard' | 'extreme';
  };
  
  // Participating AIs
  participants: Array<{
    aiId: string;
    joinedAt: Date;
    status: 'active' | 'bankrupt' | 'eliminated' | 'disconnected';
    finalBalance?: number;
    finalRank?: number;
  }>;
  
  // Game state tracking
  gameState: {
    currentTick: number;
    totalTicks: number;
    elapsedTime: number; // in milliseconds
    phase: 'preparation' | 'early_game' | 'mid_game' | 'late_game' | 'endgame';
    marketConditions: {
      economyState: 'recession' | 'stable' | 'growth' | 'boom';
      inflationRate: number;
      unemploymentRate: number;
      stockMarketTrend: 'bearish' | 'stable' | 'bullish';
    };
  };
  
  // Game events and milestones
  events: Array<{
    type: 'market_crash' | 'economic_boom' | 'new_opportunity' | 'regulatory_change' | 'natural_disaster' | 'ai_bankrupt' | 'ai_milestone';
    description: string;
    impact: string;
    timestamp: Date;
    affectedAIs?: string[];
    severity: 'low' | 'medium' | 'high';
  }>;
  
  // Leaderboard data
  leaderboard: Array<{
    aiId: string;
    aiName: string;
    balance: number;
    netWorth: number;
    rank: number;
    rankChange: number; // compared to previous update
    achievements: string[];
  }>;
  
  // Game statistics
  statistics: {
    totalTransactions: number;
    totalVolume: number;
    averageWealthPerAI: number;
    bankruptcyRate: number;
    mostActiveAI?: string;
    richestAI?: string;
    mostTransactions?: string;
    flaggedTransactions: number;
    penaltiesIssued: number;
  };
  
  // Admin and monitoring
  adminNotes: Array<{
    note: string;
    timestamp: Date;
    adminId?: string;
  }>;
  
  // Session timing
  startedAt?: Date;
  endedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// Game Session Schema
const GameSessionSchema: Schema = new Schema({
  sessionName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'paused', 'completed', 'cancelled'],
    default: 'waiting' 
  },
  
  config: {
    maxPlayers: { type: Number, default: 10, min: 2, max: 100 },
    startingBalance: { type: Number, default: 10000, min: 100 },
    bankruptcyThreshold: { type: Number, default: 0 },
    gameDuration: { type: Number }, // undefined for unlimited
    tickInterval: { type: Number, default: 5000, min: 1000 },
    allowLying: { type: Boolean, default: true },
    enableAntiCheat: { type: Boolean, default: true },
    difficultyLevel: { 
      type: String, 
      enum: ['easy', 'medium', 'hard', 'extreme'],
      default: 'medium' 
    }
  },
  
  participants: [{
    aiId: { type: Schema.Types.ObjectId, ref: 'AIEntity', required: true },
    joinedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['active', 'bankrupt', 'eliminated', 'disconnected'],
      default: 'active' 
    },
    finalBalance: { type: Number },
    finalRank: { type: Number }
  }],
  
  gameState: {
    currentTick: { type: Number, default: 0 },
    totalTicks: { type: Number, default: 0 },
    elapsedTime: { type: Number, default: 0 },
    phase: { 
      type: String, 
      enum: ['preparation', 'early_game', 'mid_game', 'late_game', 'endgame'],
      default: 'preparation' 
    },
    marketConditions: {
      economyState: { 
        type: String, 
        enum: ['recession', 'stable', 'growth', 'boom'],
        default: 'stable' 
      },
      inflationRate: { type: Number, default: 0.02 },
      unemploymentRate: { type: Number, default: 0.05 },
      stockMarketTrend: { 
        type: String, 
        enum: ['bearish', 'stable', 'bullish'],
        default: 'stable' 
      }
    }
  },
  
  events: [{
    type: { 
      type: String, 
      enum: ['market_crash', 'economic_boom', 'new_opportunity', 'regulatory_change', 'natural_disaster', 'ai_bankrupt', 'ai_milestone']
    },
    description: { type: String, required: true },
    impact: { type: String },
    timestamp: { type: Date, default: Date.now },
    affectedAIs: [{ type: Schema.Types.ObjectId, ref: 'AIEntity' }],
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  }],
  
  leaderboard: [{
    aiId: { type: Schema.Types.ObjectId, ref: 'AIEntity' },
    aiName: { type: String },
    balance: { type: Number },
    netWorth: { type: Number },
    rank: { type: Number },
    rankChange: { type: Number, default: 0 },
    achievements: [{ type: String }]
  }],
  
  statistics: {
    totalTransactions: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
    averageWealthPerAI: { type: Number, default: 0 },
    bankruptcyRate: { type: Number, default: 0 },
    mostActiveAI: { type: Schema.Types.ObjectId, ref: 'AIEntity' },
    richestAI: { type: Schema.Types.ObjectId, ref: 'AIEntity' },
    mostTransactions: { type: Schema.Types.ObjectId, ref: 'AIEntity' },
    flaggedTransactions: { type: Number, default: 0 },
    penaltiesIssued: { type: Number, default: 0 }
  },
  
  adminNotes: [{
    note: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    adminId: { type: String }
  }],
  
  startedAt: { type: Date },
  endedAt: { type: Date },
  pausedAt: { type: Date },
  resumedAt: { type: Date }
}, {
  timestamps: true
});

// Indexes
GameSessionSchema.index({ status: 1 });
GameSessionSchema.index({ createdAt: -1 });
GameSessionSchema.index({ 'participants.aiId': 1 });

export default mongoose.model<IGameSession>('GameSession', GameSessionSchema);