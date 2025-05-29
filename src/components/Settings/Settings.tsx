import React, { useState } from 'react';
import { AlertTriangle, Check, Eye, EyeOff, Save } from 'lucide-react';

const Settings: React.FC = () => {
  // API credentials
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  
  // Risk parameters
  const [maxPositionSize, setMaxPositionSize] = useState(100);
  const [maxDailyLoss, setMaxDailyLoss] = useState(10000);
  const [maxDrawdown, setMaxDrawdown] = useState(5);
  
  // Trading hours
  const [marketOpenTime, setMarketOpenTime] = useState('09:15');
  const [marketCloseTime, setMarketCloseTime] = useState('15:30');
  const [autoSquareOffTime, setAutoSquareOffTime] = useState('15:15');
  
  // System settings
  const [logLevel, setLogLevel] = useState('info');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [saveHistoricalData, setSaveHistoricalData] = useState(true);
  
  // Save settings (mock function)
  const saveSettings = () => {
    // This would send the settings to the backend in a real implementation
    console.log('Settings saved');
    
    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          onClick={saveSettings}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </button>
      </div>
      
      {showSuccessMessage && (
        <div className="bg-success-500/20 text-success-500 px-4 py-3 rounded-md flex items-center">
          <Check className="w-5 h-5 mr-2" />
          Settings saved successfully
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API Credentials</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Zerodha API Key
              </label>
              <input
                type="text"
                className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Zerodha API Key"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Zerodha API Secret
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Enter your Zerodha API Secret"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div className="pt-2">
              <button className="px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors">
                Test Connection
              </button>
            </div>
            
            <div className="bg-dark-500 p-4 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-warning-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-300">Security Notice</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    API credentials are stored securely and encrypted. Never share your API keys or secrets with anyone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Risk Management</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Max Position Size
              </label>
              <input
                type="number"
                className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={maxPositionSize}
                onChange={(e) => setMaxPositionSize(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-400">Maximum number of contracts/shares per position</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Max Daily Loss (₹)
              </label>
              <input
                type="number"
                className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-400">System will stop trading if daily loss exceeds this amount</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Max Drawdown (%)
              </label>
              <input
                type="number"
                className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={maxDrawdown}
                onChange={(e) => setMaxDrawdown(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-400">Maximum allowed drawdown percentage</p>
            </div>
          </div>
        </div>
        
        <div className="bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Trading Hours</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Market Open Time
              </label>
              <input
                type="time"
                className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={marketOpenTime}
                onChange={(e) => setMarketOpenTime(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Market Close Time
              </label>
              <input
                type="time"
                className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={marketCloseTime}
                onChange={(e) => setMarketCloseTime(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Auto Square Off Time
              </label>
              <input
                type="time"
                className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={autoSquareOffTime}
                onChange={(e) => setAutoSquareOffTime(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-400">All positions will be closed at this time</p>
            </div>
          </div>
        </div>
        
        <div className="bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Log Level
              </label>
              <select
                className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                id="auto-reconnect"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-400 rounded bg-dark-500"
                checked={autoReconnect}
                onChange={(e) => setAutoReconnect(e.target.checked)}
              />
              <label htmlFor="auto-reconnect" className="ml-2 block text-sm text-gray-300">
                Auto-reconnect on connection loss
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="save-historical"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-400 rounded bg-dark-500"
                checked={saveHistoricalData}
                onChange={(e) => setSaveHistoricalData(e.target.checked)}
              />
              <label htmlFor="save-historical" className="ml-2 block text-sm text-gray-300">
                Save historical market data
              </label>
            </div>
            
            <div className="pt-2">
              <button className="px-4 py-2 bg-error-600 text-white rounded-md hover:bg-error-700 transition-colors">
                Reset All Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;