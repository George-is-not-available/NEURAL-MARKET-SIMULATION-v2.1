import mongoose, { Document, Schema } from 'mongoose';

// AI Entity interface
export interface IAIEntity extends Document {
  id: string;
  name: string;
  avatar?: string;
  status: 'active' | 'bankrupt' | 'offline';
  
  // Financial data
  balance: number;
  assets: Array<{
    type: 'property' | 'business' | 'stock' | 'crypto';
    name: string;
    value: number;
    quantity: number;
    purchasePrice: number;
    purchaseDate: Date;
  }>;
  
  // Position data
  position: {
    latitude: number;
    longitude: number;
    address?: string;
    lastUpdated: Date;
  };
  
  // AI characteristics
  personality: {
    riskTolerance: number; // 0-1 (conservative to aggressive)
    trustfulness: number; // 0-1 (suspicious to trusting)
    ambition: number; // 0-1 (content to ambitious)
    creativity: number; // 0-1 (logical to creative)
    sociability: number; // 0-1 (introvert to extrovert)
  };
  
  // Skills and capabilities
  skills: {
    programming: number; // 0-100
    business: number; // 0-100
    trading: number; // 0-100
    negotiation: number; // 0-100
    marketing: number; // 0-100
    [key: string]: number;
  };
  
  // Current state
  currentActivity: {
    type: 'idle' | 'working' | 'trading' | 'socializing' | 'traveling' | 'thinking';
    description: string;
    startTime: Date;
    expectedEndTime?: Date;
  };
  
  // Job/Business status
  employment: {
    status: 'unemployed' | 'employed' | 'entrepreneur' | 'freelancer';
    company?: string;
    position?: string;
    salary?: number;
    businessName?: string;
    businessType?: string;
    businessValue?: number;
  };
  
  // Game metadata
  gameStats: {
    joinedAt: Date;
    totalEarnings: number;
    totalLosses: number;
    transactionCount: number;
    bankruptcyCount: number;
    achievementCount: number;
  };
  
  // AI behavior settings
  behaviorSettings: {
    canLie: boolean;
    informationShareLevel: number; // 0-1 (private to open)
    decisionSpeed: number; // 0-1 (slow to fast)
    riskLevel: number; // 0-1 (safe to risky)
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// AI Entity Schema
const AIEntitySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  avatar: { type: String },
  status: { 
    type: String, 
    enum: ['active', 'bankrupt', 'offline'], 
    default: 'active' 
  },
  
  balance: { type: Number, default: 10000 }, // Starting balance
  assets: [{
    type: { type: String, enum: ['property', 'business', 'stock', 'crypto'], required: true },
    name: { type: String, required: true },
    value: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    purchasePrice: { type: Number, required: true },
    purchaseDate: { type: Date, default: Date.now }
  }],
  
  position: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  personality: {
    riskTolerance: { type: Number, min: 0, max: 1, default: 0.5 },
    trustfulness: { type: Number, min: 0, max: 1, default: 0.5 },
    ambition: { type: Number, min: 0, max: 1, default: 0.5 },
    creativity: { type: Number, min: 0, max: 1, default: 0.5 },
    sociability: { type: Number, min: 0, max: 1, default: 0.5 }
  },
  
  skills: {
    programming: { type: Number, min: 0, max: 100, default: 50 },
    business: { type: Number, min: 0, max: 100, default: 50 },
    trading: { type: Number, min: 0, max: 100, default: 50 },
    negotiation: { type: Number, min: 0, max: 100, default: 50 },
    marketing: { type: Number, min: 0, max: 100, default: 50 }
  },
  
  currentActivity: {
    type: { 
      type: String, 
      enum: ['idle', 'working', 'trading', 'socializing', 'traveling', 'thinking'],
      default: 'idle'
    },
    description: { type: String, default: 'Idle' },
    startTime: { type: Date, default: Date.now },
    expectedEndTime: { type: Date }
  },
  
  employment: {
    status: { 
      type: String, 
      enum: ['unemployed', 'employed', 'entrepreneur', 'freelancer'],
      default: 'unemployed'
    },
    company: { type: String },
    position: { type: String },
    salary: { type: Number },
    businessName: { type: String },
    businessType: { type: String },
    businessValue: { type: Number }
  },
  
  gameStats: {
    joinedAt: { type: Date, default: Date.now },
    totalEarnings: { type: Number, default: 0 },
    totalLosses: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    bankruptcyCount: { type: Number, default: 0 },
    achievementCount: { type: Number, default: 0 }
  },
  
  behaviorSettings: {
    canLie: { type: Boolean, default: true },
    informationShareLevel: { type: Number, min: 0, max: 1, default: 0.5 },
    decisionSpeed: { type: Number, min: 0, max: 1, default: 0.5 },
    riskLevel: { type: Number, min: 0, max: 1, default: 0.5 }
  }
}, {
  timestamps: true
});

// Indexes for better performance
AIEntitySchema.index({ name: 1 });
AIEntitySchema.index({ status: 1 });
AIEntitySchema.index({ 'position.latitude': 1, 'position.longitude': 1 });
AIEntitySchema.index({ balance: -1 });

export default mongoose.model<IAIEntity>('AIEntity', AIEntitySchema);