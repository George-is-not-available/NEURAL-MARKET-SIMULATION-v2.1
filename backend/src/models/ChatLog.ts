import mongoose, { Document, Schema } from 'mongoose';

// Chat Log interface
export interface IChatLog extends Document {
  id: string;
  gameSessionId: string;
  
  // Message details
  message: {
    content: string;
    type: 'text' | 'system' | 'action' | 'trade_offer' | 'negotiation' | 'information_share';
    timestamp: Date;
    messageId: string; // Unique identifier for this specific message
  };
  
  // Participants in the conversation
  participants: {
    sender: {
      aiId: string;
      aiName: string;
      type: 'ai' | 'system';
    };
    recipients: Array<{
      aiId: string;
      aiName: string;
      received: boolean;
      readAt?: Date;
    }>;
    conversationType: 'private' | 'group' | 'broadcast' | 'system';
  };
  
  // Context and metadata
  context: {
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    activity: string; // What the AI was doing when sending this message
    mood?: 'neutral' | 'excited' | 'frustrated' | 'confident' | 'suspicious' | 'friendly';
    urgency: 'low' | 'medium' | 'high';
  };
  
  // Information sharing and deception
  informationData: {
    isDeceptive: boolean;
    deceptionType?: 'lie' | 'omission' | 'exaggeration' | 'misdirection';
    truthfulness: number; // 0-1 scale (0 = complete lie, 1 = complete truth)
    sharedInfo?: Array<{
      type: 'financial' | 'location' | 'activity' | 'intention' | 'skill' | 'opportunity';
      value: string | number;
      accuracy: number; // 0-1 scale
    }>;
    intentionalMisleading: boolean;
  };
  
  // Trade and negotiation specific data
  tradeData?: {
    offerType: 'buy' | 'sell' | 'exchange' | 'partnership' | 'loan';
    asset?: {
      type: string;
      name: string;
      quantity: number;
      proposedPrice: number;
    };
    terms?: string[];
    negotiationStage: 'initial' | 'counter_offer' | 'final' | 'accepted' | 'rejected';
    relatedTransactionId?: string;
  };
  
  // AI chain interaction data (AI1>Box>AI2>Box>AI3 pattern)
  chainData: {
    chainId?: string; // Links messages in the same interaction chain
    position: number; // Position in the chain (1, 2, 3, etc.)
    isChainStart: boolean;
    isChainEnd: boolean;
    previousMessage?: string; // ID of previous message in chain
    nextMessage?: string; // ID of next message in chain
    boxProcessing?: {
      inputProcessed: boolean;
      outputGenerated: boolean;
      processingTime: number; // milliseconds
      transformations: string[]; // What transformations occurred in the "box"
    };
  };
  
  // Monitoring and analysis
  analysis: {
    sentiment: 'positive' | 'negative' | 'neutral';
    keywords: string[];
    topics: string[];
    suspiciousContent: boolean;
    flaggedReasons?: string[];
    aiConfidenceLevel: number; // How confident the AI was when sending this
  };
  
  // System metadata
  visibility: 'public' | 'private' | 'monitored_only'; // Who can see this message
  archived: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// Chat Log Schema
const ChatLogSchema: Schema = new Schema({
  gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  
  message: {
    content: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['text', 'system', 'action', 'trade_offer', 'negotiation', 'information_share'],
      default: 'text' 
    },
    timestamp: { type: Date, default: Date.now },
    messageId: { type: String, required: true, unique: true }
  },
  
  participants: {
    sender: {
      aiId: { type: Schema.Types.ObjectId, ref: 'AIEntity', required: true },
      aiName: { type: String, required: true },
      type: { type: String, enum: ['ai', 'system'], default: 'ai' }
    },
    recipients: [{
      aiId: { type: Schema.Types.ObjectId, ref: 'AIEntity' },
      aiName: { type: String },
      received: { type: Boolean, default: false },
      readAt: { type: Date }
    }],
    conversationType: { 
      type: String, 
      enum: ['private', 'group', 'broadcast', 'system'],
      default: 'private' 
    }
  },
  
  context: {
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String }
    },
    activity: { type: String, default: 'idle' },
    mood: { 
      type: String, 
      enum: ['neutral', 'excited', 'frustrated', 'confident', 'suspicious', 'friendly'],
      default: 'neutral' 
    },
    urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  },
  
  informationData: {
    isDeceptive: { type: Boolean, default: false },
    deceptionType: { 
      type: String, 
      enum: ['lie', 'omission', 'exaggeration', 'misdirection'] 
    },
    truthfulness: { type: Number, min: 0, max: 1, default: 1 },
    sharedInfo: [{
      type: { 
        type: String, 
        enum: ['financial', 'location', 'activity', 'intention', 'skill', 'opportunity']
      },
      value: { type: Schema.Types.Mixed },
      accuracy: { type: Number, min: 0, max: 1, default: 1 }
    }],
    intentionalMisleading: { type: Boolean, default: false }
  },
  
  tradeData: {
    offerType: { 
      type: String, 
      enum: ['buy', 'sell', 'exchange', 'partnership', 'loan'] 
    },
    asset: {
      type: { type: String },
      name: { type: String },
      quantity: { type: Number },
      proposedPrice: { type: Number }
    },
    terms: [{ type: String }],
    negotiationStage: { 
      type: String, 
      enum: ['initial', 'counter_offer', 'final', 'accepted', 'rejected'],
      default: 'initial' 
    },
    relatedTransactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' }
  },
  
  chainData: {
    chainId: { type: String },
    position: { type: Number, default: 1 },
    isChainStart: { type: Boolean, default: true },
    isChainEnd: { type: Boolean, default: true },
    previousMessage: { type: Schema.Types.ObjectId, ref: 'ChatLog' },
    nextMessage: { type: Schema.Types.ObjectId, ref: 'ChatLog' },
    boxProcessing: {
      inputProcessed: { type: Boolean, default: false },
      outputGenerated: { type: Boolean, default: false },
      processingTime: { type: Number, default: 0 },
      transformations: [{ type: String }]
    }
  },
  
  analysis: {
    sentiment: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' },
    keywords: [{ type: String }],
    topics: [{ type: String }],
    suspiciousContent: { type: Boolean, default: false },
    flaggedReasons: [{ type: String }],
    aiConfidenceLevel: { type: Number, min: 0, max: 1, default: 0.8 }
  },
  
  visibility: { 
    type: String, 
    enum: ['public', 'private', 'monitored_only'],
    default: 'monitored_only' 
  },
  archived: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for efficient querying
ChatLogSchema.index({ gameSessionId: 1, 'message.timestamp': -1 });
ChatLogSchema.index({ 'participants.sender.aiId': 1 });
ChatLogSchema.index({ 'chainData.chainId': 1, 'chainData.position': 1 });
ChatLogSchema.index({ 'message.type': 1 });
ChatLogSchema.index({ 'informationData.isDeceptive': 1 });
ChatLogSchema.index({ 'analysis.suspiciousContent': 1 });

export default mongoose.model<IChatLog>('ChatLog', ChatLogSchema);