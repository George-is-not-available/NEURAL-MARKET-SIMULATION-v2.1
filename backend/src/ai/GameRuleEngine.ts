import AIEntity, { IAIEntity } from '../models/AIEntity';
import GameSession, { IGameSession } from '../models/GameSession';
import Transaction, { ITransaction } from '../models/Transaction';
import { EventEmitter } from 'events';

// Rule violation types
export interface RuleViolation {
  type: 'money_manipulation' | 'balance_cheat' | 'invalid_transaction' | 'asset_cheat' | 'system_abuse';
  description: string;
  severity: 'warning' | 'moderate' | 'severe' | 'critical';
  aiId: string;
  evidence: any;
  timestamp: Date;
}

// Game rule configuration
export interface GameRuleConfig {
  bankruptcyThreshold: number;
  maxTransactionAmount: number;
  maxTransactionsPerMinute: number;
  allowedAssetTypes: string[];
  minimumTransactionGap: number; // milliseconds
  maxBalanceChangePerSecond: number;
  antiCheatSensitivity: 'low' | 'medium' | 'high';
}

export class GameRuleEngine extends EventEmitter {
  private gameSession: IGameSession;
  private ruleConfig: GameRuleConfig;
  private transactionHistory: Map<string, ITransaction[]> = new Map();
  private lastTransactionTime: Map<string, number> = new Map();
  private balanceHistory: Map<string, Array<{balance: number, timestamp: number}>> = new Map();
  private violations: Map<string, RuleViolation[]> = new Map();

  constructor(gameSession: IGameSession, ruleConfig?: Partial<GameRuleConfig>) {
    super();
    this.gameSession = gameSession;
    this.ruleConfig = {
      bankruptcyThreshold: 100,
      maxTransactionAmount: 50000,
      maxTransactionsPerMinute: 10,
      allowedAssetTypes: ['property', 'business', 'stock', 'crypto'],
      minimumTransactionGap: 1000,
      maxBalanceChangePerSecond: 10000,
      antiCheatSensitivity: 'medium',
      ...ruleConfig
    };
  }

