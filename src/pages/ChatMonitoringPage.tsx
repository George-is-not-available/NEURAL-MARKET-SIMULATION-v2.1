import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAIMessages, useSocketConnection } from '../hooks/useSocket';
import './ChatMonitoringPage.css';

interface ChatFilter {
  aiId?: string;
  messageType?: 'chain_interaction' | 'business_deal' | 'employment' | 'general' | 'all';
  timeRange?: '1h' | '6h' | '24h' | 'all';
  searchTerm?: string;
}

export const ChatMonitoringPage: React.FC = () => {
  const { messages } = useAIMessages();
  const { isConnected, connectionStatus } = useSocketConnection();
  const [filter, setFilter] = useState<ChatFilter>({
    messageType: 'all',
    timeRange: '6h',
    searchTerm: ''
  });
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Filter messages based on current filter settings
  const filteredMessages = messages.filter(message => {
    // Time range filter
    if (filter.timeRange && filter.timeRange !== 'all') {
      const now = new Date();
      const messageTime = new Date(message.timestamp);
      const hoursAgo = parseInt(filter.timeRange);
      if (now.getTime() - messageTime.getTime() > hoursAgo * 60 * 60 * 1000) {
        return false;
      }
    }

    // AI ID filter
    if (filter.aiId && message.senderId !== filter.aiId) {
      return false;
    }

    // Message type filter
    if (filter.messageType && filter.messageType !== 'all') {
      const messageContent = message.message.toLowerCase();
      switch (filter.messageType) {
        case 'chain_interaction':
          if (!messageContent.includes('chain') && !messageContent.includes('box')) return false;
          break;
        case 'business_deal':
          if (!messageContent.includes('deal') && !messageContent.includes('business')) return false;
          break;
        case 'employment':
          if (!messageContent.includes('job') && !messageContent.includes('work')) return false;
          break;
        case 'general':
          if (messageContent.includes('chain') || messageContent.includes('deal') || messageContent.includes('job')) return false;
          break;
      }
    }

    // Search term filter
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      if (!message.message.toLowerCase().includes(searchLower) && 
          !message.senderId.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  const getMessageTypeColor = (message: string) => {
    const content = message.toLowerCase();
    if (content.includes('chain') || content.includes('box')) return 'border-blue-400 bg-blue-500/10';
    if (content.includes('deal') || content.includes('business')) return 'border-green-400 bg-green-500/10';
    if (content.includes('job') || content.includes('work')) return 'border-yellow-400 bg-yellow-500/10';
    if (content.includes('error') || content.includes('failed')) return 'border-red-400 bg-red-500/10';
    return 'border-gray-400 bg-gray-500/10';
  };

  const getUniqueAIIds = () => {
    const ids = new Set(messages.map(msg => msg.senderId));
    return Array.from(ids);
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setAutoScroll(isNearBottom);
    }
  };

  return (
    <div className="chat-monitor-container">
      <PageHeader
        title="聊天监控中心"
        subtitle="CHAT MONITORING CONSOLE"
        icon="💬"
      />

      {/* Connection Status & Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Connection</div>
          <div className={`stat-value ${
            connectionStatus === 'connected' ? 'stat-connected' : 
            connectionStatus === 'connecting' ? 'stat-connecting' : 'stat-disconnected'
          }`}>
                {connectionStatus.toUpperCase()}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Messages</div>
          <div className="stat-value">{messages.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Filtered</div>
          <div className="stat-value">{filteredMessages.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active AIs</div>
          <div className="stat-value">{getUniqueAIIds().length}</div>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-header">
          <div className="filter-title">过滤控制</div>
        </div>

        <div className="filter-content">
            {/* Search */}
          <div className="search-container">
            <div className="filter-label">搜索消息</div>
              <input
                type="text"
                placeholder="Search messages..."
                value={filter.searchTerm || ''}
                onChange={(e) => setFilter({...filter, searchTerm: e.target.value})}
              className="search-input"
              />
            <span className="search-icon">🔍</span>
            </div>

            {/* AI ID Filter */}
          <div className="filter-select-container">
            <div className="filter-label">AI 筛选</div>
              <select
                value={filter.aiId || ''}
                onChange={(e) => setFilter({...filter, aiId: e.target.value || undefined})}
              className="filter-select"
              >
                <option value="">All AIs</option>
                {getUniqueAIIds().map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>

            {/* Message Type Filter */}
          <div className="filter-select-container">
            <div className="filter-label">消息类型</div>
              <select
                value={filter.messageType || 'all'}
                onChange={(e) => setFilter({...filter, messageType: e.target.value as any})}
              className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="chain_interaction">Chain Interactions</option>
                <option value="business_deal">Business Deals</option>
                <option value="employment">Employment</option>
                <option value="general">General Chat</option>
              </select>
            </div>

            {/* Time Range Filter */}
          <div className="filter-select-container">
            <div className="filter-label">时间范围</div>
              <select
                value={filter.timeRange || 'all'}
                onChange={(e) => setFilter({...filter, timeRange: e.target.value as any})}
              className="filter-select"
              >
                <option value="1h">Last 1 Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="all">All Time</option>
              </select>
          </div>
            </div>

        <div className="controls-container filter-content">
          <div className="control-buttons">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
              className={`toggle-button ${autoScroll ? 'active' : ''}`}
              >
              <span className="toggle-indicator"></span>
              自动滚动
              </button>
            </div>

            <button
              onClick={() => setFilter({ messageType: 'all', timeRange: '6h', searchTerm: '' })}
            className="clear-button"
            >
              清除过滤器
            </button>
          </div>
        </div>

      {/* Chat Monitor */}
      <div className="chat-monitor">
        <div className="chat-header">
          <div className="chat-title">
            <span className="chat-title-icon">💬</span>
                实时聊天监控
          </div>
          <div className="chat-count">{filteredMessages.length} messages</div>
          </div>

          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
          className="chat-body"
          >
            {filteredMessages.length === 0 ? (
            <div className="chat-empty">
              <div className="empty-icon">💬</div>
              <div className="empty-title">没有匹配的消息</div>
              <div className="empty-subtitle">调整过滤器或等待新消息</div>
              </div>
            ) : (
              filteredMessages.map((message, index) => (
                <div
                  key={index}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] mb-3 ${getMessageTypeColor(message.message)}`}
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {message.senderId.slice(-2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{message.senderId}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(message.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {message.receiverId && (
                      <div className="text-xs text-gray-400">
                        → {message.receiverId}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-white text-sm leading-relaxed pl-10">
                    {message.message}
                  </div>

                  {(message as any).metadata && (
                    <div className="mt-2 pl-10">
                      <div className="text-xs text-gray-500 bg-gray-800/30 rounded px-2 py-1 inline-block">
                        Confidence: {(message as any).metadata.confidence || 'N/A'}%
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">消息详情</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">发送者</label>
                <div className="text-white font-mono">{selectedMessage.senderId}</div>
              </div>
              
              {selectedMessage.receiverId && (
                <div>
                  <label className="text-sm text-gray-400">接收者</label>
                  <div className="text-white font-mono">{selectedMessage.receiverId}</div>
                </div>
              )}
              
              <div>
                <label className="text-sm text-gray-400">时间戳</label>
                <div className="text-white font-mono">{new Date(selectedMessage.timestamp).toLocaleString()}</div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">消息内容</label>
                <div className="text-white bg-gray-800/30 rounded-lg p-3 mt-1">
                  {selectedMessage.message}
                </div>
              </div>
              
              {(selectedMessage as any).metadata && (
                <div>
                  <label className="text-sm text-gray-400">元数据</label>
                  <pre className="text-white bg-gray-800/30 rounded-lg p-3 mt-1 text-xs overflow-auto">
                    {JSON.stringify((selectedMessage as any).metadata, null, 2)}
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