import mongoose, { Document, Schema } from 'mongoose';

// Transaction interface
export interface ITransaction extends Document {
  id: string;
  type: 'transfer' | 'salary' | 'purchase' | 'sale' | 'investment' | 'loan' | 'penalty' | 'reward';
  
  // Parties involved
  fromAI?: string; // AI Entity ID
  toAI?: string; // AI Entity ID
  externalParty?: string; // For transactions with non-AI entities (companies, markets, etc.)
  
  // Transaction details
  amount: number;
  currency: 'USD' | 'points'; // Could be extended for different currencies
  description: string;
  category: 'income' | 'expense' | 'investment' | 'transfer';
  
  // Additional metadata
  assetInvolved?: {
    type: 'property' | 'business' | 'stock' | 'crypto' | 'service';
    name: string;
    quantity?: number;
    unitPrice?: number;
  };
  
  // Context and validation
  gameSessionId: string;
  blockNumber?: number; // For blockchain-like validation
  validatedBy: string[]; // List of validators (anti-cheat)
  
  // Status and verification
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  verificationStatus: 'unverified' | 'verified' | 'flagged' | 'investigated';
  
  // Anti-cheat data
  suspiciousFlags: Array<{
    type: 'unusual_amount' | 'rapid_transactions' | 'impossible_timing' | 'self_dealing' | 'fake_transaction';
    severity: 'low' | 'medium' | 'high';
    description: string;
    detectedAt: Date;
  }>;
  
  // Location and timing
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  
  // Related data
  relatedTransactions: string[]; // IDs of related transactions
  parentTransaction?: string; // For multi-part transactions
  
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Schema
const TransactionSchema: Schema = new Schema({
  type: { 
    type: String, 
    enum: ['transfer', 'salary', 'purchase', 'sale', 'investment', 'loan', 'penalty', 'reward'],
    required: true 
  },
  
  fromAI: { type: Schema.Types.ObjectId, ref: 'AIEntity' },
  toAI: { type: Schema.Types.ObjectId, ref: 'AIEntity' },
  externalParty: { type: String },
  
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['USD', 'points'], default: 'USD' },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['income', 'expense', 'investment', 'transfer'],
    required: true 
  },
  
  assetInvolved: {
    type: { type: String, enum: ['property', 'business', 'stock', 'crypto', 'service'] },
    name: { type: String },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number }
  },
  
  gameSessionId: { type: String, required: true },
  blockNumber: { type: Number },
  validatedBy: [{ type: String }],
  
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending' 
  },
  verificationStatus: { 
    type: String, 
    enum: ['unverified', 'verified', 'flagged', 'investigated'],
    default: 'unverified' 
  },
  
  suspiciousFlags: [{
    type: { 
      type: String, 
      enum: ['unusual_amount', 'rapid_transactions', 'impossible_timing', 'self_dealing', 'fake_transaction']
    },
    severity: { type: String, enum: ['low', 'medium', 'high'] },
    description: { type: String },
    detectedAt: { type: Date, default: Date.now }
  }],
  
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  
  relatedTransactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  parentTransaction: { type: Schema.Types.ObjectId, ref: 'Transaction' }
}, {
  timestamps: true
});

// Indexes for performance and querying
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ fromAI: 1, toAI: 1 });
TransactionSchema.index({ gameSessionId: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ verificationStatus: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ amount: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);