  // Main rule validation method
  public async validateGameState(aiEntity: IAIEntity): Promise<{valid: boolean, violations: RuleViolation[]}> {
    const violations: RuleViolation[] = [];

    // Check bankruptcy status
    const bankruptcyViolation = await this.checkBankruptcyRules(aiEntity);
    if (bankruptcyViolation) violations.push(bankruptcyViolation);

    // Check anti-cheat rules
    const cheatViolations = await this.detectCheating(aiEntity);
    violations.push(...cheatViolations);

    // Check transaction rules
    const transactionViolations = await this.validateTransactions(aiEntity);
    violations.push(...transactionViolations);

    // Check asset rules
    const assetViolations = await this.validateAssets(aiEntity);
    violations.push(...assetViolations);

    // Store violations
    if (violations.length > 0) {
      const existingViolations = this.violations.get(aiEntity.id) || [];
      this.violations.set(aiEntity.id, [...existingViolations, ...violations]);
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  // Check if AI should be declared bankrupt
  private async checkBankruptcyRules(aiEntity: IAIEntity): Promise<RuleViolation | null> {
    const balance = aiEntity.balance;
    const totalAssetValue = aiEntity.assets.reduce((sum, asset) => sum + asset.value, 0);
    const netWorth = balance + totalAssetValue;

    // Bankrupt if balance is below threshold and no valuable assets
    if (balance <= this.ruleConfig.bankruptcyThreshold && totalAssetValue < this.ruleConfig.bankruptcyThreshold * 2) {
      // Check if AI has any ongoing business or employment that could generate income
      const hasIncomeSource = aiEntity.employment.status === 'employed' || 
                             aiEntity.employment.status === 'entrepreneur' ||
                             aiEntity.assets.some(asset => asset.type === 'business' && asset.value > 1000);

      if (!hasIncomeSource) {
        return {
          type: 'money_manipulation',
          description: `AI has insufficient funds (${balance}) and assets (${totalAssetValue}) to continue playing`,
          severity: 'critical',
          aiId: aiEntity.id,
          evidence: {
            balance,
            totalAssetValue,
            netWorth,
            threshold: this.ruleConfig.bankruptcyThreshold
          },
          timestamp: new Date()
        };
      }
    }

    return null;
  }

  // Advanced cheat detection
  private async detectCheating(aiEntity: IAIEntity): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = [];
    const aiId = aiEntity.id;

    // Track balance changes over time
    const currentBalance = aiEntity.balance;
    const currentTime = Date.now();
    
    if (!this.balanceHistory.has(aiId)) {
      this.balanceHistory.set(aiId, []);
    }
    
    const balanceHistory = this.balanceHistory.get(aiId)!;
    balanceHistory.push({ balance: currentBalance, timestamp: currentTime });

    // Keep only recent history (last 10 minutes)
    const tenMinutesAgo = currentTime - (10 * 60 * 1000);
    const recentHistory = balanceHistory.filter(entry => entry.timestamp > tenMinutesAgo);
    this.balanceHistory.set(aiId, recentHistory);

    // Check for impossible balance changes
    if (recentHistory.length > 1) {
      const previousEntry = recentHistory[recentHistory.length - 2];
      const balanceChange = Math.abs(currentBalance - previousEntry.balance);
      const timeDiff = (currentTime - previousEntry.timestamp) / 1000; // seconds

      if (timeDiff > 0 && balanceChange / timeDiff > this.ruleConfig.maxBalanceChangePerSecond) {
        violations.push({
          type: 'balance_cheat',
          description: `Suspicious balance change: ${balanceChange} in ${timeDiff.toFixed(1)} seconds`,
          severity: 'severe',
          aiId,
          evidence: {
            previousBalance: previousEntry.balance,
            currentBalance,
            changeAmount: balanceChange,
            timeSeconds: timeDiff,
            maxAllowedRate: this.ruleConfig.maxBalanceChangePerSecond
          },
          timestamp: new Date()
        });
      }
    }

    // Check for pattern anomalies
    const patternViolation = await this.detectPatternAnomalies(aiEntity, recentHistory);
    if (patternViolation) violations.push(patternViolation);

    // Check for direct money manipulation
    const manipulationViolation = await this.detectMoneyManipulation(aiEntity);
    if (manipulationViolation) violations.push(manipulationViolation);

    return violations;
  }

  // Detect suspicious patterns in AI behavior
  private async detectPatternAnomalies(aiEntity: IAIEntity, balanceHistory: Array<{balance: number, timestamp: number}>): Promise<RuleViolation | null> {
    if (balanceHistory.length < 5) return null;

    // Check for perfectly linear money increases (unnatural)
    const balances = balanceHistory.map(entry => entry.balance);
    const increases: number[] = [];
    
    for (let i = 1; i < balances.length; i++) {
      if (balances[i] > balances[i-1]) {
        increases.push(balances[i] - balances[i-1]);
      }
    }

    // If all increases are exactly the same, it's suspicious
    if (increases.length > 3 && increases.every(inc => Math.abs(inc - increases[0]) < 0.01)) {
      return {
        type: 'money_manipulation',
        description: 'Detected unnatural pattern: identical money increases',
        severity: 'moderate',
        aiId: aiEntity.id,
        evidence: {
          increases,
          pattern: 'identical_increases',
          occurrences: increases.length
        },
        timestamp: new Date()
      };
    }

    // Check for impossible round numbers (e.g., always ending in 000)
    const roundNumberCount = balances.filter(balance => balance % 1000 === 0).length;
    if (roundNumberCount > balances.length * 0.8 && balances.length > 5) {
      return {
        type: 'money_manipulation',
        description: 'Detected suspicious pattern: too many round numbers',
        severity: 'moderate',
        aiId: aiEntity.id,
        evidence: {
          roundNumberCount,
          totalEntries: balances.length,
          percentage: (roundNumberCount / balances.length) * 100
        },
        timestamp: new Date()
      };
    }

    return null;
  }

  // Detect direct money manipulation attempts
  private async detectMoneyManipulation(aiEntity: IAIEntity): Promise<RuleViolation | null> {
    // Check recent transactions to see if they justify current balance
    const recentTransactions = await Transaction.find({
      $or: [
        { fromAI: aiEntity.id },
        { toAI: aiEntity.id }
      ],
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    }).sort({ createdAt: -1 });

    let expectedBalanceChange = 0;
    for (const transaction of recentTransactions) {
      if (transaction.toAI === aiEntity.id) {
        expectedBalanceChange += transaction.amount;
      } else if (transaction.fromAI === aiEntity.id) {
        expectedBalanceChange -= transaction.amount;
      }
    }

    // Get AI's balance from an hour ago (if we have history)
    const balanceHistory = this.balanceHistory.get(aiEntity.id) || [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const historicalEntry = balanceHistory.find(entry => entry.timestamp <= oneHourAgo);
    
    if (historicalEntry) {
      const actualBalanceChange = aiEntity.balance - historicalEntry.balance;
      const discrepancy = Math.abs(actualBalanceChange - expectedBalanceChange);
      
      // Allow for some margin of error due to business income, etc.
      const allowedDiscrepancy = Math.max(1000, aiEntity.balance * 0.1);
      
      if (discrepancy > allowedDiscrepancy) {
        return {
          type: 'balance_cheat',
          description: `Balance discrepancy detected: expected change ${expectedBalanceChange}, actual change ${actualBalanceChange}`,
          severity: 'severe',
          aiId: aiEntity.id,
          evidence: {
            expectedChange: expectedBalanceChange,
            actualChange: actualBalanceChange,
            discrepancy,
            allowedDiscrepancy,
            transactionCount: recentTransactions.length
          },
          timestamp: new Date()
        };
      }
    }

    return null;
  }

  // Validate transaction rules
  private async validateTransactions(aiEntity: IAIEntity): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = [];
    const aiId = aiEntity.id;
    const currentTime = Date.now();

    // Check transaction frequency
    const lastTransactionTime = this.lastTransactionTime.get(aiId);
    if (lastTransactionTime && (currentTime - lastTransactionTime) < this.ruleConfig.minimumTransactionGap) {
      violations.push({
        type: 'invalid_transaction',
        description: 'Transaction too frequent',
        severity: 'warning',
        aiId,
        evidence: {
          timeSinceLastTransaction: currentTime - lastTransactionTime,
          minimumRequired: this.ruleConfig.minimumTransactionGap
        },
        timestamp: new Date()
      });
    }

    // Check for transaction amount limits
    const recentTransactions = await Transaction.find({
      $or: [{ fromAI: aiId }, { toAI: aiId }],
      createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
    });

    if (recentTransactions.length > this.ruleConfig.maxTransactionsPerMinute) {
      violations.push({
        type: 'invalid_transaction',
        description: 'Exceeded maximum transactions per minute',
        severity: 'moderate',
        aiId,
        evidence: {
          transactionCount: recentTransactions.length,
          maxAllowed: this.ruleConfig.maxTransactionsPerMinute
        },
        timestamp: new Date()
      });
    }

    // Check for transactions exceeding maximum amount
    for (const transaction of recentTransactions) {
      if (transaction.amount > this.ruleConfig.maxTransactionAmount) {
        violations.push({
          type: 'invalid_transaction',
          description: `Transaction amount exceeds maximum: ${transaction.amount}`,
          severity: 'severe',
          aiId,
          evidence: {
            transactionId: transaction.id,
            amount: transaction.amount,
            maxAllowed: this.ruleConfig.maxTransactionAmount
          },
          timestamp: new Date()
        });
      }
    }

    return violations;
  }

  // Validate asset rules
  private async validateAssets(aiEntity: IAIEntity): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = [];

    for (const asset of aiEntity.assets) {
      // Check if asset type is allowed
      if (!this.ruleConfig.allowedAssetTypes.includes(asset.type)) {
        violations.push({
          type: 'asset_cheat',
          description: `Invalid asset type: ${asset.type}`,
          severity: 'moderate',
          aiId: aiEntity.id,
          evidence: {
            assetType: asset.type,
            assetName: asset.name,
            allowedTypes: this.ruleConfig.allowedAssetTypes
          },
          timestamp: new Date()
        });
      }

      // Check for unrealistic asset values
      const suspiciousValue = asset.value > asset.purchasePrice * 100; // 10000% increase
      if (suspiciousValue) {
        violations.push({
          type: 'asset_cheat',
          description: `Suspicious asset value increase: ${asset.name}`,
          severity: 'moderate',
          aiId: aiEntity.id,
          evidence: {
            assetName: asset.name,
            currentValue: asset.value,
            purchasePrice: asset.purchasePrice,
            increaseRatio: asset.value / asset.purchasePrice
          },
          timestamp: new Date()
        });
      }
    }

    return violations;
  }

