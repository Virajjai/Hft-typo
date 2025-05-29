import React from 'react';
import { Play, Pause, AlertTriangle } from 'lucide-react';

interface StrategyItemProps {
  name: string;
  status: 'active' | 'paused' | 'error';
  performance: number;
  trades: number;
}

const StrategyItem: React.FC<StrategyItemProps> = ({ 
  name, 
  status, 
  performance, 
  trades 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-success-500';
      case 'paused':
        return 'bg-warning-500';
      case 'error':
        return 'bg-error-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-dark-500 last:border-b-0">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          status === 'active' ? 'bg-success-500/20 text-success-500' :
          status === 'paused' ? 'bg-warning-500/20 text-warning-500' :
          'bg-error-500/20 text-error-500'
        }`}>
          {getStatusIcon()}
        </div>
        <div className="ml-3">
          <p className="font-medium">{name}</p>
          <div className="flex items-center mt-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <p className="text-xs text-gray-400 ml-1 capitalize">{status}</p>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <p className={`font-medium ${
          performance >= 0 ? 'text-success-500' : 'text-error-500'
        }`}>
          {performance >= 0 ? '+' : ''}{performance.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
          })}
        </p>
        <p className="text-xs text-gray-400 mt-1">{trades} trades today</p>
      </div>
    </div>
  );
};

const StrategyStatus: React.FC = () => {
  const strategies = [
    { name: 'Market Making (NIFTY)', status: 'active', performance: 8540, trades: 156 },
    { name: 'Momentum (Bank Stocks)', status: 'active', performance: 3250, trades: 87 },
    { name: 'Arbitrage (F&O)', status: 'paused', performance: 1250, trades: 42 },
    { name: 'Gap Strategy', status: 'error', performance: -580, trades: 12 },
  ];
  
  return (
    <div className="space-y-0">
      {strategies.map((strategy, index) => (
        <StrategyItem 
          key={index}
          name={strategy.name}
          status={strategy.status}
          performance={strategy.performance}
          trades={strategy.trades}
        />
      ))}
      
      <button className="w-full mt-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md transition-colors">
        Add New Strategy
      </button>
    </div>
  );
};

export default StrategyStatus;