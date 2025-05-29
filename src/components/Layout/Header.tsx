import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun, AlertTriangle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface StatusIndicatorProps {
  connected: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ connected }) => (
  <div className="flex items-center">
    <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-success-500' : 'bg-error-500'}`}></div>
    <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
  </div>
);

const Header: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  
  // Mock API connection status
  useEffect(() => {
    // Simulate connection after 2 seconds
    const timer = setTimeout(() => {
      setApiConnected(true);
      setWsConnected(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Get page title from location
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/strategy':
        return 'Strategy Monitor';
      case '/orders':
        return 'Order Book';
      case '/positions':
        return 'Positions';
      case '/backtest':
        return 'Backtesting';
      case '/settings':
        return 'Settings';
      default:
        return 'Zerodha HFT System';
    }
  };
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  const marketStatus = 'Open';
  
  return (
    <header className="bg-dark-600 shadow-md">
      <div className="flex items-center justify-between h-16 px-4">
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <StatusIndicator connected={apiConnected} />
            <div className="text-sm px-2 py-1 bg-dark-500 rounded">API</div>
          </div>
          
          <div className="flex items-center space-x-4">
            <StatusIndicator connected={wsConnected} />
            <div className="text-sm px-2 py-1 bg-dark-500 rounded">WebSocket</div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-md text-sm font-medium ${
              marketStatus === 'Open' ? 'bg-success-500/20 text-success-400' : 'bg-error-500/20 text-error-400'
            }`}>
              Market: {marketStatus}
            </div>
          </div>
          
          <div className="text-sm">
            {currentTime.toLocaleTimeString()}
          </div>
          
          <button
            className="p-2 text-gray-300 rounded-full hover:text-white hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={toggleDarkMode}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button className="p-2 text-gray-300 rounded-full hover:text-white hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <Bell size={20} />
          </button>
          
          <button className="p-2 text-error-500 rounded-full hover:text-error-400 hover:bg-error-900 focus:outline-none focus:ring-2 focus:ring-error-500">
            <AlertTriangle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;