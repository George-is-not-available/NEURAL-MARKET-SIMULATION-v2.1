import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { ChatMonitoringPage } from './pages/ChatMonitoringPage';
import { ThoughtMonitoringPage } from './pages/ThoughtMonitoringPage';
import { useSocketConnection } from './hooks/useSocket';
import './App.css';
import './App.layout.css';

function App() {
  const { connectionStatus, isConnected } = useSocketConnection();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Router>
      <div className="app-container">
        {/* Background effects */}
        <div className="bg-effect bg-grid"></div>
        <div className="bg-effect bg-gradient-overlay"></div>
        
        {/* Dynamic background lights */}
        <div className="bg-light bg-light-1"></div>
        <div className="bg-light bg-light-2"></div>
        <div className="bg-light bg-light-3"></div>
        
        {/* Top status bar */}
        <header className="status-bar">
          <div className="status-bar-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  AI 模拟市场游戏系统
                </h1>
                <div className="text-xs text-cyan-300 opacity-70">
                  NEURAL MARKET SIMULATION v2.1
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400">◉</span>
                  <span className="digital-clock text-white">{currentTime.toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                    {isConnected ? '▲' : '▼'}
                  </span>
                  <span className={`${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                    {connectionStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <div className="nav-section">
          <div className="content-container">
          <Navigation />
          </div>
        </div>

        {/* Main content */}
        <main className="main-content">
          <div className="content-container">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chat-monitor" element={<ChatMonitoringPage />} />
            <Route path="/thought-monitor" element={<ThoughtMonitoringPage />} />
          </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="content-container">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>NEURAL MARKET SIMULATION v2.1 © {new Date().getFullYear()}</div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>系统正常</span>
                </div>
                <div>延迟: 12ms</div>
                <div>活跃AI: 12</div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;