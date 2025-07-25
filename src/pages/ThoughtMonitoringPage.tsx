import React, { useState, useEffect, useRef } from 'react';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { useAIThoughts, useSocketConnection } from '../hooks/useSocket';
import './ThoughtMonitoring.css';

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
    <div className="thought-monitoring">
      <div className="thought-header">
        <h1>思维监控中心</h1>
        <div className="subtitle">THOUGHT MONITORING CONSOLE</div>
        <div className="connection-status-header">
          <ConnectionStatus 
            isConnected={isConnected} 
            isConnecting={connectionStatus === 'connecting'} 
            showText={true} 
          />
        </div>
      </div>
      
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-title">Total Thoughts</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">全部思维</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Filtered</div>
          <div className="stat-value">{stats.filtered}</div>
          <div className="stat-label">当前过滤</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">High Confidence</div>
          <div className="stat-value">{stats.highConfidence}</div>
          <div className="stat-label">高置信度</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Recent (1h)</div>
          <div className="stat-value">{stats.recent}</div>
          <div className="stat-label">最近一小时</div>
        </div>
      </div>
      
      <div className="filters-section">
        <h3 className="filters-title">思维过滤器</h3>
        <div className="search-input-container">
          <input
            type="text"
            placeholder="搜索思维..."
            className="search-input"
            value={filter.searchTerm || ''}
            onChange={(e) => setFilter({...filter, searchTerm: e.target.value})}
          />
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">AI 筛选</label>
            <select 
              className="filter-select"
              value={filter.aiId || ''}
              onChange={(e) => setFilter({...filter, aiId: e.target.value || undefined})}
            >
              <option value="">All AIs</option>
              {getUniqueAIIds().map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">思维类型</label>
            <select 
              className="filter-select"
              value={filter.thoughtType || 'all'}
              onChange={(e) => setFilter({...filter, thoughtType: e.target.value as any})}
            >
              <option value="all">All Types</option>
              <option value="decision">Decision Making</option>
              <option value="observation">Observations</option>
              <option value="planning">Planning</option>
              <option value="emotion">Emotional</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">置信度范围</label>
            <select 
              className="filter-select"
              value={filter.confidenceRange || 'all'}
              onChange={(e) => setFilter({...filter, confidenceRange: e.target.value as any})}
            >
              <option value="all">All Confidence</option>
              <option value="high">High (75%+)</option>
              <option value="medium">Medium (25-74%)</option>
              <option value="low">Low (0-24%)</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">时间范围</label>
            <select 
              className="filter-select"
              value={filter.timeRange || 'all'}
              onChange={(e) => setFilter({...filter, timeRange: e.target.value as any})}
            >
              <option value="1h">Last 1 Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <div className="view-toggle">
            <button 
              className={viewMode === 'timeline' ? 'active' : ''}
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </button>
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
          </div>
          <button 
            className={`auto-scroll-toggle ${autoScroll ? 'active' : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            自动滚动
          </button>
          <button 
            className="clear-filters"
            onClick={() => setFilter({thoughtType: 'all', confidenceRange: 'all', timeRange: '6h', searchTerm: ''})}
          >
            清除过滤器
          </button>
        </div>
      </div>

      <div className="thoughts-section">
        <h3 className="filters-title">实时思维监控</h3>
        <div className="thoughts-container" ref={thoughtsContainerRef} onScroll={handleScroll}>
          {filteredThoughts.length === 0 ? (
            <div className="thoughts-empty">
              <div className="thoughts-empty-icon">🧠</div>
              <div className="thoughts-empty-title">没有匹配的思维</div>
              <div className="thoughts-empty-subtitle">调整过滤器或等待新的AI思考</div>
            </div>
          ) : (
            <div className="thoughts-list">
              {filteredThoughts.map((thought, index) => (
                <div 
                  key={index}
                  className="thought-item"
                  onClick={() => setSelectedThought(thought)}
                >
                  <div className="thought-header-item">
                    <div className="thought-meta">
                      <span className="thought-badge agent">
                        {thought.agentName || thought.agentId}
                      </span>
                      <span className={`thought-badge confidence ${
                        thought.confidence && thought.confidence >= 75 ? 'high' :
                        thought.confidence && thought.confidence >= 25 ? 'medium' : 'low'
                      }`}>
                        {thought.confidence ? `${thought.confidence}%` : 'N/A'}
                      </span>
                    </div>
                    <span className="thought-timestamp">
                      {new Date(thought.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="thought-content">
                    {thought.thought}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={thoughtsEndRef} />
        </div>
      </div>
    </div>
  );
};