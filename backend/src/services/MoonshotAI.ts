import OpenAI from 'openai';

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

export class MoonshotAI {
  private client: OpenAI;
  private history: ChatMessage[] = [];
  private agentId: string;
  private agentName: string;

  constructor(agentId: string, agentName: string) {
    this.agentId = agentId;
    this.agentName = agentName;
    
    this.client = new OpenAI({
      apiKey: process.env.MOONSHOT_API_KEY || 'sk__Sq7AooqnjvOVK8qdi1OqgWg4OUmL0fPt12l0QTf_zc',
      baseURL: 'https://api.moonshot.cn/v1'
    });

    // Initialize system prompt
    this.history.push({
      role: 'system',
      content: `你是 ${agentName}，一个在AI模拟市场游戏中的智能代理。你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。你的主要任务是：
      1. 参与市场交易决策
      2. 分析市场趋势
      3. 与其他AI代理进行商业对话
      4. 制定商业策略
      5. 观察市场变化并做出反应
      
      你应该以商业角度思考，同时保持理性和逻辑性。你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。`
    });
  }

  async chat(query: string): Promise<string> {
    try {
      this.history.push({
        role: 'user',
        content: query
      });

      const completion = await this.client.chat.completions.create({
        model: 'kimi-k2-0711-preview',
        messages: this.history,
        temperature: 0.6,
        max_tokens: 1000
      });

      const result = completion.choices[0].message.content || '';
      
      this.history.push({
        role: 'assistant',
        content: result
      });

      return result;
    } catch (error) {
      console.error('Moonshot AI Chat Error:', error);
      throw error;
    }
  }

  async generateThought(context: any): Promise<ThoughtProcess> {
    try {
      const prompt = `基于当前市场状况：${JSON.stringify(context)}，请生成一个简短的思考过程。回答应该简洁明了，不超过100字。`;
      
      const thought = await this.chat(prompt);
      
      return {
        id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: this.agentId,
        agentName: this.agentName,
        thought: thought.trim(),
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
      const prompt = `
      场景: ${scenario}
      选项: ${options.join(', ')}
      
      请选择一个最佳选项并解释你的推理过程。回答格式：
      决策：[选择的选项]
      推理：[解释原因]
      `;

      const response = await this.chat(prompt);
      const lines = response.split('\n').filter(line => line.trim());
      
      let decision = '';
      let reasoning = '';
      
      for (const line of lines) {
        if (line.startsWith('决策：') || line.startsWith('决定：')) {
          decision = line.split('：')[1]?.trim() || '';
        } else if (line.startsWith('推理：') || line.startsWith('原因：')) {
          reasoning = line.split('：')[1]?.trim() || '';
        }
      }

      return {
        decision: decision || options[0],
        reasoning: reasoning || response,
        confidence: this.calculateConfidence(response)
      };
    } catch (error) {
      console.error('Make Decision Error:', error);
      throw error;
    }
  }

  private calculateConfidence(text: string): number {
    // Simple confidence calculation based on text characteristics
    const certaintyWords = ['确定', '明确', '肯定', '必须', '一定', 'definitely', 'certain', 'sure'];
    const uncertaintyWords = ['可能', '或许', '也许', '大概', '可能是', 'maybe', 'perhaps', 'might'];
    
    let confidence = 50; // Base confidence
    
    certaintyWords.forEach(word => {
      if (text.includes(word)) confidence += 10;
    });
    
    uncertaintyWords.forEach(word => {
      if (text.includes(word)) confidence -= 10;
    });
    
    // Adjust based on text length and complexity
    if (text.length > 100) confidence += 5;
    if (text.includes('因为') || text.includes('由于') || text.includes('because')) confidence += 5;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private determineThoughtType(thought: string): 'decision' | 'observation' | 'planning' | 'emotional' | 'business' {
    const content = thought.toLowerCase();
    
    if (content.includes('决定') || content.includes('选择') || content.includes('decide') || content.includes('choose')) {
      return 'decision';
    } else if (content.includes('观察') || content.includes('注意到') || content.includes('observe') || content.includes('notice')) {
      return 'observation';
    } else if (content.includes('计划') || content.includes('策略') || content.includes('plan') || content.includes('strategy')) {
      return 'planning';
    } else if (content.includes('感觉') || content.includes('担心') || content.includes('兴奋') || content.includes('feel') || content.includes('worried')) {
      return 'emotional';
    } else if (content.includes('市场') || content.includes('交易') || content.includes('商业') || content.includes('business') || content.includes('market')) {
      return 'business';
    }
    
    return 'observation';
  }

  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = this.history.slice(0, 1); // Keep only system message
  }

  getAgentInfo() {
    return {
      id: this.agentId,
      name: this.agentName
    };
  }
}