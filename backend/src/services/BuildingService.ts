import { EventEmitter } from 'events';

// 建筑物接口
export interface Building {
  id: string;
  name: string;
  position: [number, number]; // [lng, lat]
  type: 'financial' | 'business' | 'hospitality' | 'retail' | 'government';
  description: string;
  activities: string[];
  capacity: number;
  currentOccupants: string[]; // AI IDs
}

// AI活动接口
export interface AIActivity {
  aiId: string;
  buildingId: string;
  activity: string;
  startTime: Date;
  duration: number; // 分钟
  status: 'pending' | 'active' | 'completed' | 'interrupted';
  result?: any;
}

// AI建筑物移动接口
export interface AIMovement {
  aiId: string;
  fromBuilding: string;
  toBuilding: string;
  reason: string;
  estimatedTime: number; // 分钟
  status: 'traveling' | 'arrived';
}

export class BuildingService extends EventEmitter {
  private buildings: Map<string, Building> = new Map();
  private aiActivities: Map<string, AIActivity> = new Map();
  private aiMovements: Map<string, AIMovement> = new Map();
  private aiCurrentBuilding: Map<string, string> = new Map();

  constructor() {
    super();
    this.initializeBuildings();
    this.startActivitySimulation();
  }

  // 初始化建筑物
  private initializeBuildings(): void {
    const buildingsData: Building[] = [
      {
        id: 'central-bank',
        name: '中央银行',
        position: [116.397428, 39.90923],
        type: 'financial',
        description: '提供金融服务，AI可在此进行转账、贷款、投资等操作',
        activities: ['大额转账', '贷款申请', '投资咨询', '外汇交易', '风险评估'],
        capacity: 10,
        currentOccupants: []
      },
      {
        id: 'business-tower',
        name: '商务办公楼',
        position: [116.405285, 39.904989],
        type: 'business',
        description: '商务办公场所，AI可进行数据分析、会议、决策等',
        activities: ['数据分析', '商务会议', '策略制定', '报告撰写', '团队协作'],
        capacity: 20,
        currentOccupants: []
      },
      {
        id: 'grand-hotel',
        name: '国际酒店',
        position: [116.395645, 39.913423],
        type: 'hospitality',
        description: '高级酒店，AI可在此进行商务洽谈、休息等',
        activities: ['商务洽谈', '网络会议', '休息调整', '社交活动', '私人会面'],
        capacity: 15,
        currentOccupants: []
      },
      {
        id: 'shopping-mall',
        name: '购物中心',
        position: [116.400000, 39.900000],
        type: 'retail',
        description: '大型购物中心，AI可观察消费趋势、市场调研',
        activities: ['市场调研', '消费观察', '趋势分析', '购物体验', '消费者访谈'],
        capacity: 25,
        currentOccupants: []
      },
      {
        id: 'stock-exchange',
        name: '证券交易所',
        position: [116.410000, 39.920000],
        type: 'financial',
        description: '证券交易所，AI进行股票交易的主要场所',
        activities: ['股票交易', '期货交易', '市场监控', '风险评估', '投资决策'],
        capacity: 12,
        currentOccupants: []
      },
      {
        id: 'tech-park',
        name: '科技园区',
        position: [116.385000, 39.915000],
        type: 'business',
        description: '高科技产业园区，AI可进行技术研发、创新等',
        activities: ['技术研发', '产品测试', '创新workshop', '技术交流', '项目孵化'],
        capacity: 30,
        currentOccupants: []
      }
    ];

    buildingsData.forEach(building => {
      this.buildings.set(building.id, building);
    });

    console.log(`🏢 已初始化 ${buildingsData.length} 个建筑物`);
  }

  // 获取所有建筑物
  public getBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  // 获取特定建筑物
  public getBuilding(id: string): Building | undefined {
    return this.buildings.get(id);
  }

  // AI进入建筑物
  public enterBuilding(aiId: string, buildingId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) {
      console.error(`建筑物 ${buildingId} 不存在`);
      return false;
    }

