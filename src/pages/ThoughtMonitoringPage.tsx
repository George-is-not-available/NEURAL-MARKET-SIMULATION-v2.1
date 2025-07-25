import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAIThoughts, useSocketConnection } from '../hooks/useSocket';

interface ThoughtFilter {
  aiId?: string;
  thoughtType?: 'decision' | 'observation' | 'planning' | 'emotion' | 'all';
  confidenceRange?: 'high' | 'medium' | 'low' | 'all';
  timeRange?: '1h' | '6h' | '24h' | 'all';
  searchTerm?: string;
}

export const ThoughtMonitoringPage: React.FC = () => {
  const { thoughts } = useAIThoughts();
  const { isConnected, connectionStatus } = useSocketConnection();
  const [filter, setFilter] = useState<ThoughtFilter>({
    thoughtType: 'all',
    confidenceRange: 'all',
    timeRange: '6h',
    searchTerm: ''
  });
  const [selectedThought, setSelectedThought] = useState<any>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const thoughtsEndRef = useRef<HTMLDivElement>(null);
  const thoughtsContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new thoughts arrive
  useEffect(() => {
    if (autoScroll && thoughtsEndRef.current) {
      thoughtsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thoughts, autoScroll]);

  // Filter thoughts based on current filter settings
  const filteredThoughts = thoughts.filter(thought => {
    // Time range filter
    if (filter.timeRange && filter.timeRange !== 'all') {
      const now = new Date();
      const thoughtTime = new Date(thought.timestamp);
      const hoursAgo = parseInt(filter.timeRange);
      if (now.getTime() - thoughtTime.getTime() > hoursAgo * 60 * 60 * 1000) {
        return false;
      }
    }

    // AI ID filter
    if (filter.aiId && thought.agentId !== filter.aiId) {
      return false;
    }

    // Thought type filter
    if (filter.thoughtType && filter.thoughtType !== 'all') {
      const thoughtContent = thought.thought.toLowerCase();
      switch (filter.thoughtType) {
        case 'decision':
          if (!thoughtContent.includes('decide') && !thoughtContent.includes('choose') && !thoughtContent.includes('should')) return false;
          break;
        case 'observation':
          if (!thoughtContent.includes('notice') && !thoughtContent.includes('see') && !thoughtContent.includes('observe')) return false;
          break;
        case 'planning':
          if (!thoughtContent.includes('plan') && !thoughtContent.includes('strategy') && !thoughtContent.includes('next')) return false;
          break;
        case 'emotion':
          if (!thoughtContent.includes('feel') && !thoughtContent.includes('worried') && !thoughtContent.includes('excited')) return false;
          break;
      }
    }

    // Confidence range filter
    if (filter.confidenceRange && filter.confidenceRange !== 'all' && thought.confidence) {
      const confidence = thought.confidence;
      switch (filter.confidenceRange) {
        case 'high':
          if (confidence < 75) return false;
          break;
        case 'medium':
          if (confidence < 25 || confidence >= 75) return false;
          break;
        case 'low':
          if (confidence >= 25) return false;
          break;
      }
    }

    // Search term filter
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      if (!thought.thought.toLowerCase().includes(searchLower) && 
          !thought.agentId.toLowerCase().includes(searchLower) &&
          !(thought.agentName && thought.agentName.toLowerCase().includes(searchLower))) {
        return false;
      }
    }

    return true;
  });

  const getThoughtTypeColor = (thought: string) => {
    const content = thought.toLowerCase();
    if (content.includes('decide') || content.includes('choose')) return 'border-purple-400 bg-purple-500/10';
    if (content.includes('notice') || content.includes('observe')) return 'border-blue-400 bg-blue-500/10';
    if (content.includes('plan') || content.includes('strategy')) return 'border-green-400 bg-green-500/10';
    if (content.includes('feel') || content.includes('worried')) return 'border-pink-400 bg-pink-500/10';
    if (content.includes('money') || content.includes('business')) return 'border-yellow-400 bg-yellow-500/10';
    return 'border-gray-400 bg-gray-500/10';
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 75) return 'text-green-400';
    if (confidence >= 50) return 'text-yellow-400';
    if (confidence >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  const getUniqueAIIds = () => {
    const ids = new Set(thoughts.map(thought => thought.agentId));
    return Array.from(ids);
  };

  const handleScroll = () => {
    if (thoughtsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = thoughtsContainerRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setAutoScroll(isNearBottom);
    }
  };

  const getThoughtStats = () => {
    const stats = {
      total: thoughts.length,
      filtered: filteredThoughts.length,
      highConfidence: thoughts.filter(t => t.confidence && t.confidence >= 75).length,
      recent: thoughts.filter(t => Date.now() - new Date(t.timestamp).getTime() < 60 * 60 * 1000).length
    };
    return stats;
  };

  const stats = getThoughtStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 p-6">
      <PageHeader
        title="思维监控中心"
        subtitle="THOUGHT MONITORING CONSOLE"
        icon="🧠"
      />

      {/* Connection Status & Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Connection</div>
              <div className={`text-lg font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {connectionStatus.toUpperCase()}
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Thoughts</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Filtered</div>
          <div className="text-2xl font-bold text-purple-400">{stats.filtered}</div>
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">High Confidence</div>
          <div className="text-2xl font-bold text-green-400">{stats.highConfidence}</div>
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Recent (1h)</div>
          <div className="text-2xl font-bold text-cyan-400">{stats.recent}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Filter Panel */}
        <div className="xl:col-span-1 bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
            思维过滤器
          </h3>

          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">搜索思维</label>
              <input
                type="text"
                placeholder="Search thoughts..."
                value={filter.searchTerm || ''}
                onChange={(e) => setFilter({...filter, searchTerm: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none"
              />
            </div>

            {/* AI ID Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">AI 筛选</label>
              <select
                value={filter.aiId || ''}
                onChange={(e) => setFilter({...filter, aiId: e.target.value || undefined})}
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="">All AIs</option>
                {getUniqueAIIds().map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>

            {/* Thought Type Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">思维类型</label>
              <select
                value={filter.thoughtType || 'all'}
                onChange={(e) => setFilter({...filter, thoughtType: e.target.value as any})}
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="decision">Decision Making</option>
                <option value="observation">Observations</option>
                <option value="planning">Planning</option>
                <option value="emotion">Emotional</option>
              </select>
            </div>

            {/* Confidence Range Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">置信度范围</label>
              <select
                value={filter.confidenceRange || 'all'}
                onChange={(e) => setFilter({...filter, confidenceRange: e.target.value as any})}
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="all">All Confidence</option>
                <option value="high">High (75%+)</option>
                <option value="medium">Medium (25-74%)</option>
                <option value="low">Low (0-24%)</option>
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">时间范围</label>
              <select
                value={filter.timeRange || 'all'}
                onChange={(e) => setFilter({...filter, timeRange: e.target.value as any})}
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="1h">Last 1 Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">视图模式</label>
              <div className="flex bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'timeline' 
                      ? 'bg-purple-500 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-purple-500 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>

            {/* Auto Scroll Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">自动滚动</label>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoScroll ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoScroll ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => setFilter({ thoughtType: 'all', confidenceRange: 'all', timeRange: '6h', searchTerm: '' })}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white py-2 px-4 rounded-lg transition-all duration-300"
            >
              清除过滤器
            </button>
          </div>
        </div>

        {/* Thoughts Panel */}
        <div className="xl:col-span-3 bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-600/30">
            <h3 className="text-lg font-semibold text-white flex items-center justify-between">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-pink-400 rounded-full mr-3 animate-pulse"></span>
                实时思维监控
              </span>
              <div className="text-sm text-gray-400">
                {filteredThoughts.length} thoughts
              </div>
            </h3>
          </div>

          <div 
            ref={thoughtsContainerRef}
            onScroll={handleScroll}
            className="h-96 overflow-y-auto p-6"
          >
            {filteredThoughts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🧠</div>
                <div className="text-gray-400 text-lg">没有匹配的思维</div>
                <div className="text-gray-500 text-sm mt-2">调整过滤器或等待新的AI思考</div>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
                {filteredThoughts.map((thought, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${getThoughtTypeColor(thought.thought)}`}
                    onClick={() => setSelectedThought(thought)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          🧠
                        </div>
                        <div>
                          <div className="text-white font-semibold">
                            {thought.agentName || thought.agentId}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(thought.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {thought.confidence && (
                        <div className={`text-sm font-mono ${getConfidenceColor(thought.confidence)}`}>
                          {Math.round(thought.confidence)}%
                        </div>
                      )}
                    </div>
                    
                    <div className="text-white text-sm leading-relaxed pl-12">
                      {thought.thought}
                    </div>

                    {(thought as any).context && (
                      <div className="mt-2 pl-12">
                        <div className="text-xs text-gray-500 bg-gray-800/30 rounded px-2 py-1 inline-block">
                          Context: {(thought as any).context}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div ref={thoughtsEndRef} />
          </div>
        </div>
      </div>

      {/* Thought Detail Modal */}
      {selectedThought && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">思维详情</h3>
              <button
                onClick={() => setSelectedThought(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">AI 代理</label>
                <div className="text-white font-mono">{selectedThought.agentName || selectedThought.agentId}</div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">时间戳</label>
                <div className="text-white font-mono">{new Date(selectedThought.timestamp).toLocaleString()}</div>
              </div>
              
              {selectedThought.confidence && (
                <div>
                  <label className="text-sm text-gray-400">置信度</label>
                  <div className={`text-lg font-bold ${getConfidenceColor(selectedThought.confidence)}`}>
                    {Math.round(selectedThought.confidence)}%
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm text-gray-400">思维内容</label>
                <div className="text-white bg-gray-800/30 rounded-lg p-3 mt-1">
                  {selectedThought.thought}
                </div>
              </div>
              
              {(selectedThought as any).context && (
                <div>
                  <label className="text-sm text-gray-400">上下文</label>
                  <div className="text-white bg-gray-800/30 rounded-lg p-3 mt-1">
                    {(selectedThought as any).context}
                  </div>
                </div>
              )}
              
              {(selectedThought as any).metadata && (
                <div>
                  <label className="text-sm text-gray-400">元数据</label>
                  <pre className="text-white bg-gray-800/30 rounded-lg p-3 mt-1 text-xs overflow-auto">
                    {JSON.stringify((selectedThought as any).metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};