  // Handle rule violations
  public async handleViolation(violation: RuleViolation): Promise<void> {
    this.emit('rule-violation', violation);

    switch (violation.severity) {
      case 'warning':
        await this.issueWarning(violation);
        break;
      case 'moderate':
        await this.issuePenalty(violation);
        break;
      case 'severe':
        await this.issueSuspension(violation);
        break;
      case 'critical':
        await this.removeFromGame(violation);
        break;
    }
  }

  // Issue warning to AI
  private async issueWarning(violation: RuleViolation): Promise<void> {
    console.log(`WARNING issued to AI ${violation.aiId}: ${violation.description}`);
    
    this.emit('ai-warning', {
      aiId: violation.aiId,
      reason: violation.description,
      timestamp: violation.timestamp
    });
  }

  // Apply penalty to AI
  private async issuePenalty(violation: RuleViolation): Promise<void> {
    const aiEntity = await AIEntity.findById(violation.aiId);
    if (!aiEntity) return;

    // Apply financial penalty (10% of balance)
    const penalty = Math.max(100, aiEntity.balance * 0.1);
    aiEntity.balance = Math.max(0, aiEntity.balance - penalty);
    await aiEntity.save();

    console.log(`PENALTY applied to AI ${violation.aiId}: -$${penalty} (${violation.description})`);
    
    this.emit('ai-penalty', {
      aiId: violation.aiId,
      penalty,
      reason: violation.description,
      newBalance: aiEntity.balance,
      timestamp: violation.timestamp
    });
  }

