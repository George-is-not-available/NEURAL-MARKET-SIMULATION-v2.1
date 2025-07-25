export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ThoughtProcess {
  id: string;
  agentId: string;
  agentName: string;
  thought: string;
  confidence: number;
  timestamp: Date;
  type: 'decision' | 'observation' | 'planning' | 'emotional' | 'business';
  context?: any;
}

export class MockMoonshotAI {
  private history: ChatMessage[] = [];
  private agentId: string;
  private agentName: string;

  constructor(agentId: string, agentName: string) {
    this.agentId = agentId;
    this.agentName = agentName;
    
    // Initialize system prompt
    this.history.push({
      role: 'system',
      content: `你是 ${agentName}，一个在AI模拟市场游戏中的智能代理。`
    });
  }

  async chat(query: string): Promise<string> {
    try {
      this.history.push({
        role: 'user',
        content: query
      });

      // Generate mock response based on agent type
      let response = '';
      
      if (this.agentName.includes('交易员') || this.agentName.includes('trader')) {
        response = this.generateTraderResponse(query);
      } else if (this.agentName.includes('分析师') || this.agentName.includes('analyst')) {
        response = this.generateAnalystResponse(query);
      } else if (this.agentName.includes('策略师') || this.agentName.includes('strategist')) {
        response = this.generateStrategistResponse(query);
      } else if (this.agentName.includes('观察员') || this.agentName.includes('observer')) {
        response = this.generateObserverResponse(query);
      } else {
        response = this.generateGenericResponse(query);
      }

      this.history.push({
        role: 'assistant',
        content: response
      });

      return response;
    } catch (error) {
      console.error('Mock Moonshot AI Chat Error:', error);
      throw error;
    }
  }

  async generateThought(context: any): Promise<ThoughtProcess> {
    try {
      const thoughts = this.getRandomThoughts();
      const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
      
      return {
        id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: this.agentId,
        agentName: this.agentName,
        thought: thought,
        confidence: this.calculateConfidence(thought),
        timestamp: new Date(),
        type: this.determineThoughtType(thought),
        context
      };
    } catch (error) {
      console.error('Generate Thought Error:', error);
      throw error;
    }
  }

  async makeDecision(scenario: string, options: string[]): Promise<{
    decision: string;
    reasoning: string;
    confidence: number;
  }> {
    try {
      const decision = options[Math.floor(Math.random() * options.length)];
      const reasoning = this.generateReasoning(scenario, decision);
      
      return {
        decision,
        reasoning,
        confidence: Math.floor(Math.random() * 40) + 60 // 60-100% confidence
      };
    } catch (error) {
      console.error('Make Decision Error:', error);
      throw error;
    }
  }

  private generateTraderResponse(query: string): string {
    const responses = [
      '我正在分析当前市场走势，准备进行一些交易操作。',
      '市场波动很大，需要谨慎选择交易时机。',
      '我看到了一些投资机会，正在评估风险。',
      '根据技术分析，我认为现在是入场的好时机。',
      '我需要重新平衡我的投资组合。'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateAnalystResponse(query: string): string {
    const responses = [
      '根据我的分析，市场呈现上升趋势。',
      '数据显示市场情绪较为乐观。',
      '我注意到几个关键指标的变化。',
      '市场基本面分析显示积极信号。',
      '技术指标表明可能会有调整。'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateStrategistResponse(query: string): string {
    const responses = [
      '我正在制定新的投资策略。',
      '基于当前市场环境，我建议调整策略。',
      '长期来看，这个策略是可行的。',
      '我们需要考虑风险管理措施。',
      '策略执行需要分阶段进行。'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateObserverResponse(query: string): string {
    const responses = [
      '我观察到市场参与者行为的变化。',
      '整体市场活动水平有所提升。',
      '我注意到一些有趣的市场模式。',
      '市场情绪正在发生转变。',
      '观察显示新的趋势正在形成。'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateGenericResponse(query: string): string {
    const responses = [
      '我正在处理这个请求。',
      '让我分析一下这个情况。',
      '这是一个有趣的问题。',
      '我需要更多信息来做出判断。',
      '基于当前情况，我认为这是合理的。'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getRandomThoughts(): string[] {
    const thoughts = [
      '市场波动给我们带来了新的机会。',
      '我需要重新评估当前的投资策略。',
      '观察到其他参与者的行为模式正在改变。',
      '技术指标显示市场可能会有转折。',
      '风险管理是当前最重要的考虑因素。',
      '我应该增加对某些资产的关注。',
      '市场情绪似乎正在转向乐观。',
      '现在可能是重新平衡投资组合的时候。',
      '我观察到一些有趣的交易机会。',
      '数据分析显示了新的市场趋势。'
    ];
    return thoughts;
  }

  private generateReasoning(scenario: string, decision: string): string {
    const reasonings = [
      '基于当前市场分析，这个决策符合我的投资策略。',
      '风险评估显示这是一个相对安全的选择。',
      '技术指标支持这个决定。',
      '这个选择与我的长期目标一致。',
      '市场环境表明这是正确的时机。'
    ];
    return reasonings[Math.floor(Math.random() * reasonings.length)];
  }

  private calculateConfidence(text: string): number {
    return Math.floor(Math.random() * 40) + 60; // 60-100% confidence
  }

  private determineThoughtType(thought: string): 'decision' | 'observation' | 'planning' | 'emotional' | 'business' {
    if (thought.includes('决策') || thought.includes('选择')) return 'decision';
    if (thought.includes('观察') || thought.includes('注意')) return 'observation';
    if (thought.includes('计划') || thought.includes('策略')) return 'planning';
    if (thought.includes('担心') || thought.includes('兴奋')) return 'emotional';
    return 'business';
  }

  clearHistory() {
    this.history = this.history.slice(0, 1); // Keep only system prompt
  }

  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  getAgentInfo() {
    return {
      id: this.agentId,
      name: this.agentName
    };
  }
}