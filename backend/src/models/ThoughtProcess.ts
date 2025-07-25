import mongoose, { Document, Schema } from 'mongoose';

// Thought Process interface
export interface IThoughtProcess extends Document {
  id: string;
  aiId: string;
  gameSessionId: string;
  
  // Core thought data
  thought: {
    content: string;
    type: 'analysis' | 'decision' | 'observation' | 'planning' | 'emotion' | 'memory' | 'calculation';
    category: 'financial' | 'social' | 'strategic' | 'operational' | 'ethical' | 'survival';
    timestamp: Date;
    processingTime: number; // milliseconds it took to generate this thought
  };
  
  // Decision-making context
  decisionContext: {
    situation: string;
    availableOptions: Array<{
      option: string;
      pros: string[];
      cons: string[];
      estimatedOutcome: number; // -1 to 1 scale
      confidence: number; // 0 to 1 scale
    }>;
    chosenOption?: string;
    reasoning: string;
    confidenceLevel: number; // 0 to 1 scale
    riskAssessment: {
      level: 'low' | 'medium' | 'high' | 'extreme';
      factors: string[];
      mitigation: string[];
    };
  };
  
  // Emotional and psychological state
  emotionalState: {
    primary: 'confident' | 'anxious' | 'excited' | 'frustrated' | 'content' | 'suspicious' | 'ambitious';
    intensity: number; // 0 to 1 scale
    triggers: string[]; // What caused this emotional state
    impactOnDecision: number; // -1 to 1 scale (negative to positive impact)
  };
  
  // Information processing
  informationProcessing: {
    inputSources: Array<{
      source: 'conversation' | 'observation' | 'market_data' | 'memory' | 'calculation';
      reliability: number; // 0 to 1 scale
      content: string;
      timestamp: Date;
    }>;
    processedInsights: string[];
    uncertainties: string[];
    assumptions: string[];
    knowledgeGaps: string[];
  };
  
  // Planning and strategy
  planning: {
    shortTermGoals: Array<{
      goal: string;
      priority: number; // 1-10 scale
      timeline: string;
      requiredResources: string[];
      successCriteria: string;
    }>;
    longTermStrategy: {
      vision: string;
      keyMilestones: string[];
      contingencyPlans: string[];
      adaptationTriggers: string[];
    };
    currentFocus: string;
  };
  
  // Social and relationship considerations
  socialAnalysis: {
    relationships: Array<{
      targetAI: string;
      relationship: 'ally' | 'competitor' | 'neutral' | 'threat' | 'opportunity';
      trustLevel: number; // 0 to 1 scale
      perceivedThreat: number; // 0 to 1 scale
      potentialValue: number; // 0 to 1 scale
      interactionStrategy: string;
    }>;
    socialContext: string;
    reputationConcerns: string[];
  };
  
  // Financial reasoning
  financialAnalysis: {
    currentSituation: {
      liquidityAssessment: string;
      riskExposure: string;
      opportunityAnalysis: string;
    };
    marketPerception: {
      trends: string[];
      threats: string[];
      opportunities: string[];
      timing: string;
    };
    investmentThinking: {
      criteria: string[];
      riskTolerance: string;
      timeHorizon: string;
      diversificationStrategy: string;
    };
  };
  
  // Memory and learning
  memoryReferences: Array<{
    type: 'experience' | 'lesson' | 'pattern' | 'warning';
    description: string;
    relevance: number; // 0 to 1 scale
    confidence: number; // 0 to 1 scale
    lastAccessed: Date;
  }>;
  
  // Deception and information control
  deceptionPlanning?: {
    isPlanning: boolean;
    targetAI?: string;
    deceptionType: 'lie' | 'omission' | 'misdirection' | 'exaggeration';
    motivation: string;
    expectedBenefit: string;
    riskAssessment: string;
    ethicalConsiderations: string[];
  };
  
  // Performance monitoring
  performanceReflection: {
    recentOutcomes: Array<{
      decision: string;
      outcome: 'positive' | 'negative' | 'neutral';
      learnings: string[];
      futureAdjustments: string[];
    }>;
    skillAssessment: {
      strengths: string[];
      weaknesses: string[];
      improvementAreas: string[];
    };
  };
  
  // Metadata and classification
  classification: {
    importance: 'low' | 'medium' | 'high' | 'critical';
    complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
    novelty: 'routine' | 'familiar' | 'new' | 'unprecedented';
    visibility: 'private' | 'monitored' | 'analyzable'; // Whether this thought can be seen by monitoring systems
  };
  
