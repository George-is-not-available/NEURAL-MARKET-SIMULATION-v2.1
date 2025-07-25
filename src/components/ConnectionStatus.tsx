import React from 'react';
import './ConnectionStatus.css';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  showText?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  showText = true,
  className = ''
}) => {
  const getStatusClass = () => {
    if (isConnected) return 'connected';
    if (isConnecting) return 'connecting';
    return 'disconnected';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (isConnecting) return 'CONNECTING';
    return 'Disconnected';
  };

  return (
    <div className={`connection-status ${getStatusClass()} ${className}`}>
      <span className={`connection-indicator ${getStatusClass()}`}></span>
      {showText && (
        <span className={`connection-text ${isConnecting ? 'connecting' : ''}`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

// Loading interface component
interface LoadingInterfaceProps {
  isVisible: boolean;
  isDarkMode?: boolean;
}

export const LoadingInterface: React.FC<LoadingInterfaceProps> = ({
  isVisible,
  isDarkMode = false
}) => {
  if (!isVisible) return null;

  return (
    <div className={`loading-interface ${isDarkMode ? 'dark' : ''}`}>
      <div className="loading-title">AI Market Game</div>
      <div className="loading-subtitle">CONNECTING</div>
      <div className="loading-spinner"></div>
      <div className="loading-dots">
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
      </div>
    </div>
  );
};