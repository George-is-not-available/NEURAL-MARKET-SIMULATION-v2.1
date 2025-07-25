import React from 'react';
import { useSocketConnection } from '../hooks/useSocket';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon }) => {
  const { connectionStatus, isConnected } = useSocketConnection();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page-header">
      {/* 背景装饰 */}
      <div className="page-header-bg"></div>
      
      <div className="page-header-container">
        <div className="flex items-center justify-between">
          {/* 左侧标题区域 */}
          <div className="flex items-center space-x-4">
            {/* 页面图标 */}
            <div className="relative">
              <div className="icon-container">
                <span className="text-3xl">{icon}</span>
                <div className="node-indicator"></div>
              </div>
            </div>
            
            {/* 标题信息 */}
            <div>
              <h1 className="page-title">
                {title}
              </h1>
              <p className="page-subtitle">
                {subtitle}
              </p>
              
              {/* 面包屑导航 */}
              <div className="breadcrumb">
                <span className="breadcrumb-item">AI MARKET SYSTEM</span>
                <span className="breadcrumb-separator">→</span>
                <span className="breadcrumb-current">{title}</span>
              </div>
            </div>
          </div>

          {/* 右侧状态区域 */}
          <div className="flex items-center space-x-6">
            {/* 时间显示 */}
            <div className="text-right">
              <div className="digital-time">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="digital-date">
                {currentTime.toLocaleDateString()}
              </div>
            </div>

            {/* 连接状态 */}
            <div className="flex items-center space-x-3">
              <div className={`connection-indicator ${
                isConnected ? 'connection-online' : 'connection-offline'
              }`}></div>
              <div className="text-sm">
                <div className={`connection-label ${
                  isConnected ? 'connection-online-text' : 'connection-offline-text'
                }`}>
                  {connectionStatus.toUpperCase()}
                </div>
                <div className="text-gray-400 text-xs">
                  NEURAL LINK
                </div>
              </div>
            </div>

            {/* 系统指标 */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="system-metric">
                <div className="metric-label cpu-label">CPU</div>
                <div className="metric-value">45%</div>
              </div>
              <div className="system-metric">
                <div className="metric-label memory-label">MEM</div>
                <div className="metric-value">67%</div>
              </div>
              <div className="system-metric">
                <div className="metric-label network-label">NET</div>
                <div className="metric-value">12ms</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 角落装饰 */}
        <div className="corner-decoration corner-top-right"></div>
        <div className="corner-decoration corner-bottom-left"></div>
      </div>
    </div>
  );
};