    if (building.currentOccupants.length >= building.capacity) {
      console.warn(`建筑物 ${building.name} 已满员`);
      return false;
    }

    // 从之前的建筑物移除
    const currentBuilding = this.aiCurrentBuilding.get(aiId);
    if (currentBuilding && currentBuilding !== buildingId) {
      this.leaveBuilding(aiId, currentBuilding);
    }

    // 进入新建筑物
    if (!building.currentOccupants.includes(aiId)) {
      building.currentOccupants.push(aiId);
      this.aiCurrentBuilding.set(aiId, buildingId);
      
      this.emit('aiEnterBuilding', {
        aiId,
        buildingId,
        buildingName: building.name,
        timestamp: new Date()
      });

      console.log(`🤖 AI ${aiId} 进入了 ${building.name}`);
      return true;
    }

    return false;
  }

  // AI离开建筑物
  public leaveBuilding(aiId: string, buildingId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;

    const index = building.currentOccupants.indexOf(aiId);
    if (index > -1) {
      building.currentOccupants.splice(index, 1);
      this.aiCurrentBuilding.delete(aiId);
      
      this.emit('aiLeaveBuilding', {
        aiId,
        buildingId,
        buildingName: building.name,
        timestamp: new Date()
      });

      console.log(`🤖 AI ${aiId} 离开了 ${building.name}`);
      return true;
    }

    return false;
  }

  // 开始活动
  public startActivity(aiId: string, buildingId: string, activity: string): string | null {
    const building = this.buildings.get(buildingId);
    if (!building) return null;

    if (!building.activities.includes(activity)) {
      console.error(`建筑物 ${building.name} 不支持活动: ${activity}`);
      return null;
    }

    if (!building.currentOccupants.includes(aiId)) {
      console.error(`AI ${aiId} 不在建筑物 ${building.name} 中`);
      return null;
    }

    const activityId = `${aiId}-${buildingId}-${Date.now()}`;
    const aiActivity: AIActivity = {
      aiId,
      buildingId,
      activity,
      startTime: new Date(),
      duration: Math.floor(Math.random() * 30) + 10, // 10-40分钟
      status: 'active'
    };

    this.aiActivities.set(activityId, aiActivity);

    this.emit('aiStartActivity', {
      activityId,
      aiId,
      buildingId,
      buildingName: building.name,
      activity,
      timestamp: new Date()
    });

    console.log(`🎯 AI ${aiId} 在 ${building.name} 开始了活动: ${activity}`);

    // 设置活动完成定时器
    setTimeout(() => {
      this.completeActivity(activityId);
    }, aiActivity.duration * 60 * 1000);

    return activityId;
  }

  // 完成活动
  private completeActivity(activityId: string): void {
    const activity = this.aiActivities.get(activityId);
    if (!activity) return;

    activity.status = 'completed';
    activity.result = this.generateActivityResult(activity);

    const building = this.buildings.get(activity.buildingId);
    
    this.emit('aiCompleteActivity', {
      activityId,
      aiId: activity.aiId,
      buildingId: activity.buildingId,
      buildingName: building?.name,
      activity: activity.activity,
      result: activity.result,
      timestamp: new Date()
    });

    console.log(`✅ AI ${activity.aiId} 完成了活动: ${activity.activity}`);
  }

  // 生成活动结果
  private generateActivityResult(activity: AIActivity): any {
    const building = this.buildings.get(activity.buildingId);
    if (!building) return null;

    switch (building.type) {
      case 'financial':
        return {
          type: 'financial',
          amount: Math.floor(Math.random() * 100000) + 10000,
          success: Math.random() > 0.2,
          profit: Math.floor(Math.random() * 20000) - 10000
        };
      case 'business':
        return {
          type: 'business',
          insights: Math.floor(Math.random() * 5) + 1,
          decisions: Math.floor(Math.random() * 3) + 1,
          efficiency: Math.random() * 100
        };
      case 'retail':
        return {
          type: 'retail',
          marketTrend: Math.random() > 0.5 ? 'up' : 'down',
          consumerSentiment: Math.floor(Math.random() * 100),
          opportunities: Math.floor(Math.random() * 10) + 1
        };
      default:
        return {
          type: 'general',
          value: Math.floor(Math.random() * 100)
        };
    }
  }

  // 获取AI当前位置
  public getAICurrentBuilding(aiId: string): string | undefined {
    return this.aiCurrentBuilding.get(aiId);
  }

  // 获取AI活动历史
  public getAIActivities(aiId: string): AIActivity[] {
    return Array.from(this.aiActivities.values())
      .filter(activity => activity.aiId === aiId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  // 获取建筑物当前活动
  public getBuildingActivities(buildingId: string): AIActivity[] {
    return Array.from(this.aiActivities.values())
      .filter(activity => activity.buildingId === buildingId && activity.status === 'active');
  }

  // 移动AI到建筑物
  public moveAIToBuilding(aiId: string, fromBuildingId: string, toBuildingId: string, reason: string): boolean {
    const fromBuilding = this.buildings.get(fromBuildingId);
    const toBuilding = this.buildings.get(toBuildingId);
    
    if (!fromBuilding || !toBuilding) return false;

    const movement: AIMovement = {
      aiId,
      fromBuilding: fromBuildingId,
      toBuilding: toBuildingId,
      reason,
      estimatedTime: Math.floor(Math.random() * 10) + 5, // 5-15分钟
      status: 'traveling'
    };

    this.aiMovements.set(aiId, movement);

    this.emit('aiStartMovement', {
      aiId,
      fromBuilding: fromBuilding.name,
      toBuilding: toBuilding.name,
      reason,
      timestamp: new Date()
    });

    // 离开当前建筑物
    this.leaveBuilding(aiId, fromBuildingId);

    // 模拟移动时间
    setTimeout(() => {
      movement.status = 'arrived';
      this.enterBuilding(aiId, toBuildingId);
      this.aiMovements.delete(aiId);
      
      this.emit('aiArriveBuilding', {
        aiId,
        buildingId: toBuildingId,
        buildingName: toBuilding.name,
        timestamp: new Date()
      });
    }, movement.estimatedTime * 60 * 1000);

    return true;
  }

  // 开始活动模拟
  private startActivitySimulation(): void {
    setInterval(() => {
      this.simulateRandomActivity();
    }, 30000); // 每30秒模拟一次活动
  }

  // 模拟随机活动
  private simulateRandomActivity(): void {
    const buildings = Array.from(this.buildings.values());
    const occupiedBuildings = buildings.filter(b => b.currentOccupants.length > 0);
    
    if (occupiedBuildings.length === 0) return;

    const randomBuilding = occupiedBuildings[Math.floor(Math.random() * occupiedBuildings.length)];
    const randomAI = randomBuilding.currentOccupants[Math.floor(Math.random() * randomBuilding.currentOccupants.length)];
    const randomActivity = randomBuilding.activities[Math.floor(Math.random() * randomBuilding.activities.length)];

    // 检查AI是否已经在进行活动
    const activeActivities = Array.from(this.aiActivities.values())
      .filter(activity => activity.aiId === randomAI && activity.status === 'active');

    if (activeActivities.length === 0) {
      this.startActivity(randomAI, randomBuilding.id, randomActivity);
    }
  }

  // 获取统计信息
  public getStatistics() {
    const totalBuildings = this.buildings.size;
    const totalOccupants = Array.from(this.buildings.values())
      .reduce((sum, building) => sum + building.currentOccupants.length, 0);
    const activeActivities = Array.from(this.aiActivities.values())
      .filter(activity => activity.status === 'active').length;
    const totalActivitiesCompleted = Array.from(this.aiActivities.values())
      .filter(activity => activity.status === 'completed').length;

    return {
      totalBuildings,
      totalOccupants,
      activeActivities,
      totalActivitiesCompleted,
      buildingUtilization: totalBuildings > 0 ? (totalOccupants / totalBuildings) * 100 : 0
    };
  }
}

// 单例模式
export const buildingService = new BuildingService();