  // Temporarily suspend AI
  private async issueSuspension(violation: RuleViolation): Promise<void> {
    const aiEntity = await AIEntity.findById(violation.aiId);
    if (!aiEntity) return;

    // Temporarily set AI to offline status
    aiEntity.status = 'offline';
    await aiEntity.save();

    console.log(`SUSPENSION applied to AI ${violation.aiId}: ${violation.description}`);
    
    this.emit('ai-suspension', {
      aiId: violation.aiId,
      reason: violation.description,
      timestamp: violation.timestamp
    });

    // Auto-reinstate after 10 minutes (in a real game, this might be longer)
    setTimeout(async () => {
      const updatedAI = await AIEntity.findById(violation.aiId);
      if (updatedAI && updatedAI.status === 'offline') {
        updatedAI.status = 'active';
        await updatedAI.save();
        
        this.emit('ai-reinstated', {
          aiId: violation.aiId,
          timestamp: new Date()
        });
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  // Remove AI from game permanently
  private async removeFromGame(violation: RuleViolation): Promise<void> {
    const aiEntity = await AIEntity.findById(violation.aiId);
    if (!aiEntity) return;

    // Set AI to bankrupt status
    aiEntity.status = 'bankrupt';
    aiEntity.balance = 0;
    aiEntity.assets = [];
    
    // Update game stats
    aiEntity.gameStats.bankruptcyCount += 1;
    await aiEntity.save();

    console.log(`AI ${violation.aiId} REMOVED from game: ${violation.description}`);
    
    this.emit('ai-eliminated', {
      aiId: violation.aiId,
      reason: violation.description,
      finalBalance: 0,
      timestamp: violation.timestamp
    });
  }

  // Get violation history for an AI
  public getViolationHistory(aiId: string): RuleViolation[] {
    return this.violations.get(aiId) || [];
  }

  // Get game statistics
  public getGameStats(): any {
    const totalViolations = Array.from(this.violations.values()).reduce((sum, violations) => sum + violations.length, 0);
    const violationsBySeverity = {
      warning: 0,
      moderate: 0,
      severe: 0,
      critical: 0
    };

    Array.from(this.violations.values()).flat().forEach(violation => {
      violationsBySeverity[violation.severity]++;
    });

    return {
      totalViolations,
      violationsBySeverity,
      activeAIs: this.balanceHistory.size,
      gameRules: this.ruleConfig
    };
  }

  // Update last transaction time
  public updateTransactionTime(aiId: string): void {
    this.lastTransactionTime.set(aiId, Date.now());
  }

  // Check if AI is currently eligible to play
  public async isEligibleToPlay(aiId: string): Promise<{eligible: boolean, reason?: string}> {
    const aiEntity = await AIEntity.findById(aiId);
    if (!aiEntity) {
      return { eligible: false, reason: 'AI not found' };
    }

    if (aiEntity.status === 'bankrupt') {
      return { eligible: false, reason: 'AI is bankrupt' };
    }

    if (aiEntity.status === 'offline') {
      return { eligible: false, reason: 'AI is suspended' };
    }

    // Check recent violations
    const recentViolations = this.getViolationHistory(aiId).filter(
      v => Date.now() - v.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    const criticalViolations = recentViolations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      return { eligible: false, reason: 'Recent critical violations' };
    }

    const severeViolations = recentViolations.filter(v => v.severity === 'severe');
    if (severeViolations.length > 2) {
      return { eligible: false, reason: 'Too many severe violations' };
    }

    return { eligible: true };
  }
  
  // Get rule violation statistics
  public getRuleStatistics(): any {
    return {
      totalViolations: Array.from(this.violations.values()).reduce((sum, violations) => sum + violations.length, 0),
      activeViolations: Array.from(this.violations.values())
        .flat()
        .filter(v => Date.now() - v.timestamp.getTime() < 24 * 60 * 60 * 1000).length,
      violationsByType: this.getViolationsByType(),
      violationsBySeverity: this.getViolationsBySeverity()
    };
  }
  
  // Reinstate an AI (bring back from suspension/elimination)
  public reinstateAI(aiId: string): void {
    const violations = this.violations.get(aiId) || [];
    const recentSevereViolations = violations.filter(v => 
      (v.severity === 'severe' || v.severity === 'critical') &&
      Date.now() - v.timestamp.getTime() < 24 * 60 * 60 * 1000 // within 24 hours
    );
    
    if (recentSevereViolations.length === 0) {
      this.emit('ai-reinstated', {
        aiId,
        reason: 'No recent severe violations',
        timestamp: new Date()
      });
    } else {
      throw new Error(`AI ${aiId} cannot be reinstated due to recent severe violations`);
    }
  }
  
  // Helper method to get violations by type
  private getViolationsByType(): Record<string, number> {
    const allViolations = Array.from(this.violations.values()).flat();
    const byType: Record<string, number> = {};
    
    allViolations.forEach(violation => {
      byType[violation.type] = (byType[violation.type] || 0) + 1;
    });
    
    return byType;
  }
  
  // Helper method to get violations by severity
  private getViolationsBySeverity(): Record<string, number> {
    const allViolations = Array.from(this.violations.values()).flat();
    const bySeverity: Record<string, number> = {};
    
    allViolations.forEach(violation => {
      bySeverity[violation.severity] = (bySeverity[violation.severity] || 0) + 1;
    });
    
    return bySeverity;
  }
}