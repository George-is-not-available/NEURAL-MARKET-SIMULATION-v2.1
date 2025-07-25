import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { MapComponent, FinancialChart } from '../components';
import { useGameState, useAIMessages, useAIThoughts, useSocketConnection } from '../hooks/useSocket';
import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { gameState, startSimulation, pauseSimulation, resetSimulation } = useGameState();
  const { messages } = useAIMessages();
  const { thoughts } = useAIThoughts();
  const { isConnected } = useSocketConnection();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 添加一些数据点动画
  const renderDataPoints = () => {
    return Array.from({ length: 15 }).map((_, index) => (
      <div 
        key={index}
        className="data-point" 
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
        }}
      />
    ));
  };

  return (
    <div className="dashboard-container">
      <PageHeader
        title="控制中心"
        subtitle="NEURAL COMMAND CENTER"
        icon="🎮"
      />
      
      <div className="page-content">
      {/* Core Monitoring Panel */}
        <div className="card-grid">
        {/* Real-time Map View */}
          <div className="card-grid-span-8 dashboard-card holographic glow-border p-6 rounded-xl shadow-2xl shadow-neon">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center neon-text title-underline">
                <span className="status-indicator status-active mr-3"></span>
              实时地图视图
            </h2>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping delay-100"></div>
              <div className="w-3 h-3 bg-red-400 rounded-full animate-ping delay-200"></div>
            </div>
          </div>
            <div className="relative">
              {renderDataPoints()}
          <MapComponent className="h-80" />
            </div>
        </div>
        
        {/* AI Status Panel */}
          <div className="card-grid-span-4 dashboard-card holographic glow-border p-6 rounded-xl shadow-2xl shadow-neon">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center neon-text title-underline">
              <span className="status-indicator status-active mr-3"></span>
            AI 状态监控
          </h2>
          <div className="space-y-4">
            {['Alex Trader', 'Sam Business', 'Jordan Investor'].map((name, index) => (
                <div key={name} className="glassmorphism p-4 rounded-lg border card-3d">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-mono text-sm digital-clock">{name}</span>
                  <div className="flex items-center space-x-2">
                      <div className={`status-indicator ${
                        index === 0 ? 'status-active' : index === 1 ? 'status-warning' : 'bg-blue-400 animate-pulse'
                      }`}></div>
                    <span className="text-xs text-gray-400">ACTIVE</span>
                  </div>
                </div>
                  <div className="text-xs text-cyan-300 mb-2">Balance: <span className="digital-clock">${(10000 + Math.random() * 5000).toFixed(0)}</span></div>
                  <div className="progress-bar">
                    <div className="progress-value" style={{width: `${60 + Math.random() * 40}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Data Monitoring Area */}
        <div className="card-grid">
        {/* Financial Growth Monitor */}
          <div className="card-grid-span-6 dashboard-card holographic glow-border p-6 rounded-xl shadow-2xl shadow-neon">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center neon-text title-underline">
              <span className="status-indicator status-active mr-3"></span>
            资金增长监控
          </h2>
          <FinancialChart className="h-64" />
        </div>
        
        {/* AI Conversation Monitoring */}
          <div className="card-grid-span-6 dashboard-card holographic glow-border p-6 rounded-xl shadow-2xl shadow-neon">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center neon-text title-underline">
              <span className="status-indicator status-active mr-3"></span>
            AI 对话监控
          </h2>
            <div className="glassmorphism rounded-lg h-64 overflow-hidden">
              <div className="p-4 space-y-3 h-full overflow-y-auto dashboard-scrollbar">
                <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2">
                  <span>[NEURAL CHAT LOG]</span>
                  <span className="digital-clock">{messages.length}</span>
                  <span className="blinking-cursor">_</span>
                </div>
              {messages.slice(-10).map((message, index) => (
                  <div key={message.id || index} className="glassmorphism p-2 rounded text-xs">
                  <span className="text-cyan-400">[{message.senderId}]:</span>
                  <span className="text-white ml-2">{message.message}</span>
                  {(message as any).isLie && <span className="text-red-400 ml-2">🎭</span>}
                </div>
              ))}
              {messages.length === 0 && (
                <>
                    <div className="glassmorphism p-2 rounded text-xs">
                    <span className="text-cyan-400">[Alex]:</span>
                    <span className="text-white ml-2">Looking for investment opportunities...</span>
                  </div>
                    <div className="glassmorphism p-2 rounded text-xs">
                    <span className="text-green-400">[Sam]:</span>
                    <span className="text-white ml-2">Starting new business venture in tech sector</span>
                  </div>
                    <div className="glassmorphism p-2 rounded text-xs">
                    <span className="text-purple-400">[Jordan]:</span>
                    <span className="text-white ml-2">Market analysis shows positive trends</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Control Panel */}
        <div className="card-grid">
        {/* 系统控制 */}
          <div className="card-grid-span-8 dashboard-card holographic glow-border p-6 rounded-xl shadow-2xl shadow-neon matrix-background">
          <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center neon-text title-underline">
                <span className="status-indicator status-active mr-3"></span>
              系统控制面板
            </h2>
            <div className="flex items-center space-x-2">
                <div className="px-3 py-1 glassmorphism rounded-full text-green-400 text-sm font-mono digital-clock">
                ONLINE
              </div>
            </div>
          </div>

          {/* 控制按钮矩阵 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button 
              onClick={gameState.isRunning ? pauseSimulation : startSimulation}
                className={`btn-cyberpunk group relative overflow-hidden p-6 rounded-xl ${
                gameState.isRunning 
                    ? 'border-red-500/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-400/20'
                    : 'border-green-500/50 hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center">
                <span className={`text-4xl mr-4 ${gameState.isRunning ? 'text-red-400' : 'text-green-400'}`}>
                  {gameState.isRunning ? '⏸' : '▶'}
                </span>
                  <div className="text-left text-white">
                  <div className={`text-lg font-bold ${gameState.isRunning ? 'text-red-400' : 'text-green-400'}`}>
                    {gameState.isRunning ? 'PAUSE' : 'START'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {gameState.isRunning ? 'Pause System' : 'Start Simulation'}
                  </div>
                </div>
              </div>
            </button>

            <button 
              onClick={resetSimulation}
                className="btn-cyberpunk group relative overflow-hidden p-6 rounded-xl border border-yellow-500/50 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center">
                <span className="text-4xl mr-4 text-yellow-400">🔄</span>
                  <div className="text-left text-white">
                  <div className="text-lg font-bold text-yellow-400">RESET</div>
                  <div className="text-sm text-gray-400">Reset Matrix</div>
                </div>
              </div>
            </button>
          </div>

          {/* 系统状态显示 */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Active Agents', value: gameState.activeAgents || 5, color: 'green', unit: '' },
              { label: 'Game Round', value: gameState.currentRound || 0, color: 'blue', unit: '' },
              { label: 'Market Value', value: (gameState.totalMarketValue || 45782), color: 'purple', unit: '$' },
            ].map((stat) => (
                <div key={stat.label} className="glassmorphism rounded-lg p-4 card-3d">
                  <div className={`text-2xl font-bold text-${stat.color}-400 font-mono digital-clock`}>
                  {stat.unit}{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                  <div className="progress-bar mt-2">
                    <div className="progress-value" style={{width: `${Math.random() * 100}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 实时活动监控 */}
          <div className="card-grid-span-4 dashboard-card holographic glow-border p-6 rounded-xl shadow-2xl shadow-neon">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center neon-text title-underline">
              <span className="status-indicator status-active mr-3"></span>
            实时活动
          </h2>
          
            <div className="space-y-3 max-h-96 overflow-y-auto dashboard-scrollbar">
            {/* 最新消息 */}
            {messages.slice(-5).map((message, index) => (
                <div key={index} className="glassmorphism border-l-2 border-blue-400 p-3 rounded card-3d">
                  <div className="text-blue-400 text-xs font-mono digital-clock">[CHAT]</div>
                <div className="text-white text-sm">{message.senderId}: {message.message}</div>
                <div className="text-gray-400 text-xs mt-1">{new Date(message.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
            
            {/* 最新思考 */}
            {thoughts.slice(-3).map((thought, index) => (
                <div key={index} className="glassmorphism border-l-2 border-purple-400 p-3 rounded card-3d">
                  <div className="text-purple-400 text-xs font-mono digital-clock">[THOUGHT]</div>
                <div className="text-white text-sm">{thought.agentName}: {thought.thought}</div>
                <div className="text-gray-400 text-xs mt-1">
                  {thought.confidence && `Confidence: ${Math.round(thought.confidence)}%`}
                </div>
              </div>
            ))}

            {/* 如果没有数据显示默认内容 */}
            {messages.length === 0 && thoughts.length === 0 && (
                <div className="text-center py-8 glassmorphism rounded-lg p-4">
                  <div className="text-4xl mb-4">
                    <div className="w-16 h-16 mx-auto relative">
                      <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping"></div>
                      <div className="absolute inset-2 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full"></div>
                      <div className="absolute inset-4 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-cyan-400 neon-text">等待AI活动数据...</div>
                  <div className="text-xs text-gray-500 mt-2">系统正在建立神经连接 <span className="blinking-cursor">_</span></div>
                  
                  {/* 数据可视化网格 */}
                  <div className="data-grid mt-6 max-w-xs mx-auto">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="data-grid-item" 
                        style={{ 
                          opacity: Math.random() * 0.7 + 0.3,
                          height: `${Math.random() * 20 + 10}px` 
                        }} 
                      />
                    ))}
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 快速统计 */}
        <div className="info-card-grid">
        {[
          { icon: '💬', label: 'Messages', value: messages.length, trend: '+12%' },
          { icon: '🧠', label: 'Thoughts', value: thoughts.length, trend: '+8%' },
          { icon: '⚡', label: 'Actions', value: Math.floor(Math.random() * 100), trend: '+25%' },
          { icon: '🎯', label: 'Success Rate', value: '87%', trend: '+3%' },
        ].map((metric, index) => (
            <div key={index} className="dashboard-card card-3d glassmorphism rounded-xl p-4 hover:border-cyan-500/50 transition-all duration-300 shadow-neon">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{metric.icon}</span>
                <span className="text-green-400 text-sm font-mono digital-clock">{metric.trend}</span>
            </div>
              <div className="text-2xl font-bold text-white digital-clock">{metric.value}</div>
            <div className="text-sm text-gray-400">{metric.label}</div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};