  // Links to related data
  relatedData: {
    triggeredByMessage?: string; // ChatLog ID
    triggeredByTransaction?: string; // Transaction ID
    resultedInAction?: string; // Action taken as a result
    influencedDecisions: string[]; // IDs of decisions influenced by this thought
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Thought Process Schema
const ThoughtProcessSchema: Schema = new Schema({
  aiId: { type: Schema.Types.ObjectId, ref: 'AIEntity', required: true },
  gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  
  thought: {
    content: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['analysis', 'decision', 'observation', 'planning', 'emotion', 'memory', 'calculation'],
      required: true 
    },
    category: { 
      type: String, 
      enum: ['financial', 'social', 'strategic', 'operational', 'ethical', 'survival'],
      required: true 
    },
    timestamp: { type: Date, default: Date.now },
    processingTime: { type: Number, default: 0 }
  },
  
  decisionContext: {
    situation: { type: String, required: true },
    availableOptions: [{
      option: { type: String, required: true },
      pros: [{ type: String }],
      cons: [{ type: String }],
      estimatedOutcome: { type: Number, min: -1, max: 1, default: 0 },
      confidence: { type: Number, min: 0, max: 1, default: 0.5 }
    }],
    chosenOption: { type: String },
    reasoning: { type: String, required: true },
    confidenceLevel: { type: Number, min: 0, max: 1, default: 0.5 },
    riskAssessment: {
      level: { type: String, enum: ['low', 'medium', 'high', 'extreme'], default: 'medium' },
      factors: [{ type: String }],
      mitigation: [{ type: String }]
    }
  },
  
  emotionalState: {
    primary: { 
      type: String, 
      enum: ['confident', 'anxious', 'excited', 'frustrated', 'content', 'suspicious', 'ambitious'],
      default: 'content' 
    },
    intensity: { type: Number, min: 0, max: 1, default: 0.5 },
    triggers: [{ type: String }],
    impactOnDecision: { type: Number, min: -1, max: 1, default: 0 }
  },
  
  informationProcessing: {
    inputSources: [{
      source: { 
        type: String, 
        enum: ['conversation', 'observation', 'market_data', 'memory', 'calculation']
      },
      reliability: { type: Number, min: 0, max: 1, default: 0.8 },
      content: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    processedInsights: [{ type: String }],
    uncertainties: [{ type: String }],
    assumptions: [{ type: String }],
    knowledgeGaps: [{ type: String }]
  },
  
  planning: {
    shortTermGoals: [{
      goal: { type: String },
      priority: { type: Number, min: 1, max: 10, default: 5 },
      timeline: { type: String },
      requiredResources: [{ type: String }],
      successCriteria: { type: String }
    }],
    longTermStrategy: {
      vision: { type: String },
      keyMilestones: [{ type: String }],
      contingencyPlans: [{ type: String }],
      adaptationTriggers: [{ type: String }]
    },
    currentFocus: { type: String }
  },
  
  socialAnalysis: {
    relationships: [{
      targetAI: { type: Schema.Types.ObjectId, ref: 'AIEntity' },
      relationship: { 
        type: String, 
        enum: ['ally', 'competitor', 'neutral', 'threat', 'opportunity'],
        default: 'neutral' 
      },
      trustLevel: { type: Number, min: 0, max: 1, default: 0.5 },
      perceivedThreat: { type: Number, min: 0, max: 1, default: 0.2 },
      potentialValue: { type: Number, min: 0, max: 1, default: 0.5 },
      interactionStrategy: { type: String }
    }],
    socialContext: { type: String },
    reputationConcerns: [{ type: String }]
  },
  
  financialAnalysis: {
    currentSituation: {
      liquidityAssessment: { type: String },
      riskExposure: { type: String },
      opportunityAnalysis: { type: String }
    },
    marketPerception: {
      trends: [{ type: String }],
      threats: [{ type: String }],
      opportunities: [{ type: String }],
      timing: { type: String }
    },
    investmentThinking: {
      criteria: [{ type: String }],
      riskTolerance: { type: String },
      timeHorizon: { type: String },
      diversificationStrategy: { type: String }
    }
  },
  
  memoryReferences: [{
    type: { type: String, enum: ['experience', 'lesson', 'pattern', 'warning'] },
    description: { type: String },
    relevance: { type: Number, min: 0, max: 1, default: 0.5 },
    confidence: { type: Number, min: 0, max: 1, default: 0.7 },
    lastAccessed: { type: Date, default: Date.now }
  }],
  
  deceptionPlanning: {
    isPlanning: { type: Boolean, default: false },
    targetAI: { type: Schema.Types.ObjectId, ref: 'AIEntity' },
    deceptionType: { type: String, enum: ['lie', 'omission', 'misdirection', 'exaggeration'] },
    motivation: { type: String },
    expectedBenefit: { type: String },
    riskAssessment: { type: String },
    ethicalConsiderations: [{ type: String }]
  },
  
  performanceReflection: {
    recentOutcomes: [{
      decision: { type: String },
      outcome: { type: String, enum: ['positive', 'negative', 'neutral'] },
      learnings: [{ type: String }],
      futureAdjustments: [{ type: String }]
    }],
    skillAssessment: {
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      improvementAreas: [{ type: String }]
    }
  },
  
  classification: {
    importance: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    complexity: { type: String, enum: ['simple', 'moderate', 'complex', 'advanced'], default: 'moderate' },
    novelty: { type: String, enum: ['routine', 'familiar', 'new', 'unprecedented'], default: 'familiar' },
    visibility: { type: String, enum: ['private', 'monitored', 'analyzable'], default: 'monitored' }
  },
  
  relatedData: {
    triggeredByMessage: { type: Schema.Types.ObjectId, ref: 'ChatLog' },
    triggeredByTransaction: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    resultedInAction: { type: String },
    influencedDecisions: [{ type: String }]
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
ThoughtProcessSchema.index({ aiId: 1, createdAt: -1 });
ThoughtProcessSchema.index({ gameSessionId: 1, createdAt: -1 });
ThoughtProcessSchema.index({ 'thought.type': 1, 'thought.category': 1 });
ThoughtProcessSchema.index({ 'classification.importance': 1 });
ThoughtProcessSchema.index({ 'deceptionPlanning.isPlanning': 1 });
ThoughtProcessSchema.index({ 'emotionalState.primary': 1 });

export default mongoose.model<IThoughtProcess>('ThoughtProcess', ThoughtProcessSchema);