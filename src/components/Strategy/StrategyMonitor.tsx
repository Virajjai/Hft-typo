import React, { useState } from 'react';
import { Play, Pause, AlertTriangle, Settings, Trash2, Plus, RefreshCw } from 'lucide-react';

interface Strategy {
  id: number;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'error';
  pnl: number;
  trades: number;
  winRate: number;
  avgReturn: number;
  maxDrawdown: number;
  instruments: string[];
}

const StrategyMonitor: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: 1,
      name: 'Market Making (NIFTY)',
      type: 'Market Making',
      status: 'active',
      pnl: 8540,
      trades: 156,
      winRate: 65.2,
      avgReturn: 0.12,
      maxDrawdown: 1.45,
      instruments: ['NIFTY', 'NIFTY-FUT']
    },
    {
      id: 2,
      name: 'Momentum (Bank Stocks)',
      type: 'Momentum',
      status: 'active',
      pnl: 3250,
      trades: 87,
      winRate: 58.7,
      avgReturn: 0.09,
      maxDrawdown: 2.34,
      instruments: ['HDFC', 'ICICI', 'SBI', 'KOTAK']
    },
    {
      id: 3,
      name: 'Arbitrage (F&O)',
      type: 'Arbitrage',
      status: 'paused',
      pnl: 1250,
      trades: 42,
      winRate: 89.5,
      avgReturn: 0.05,
      maxDrawdown: 0.78,
      instruments: ['RELIANCE-FUT', 'INFY-FUT', 'TCS-FUT']
    },
    {
      id: 4,
      name: 'Gap Strategy',
      type: 'Gap Trading',
      status: 'error',
      pnl: -580,
      trades: 12,
      winRate: 41.2,
      avgReturn: -0.08,
      maxDrawdown: 4.21,
      instruments: ['NIFTY', 'BANKNIFTY']
    },
  ]);

  const [activeTab, setActiveTab] = useState<'active' | 'paused' | 'all'>('all');
  
  const filteredStrategies = activeTab === 'all' 
    ? strategies 
    : strategies.filter(s => s.status === activeTab);
  
  const toggleStrategyStatus = (id: number) => {
    setStrategies(prev => 
      prev.map(strategy => {
        if (strategy.id === id) {
          return {
            ...strategy,
            status: strategy.status === 'active' ? 'paused' : 'active'
          };
        }
        return strategy;
      })
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Strategy Monitor</h1>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          New Strategy
        </button>
      </div>
      
      <div className="bg-dark-600 rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-dark-500">
          <div className="flex p-4">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md mr-2 ${
                activeTab === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-500 text-gray-300 hover:bg-dark-400'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Strategies
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md mr-2 ${
                activeTab === 'active' 
                  ? 'bg-success-600 text-white' 
                  : 'bg-dark-500 text-gray-300 hover:bg-dark-400'
              }`}
              onClick={() => setActiveTab('active')}
            >
              Active
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'paused' 
                  ? 'bg-warning-600 text-white' 
                  : 'bg-dark-500 text-gray-300 hover:bg-dark-400'
              }`}
              onClick={() => setActiveTab('paused')}
            >
              Paused
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-400">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Strategy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  P&L
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Trades
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Instruments
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-600 divide-y divide-dark-500">
              {filteredStrategies.map((strategy) => (
                <tr key={strategy.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">{strategy.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{strategy.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      strategy.status === 'active' 
                        ? 'bg-success-100 text-success-800' 
                        : strategy.status === 'paused'
                        ? 'bg-warning-100 text-warning-800'
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${strategy.pnl >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                      {strategy.pnl >= 0 ? '+' : ''}
                      {strategy.pnl.toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        minimumFractionDigits: 0,
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {strategy.trades}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{strategy.winRate}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {strategy.instruments.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => toggleStrategyStatus(strategy.id)}
                        className={`p-1 rounded-full ${
                          strategy.status === 'active' 
                            ? 'text-warning-500 hover:bg-warning-500/10' 
                            : 'text-success-500 hover:bg-success-500/10'
                        }`}
                      >
                        {strategy.status === 'active' ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                      <button className="p-1 rounded-full text-primary-500 hover:bg-primary-500/10">
                        <Settings className="w-5 h-5" />
                      </button>
                      <button className="p-1 rounded-full text-gray-400 hover:bg-gray-500/10">
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button className="p-1 rounded-full text-error-500 hover:bg-error-500/10">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StrategyMonitor;