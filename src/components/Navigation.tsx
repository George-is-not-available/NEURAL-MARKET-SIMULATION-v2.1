import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocketConnection } from '../hooks/useSocket';
import './Navigation.css';

interface NavItem {
  path: string;
  name: string;
  icon: string;
  description: string;
}

const navItems: NavItem[] = [
  { path: '/', name: '控制中心', icon: '🎮', description: 'COMMAND CENTER' },
  { path: '/chat-monitor', name: '聊天监控', icon: '💬', description: 'CHAT MONITORING' },
  { path: '/thought-monitor', name: '思维监控', icon: '🧠', description: 'THOUGHT MONITORING' },
];

export const Navigation: React.FC = () => {
  const { isConnected } = useSocketConnection();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="nav-container p-4 mb-6 border-scan">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="logo-container w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 relative">
                <div className="absolute inset-0 bg-cyan-500/30 rounded-full animate-ping"></div>
                <div className="absolute inset-1 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="text-white font-bold text-sm">AI MARKET</div>
              <div className="text-cyan-400 text-xs digital-clock">NEURAL SYS v2.1</div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-button px-4 py-3 rounded-lg ${
                  location.pathname === item.path
                    ? 'nav-button-active'
                    : 'text-black hover:text-white hover:bg-black/30 border border-transparent hover:border-black/30'
                }`}
              >
                <div className="hover-flash"></div>
                <div className="flex items-center space-x-2">
                  <span className="nav-icon text-lg">{item.icon}</span>
                  <div className="text-left text-white">
                    <div className={`nav-text font-medium text-sm ${
                      location.pathname === item.path ? 'text-white' : 'text-black'
                    }`}>
                      {item.name}
                    </div>
                    <div className="nav-description text-xs text-black font-mono">
                      {item.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="online-status flex items-center space-x-2">
            <div className={`status-indicator ${
              isConnected ? 'status-online' : 'status-offline'
            }`}></div>
            <div className={`status-text ${
              isConnected ? 'online-text' : 'offline-text'
            }`}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};