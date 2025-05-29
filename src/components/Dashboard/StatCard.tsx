import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
  positive?: 'up' | 'down';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  trend, 
  positive = 'up' 
}) => {
  const isPositive = trend === positive;
  
  return (
    <div className="bg-dark-600 p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          
          <div className="flex items-center mt-2">
            <span className={`flex items-center text-sm ${
              isPositive ? 'text-success-500' : 'text-error-500'
            }`}>
              {trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-400 ml-2">vs yesterday</span>
          </div>
        </div>
        
        <div className="p-3 bg-dark-500 rounded-full self-start">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;