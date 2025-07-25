import React, { useEffect, useState } from 'react';
import { useAIPositions } from '../hooks/useSocket';

interface AIPosition {
  id: string;
  name: string;
  lng: number;
  lat: number;
  status: 'active' | 'trading' | 'thinking' | 'idle' | 'bankrupt';
  balance: number;
  color: string;
}

interface MockMapComponentProps {
  className?: string;
}

// 示例AI位置数据 - 在实际应用中这些数据会来自Socket.io实时更新
const mockAIPositions: AIPosition[] = [
  { id: 'ai1', name: 'Alex Trader', lng: 116.397428, lat: 39.90923, status: 'trading', balance: 12500, color: '#10b981' },
  { id: 'ai2', name: 'Sam Business', lng: 116.405285, lat: 39.904989, status: 'active', balance: 8900, color: '#3b82f6' },
  { id: 'ai3', name: 'Jordan Investor', lng: 116.395645, lat: 39.913423, status: 'thinking', balance: 15200, color: '#8b5cf6' },
  { id: 'ai4', name: 'Riley Entrepreneur', lng: 116.400000, lat: 39.900000, status: 'idle', balance: 7300, color: '#f59e0b' },
  { id: 'ai5', name: 'Morgan Analyst', lng: 116.410000, lat: 39.920000, status: 'active', balance: 11800, color: '#ef4444' },
];

// 状态对应的中文标签
const statusLabels: { [key: string]: string } = {
  'active': '活跃',
  'trading': '交易中',
  'thinking': '思考中',
  'idle': '空闲',
  'bankrupt': '破产'
};



export const MockMapComponent: React.FC<MockMapComponentProps> = ({ className }) => {
  const { positions: realtimePositions, updatePosition } = useAIPositions();
  const [aiPositions, setAiPositions] = useState<AIPosition[]>(mockAIPositions);
  const [selectedAI, setSelectedAI] = useState<AIPosition | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 使用实时数据或模拟数据
  useEffect(() => {
    if (realtimePositions.length > 0) {
      // 使用实时Socket.io数据
      setAiPositions(realtimePositions);
    } else {
      // 使用模拟数据并向服务器发送更新
      const interval = setInterval(() => {
        const updatedPositions = mockAIPositions.map(ai => {
          const newPosition = {
            ...ai,
            lng: ai.lng + (Math.random() - 0.5) * 0.001,
            lat: ai.lat + (Math.random() - 0.5) * 0.001,
            balance: ai.balance + Math.floor((Math.random() - 0.5) * 100),
            status: Math.random() > 0.7 ? 
              (['active', 'trading', 'thinking', 'idle'] as const)[Math.floor(Math.random() * 4)] : 
              ai.status
          };
          
          // 发送位置更新到服务器
          updatePosition(newPosition);
          
          return newPosition;
        });
        
        setAiPositions(updatedPositions);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [realtimePositions, updatePosition]);

  const handleAIClick = (ai: AIPosition) => {
    setSelectedAI(ai);
  };

  const formatCoordinate = (value: number, type: 'lng' | 'lat') => {
    return `${value.toFixed(6)}°${type === 'lng' ? 'E' : 'N'}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'trading':
        return '🔵';
      case 'thinking':
        return '🟣';
      case 'idle':
        return '🟡';
      case 'bankrupt':
        return '🔴';
      default:
        return '⚫';
    }
  };

  return (
    <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg overflow-hidden ${className}`}>
      {/* 头部控制栏 */}
      <div className="bg-gray-800 border-b border-cyan-500/30 px-4 py-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-cyan-400">AI 代理实时位置</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">视图模式:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                网格
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'list' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                列表
              </button>
            </div>
            <div className="text-sm text-gray-400">
              在线: {aiPositions.filter(ai => ai.status !== 'bankrupt').length}/{aiPositions.length}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiPositions.map((ai) => (
              <div
                key={ai.id}
                onClick={() => handleAIClick(ai)}
                className={`p-4 bg-gray-800 border rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedAI?.id === ai.id 
                    ? 'border-cyan-500 bg-cyan-900/20' 
                    : 'border-gray-600 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full animate-pulse"
                      style={{ backgroundColor: ai.color }}
                    />
                    <span className="font-medium text-white">{ai.name}</span>
                  </div>
                  <span className="text-lg">{getStatusIcon(ai.status)}</span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">状态:</span>
                    <span className="text-cyan-400">{statusLabels[ai.status]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">余额:</span>
                    <span className="text-green-400">${ai.balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">经度:</span>
                    <span className="text-yellow-400 font-mono text-xs">{formatCoordinate(ai.lng, 'lng')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">纬度:</span>
                    <span className="text-yellow-400 font-mono text-xs">{formatCoordinate(ai.lat, 'lat')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {aiPositions.map((ai) => (
              <div
                key={ai.id}
                onClick={() => handleAIClick(ai)}
                className={`p-3 bg-gray-800 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedAI?.id === ai.id 
                    ? 'border-cyan-500 bg-cyan-900/20' 
                    : 'border-gray-600 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full animate-pulse"
                      style={{ backgroundColor: ai.color }}
                    />
                    <div>
                      <div className="font-medium text-white">{ai.name}</div>
                      <div className="text-sm text-gray-400">
                        {formatCoordinate(ai.lng, 'lng')} • {formatCoordinate(ai.lat, 'lat')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-cyan-400">{statusLabels[ai.status]}</div>
                      <div className="text-sm text-green-400">${ai.balance.toLocaleString()}</div>
                    </div>
                    <span className="text-xl">{getStatusIcon(ai.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 选中AI的详细信息 */}
      {selectedAI && (
        <div className="bg-gray-800 border-t border-cyan-500/30 p-4">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-lg font-bold text-cyan-400">选中代理详情</h4>
            <button
              onClick={() => setSelectedAI(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">代理名称</div>
              <div className="text-white font-medium">{selectedAI.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">当前状态</div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">{getStatusIcon(selectedAI.status)}</span>
                <span className="text-cyan-400">{statusLabels[selectedAI.status]}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">账户余额</div>
              <div className="text-green-400 font-medium">${selectedAI.balance.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">位置坐标</div>
              <div className="text-yellow-400 font-mono text-sm">
                {formatCoordinate(selectedAI.lng, 'lng')}<br />
                {formatCoordinate(selectedAI.lat, 'lat')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 状态说明 */}
      <div className="bg-gray-800 border-t border-cyan-500/30 p-3">
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon(status)}</span>
              <span className="text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};