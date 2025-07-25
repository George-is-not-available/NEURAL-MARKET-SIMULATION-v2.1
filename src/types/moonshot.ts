// Moonshot AI related types
export interface MoonshotThought {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: string;
  type: 'thought';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface MoonshotAgentResponse {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: string;
  type: 'response';
  conversationId?: string;
}

export interface MoonshotDecision {
  id: string;
  agentId: string;
  agentName: string;
  decision: string;
  reasoning: string;
  timestamp: string;
  type: 'decision';
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

export interface MoonshotAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  isActive: boolean;
  lastActivity: string;
}

export interface MoonshotChat {
  id: string;
  agentId: string;
  message: string;
  response: string;
  timestamp: string;
}