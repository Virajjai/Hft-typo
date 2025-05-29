import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MarketItemProps {
  symbol: string;
  name: string;
  price: string;
  change: number;
}

const MarketItem: React.FC<MarketItemProps> = ({ symbol, name, price, change }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-dark-500 last:border-b-0">
      <div>
        <p className="font-medium">{symbol}</p>
        <p className="text-sm text-gray-400">{name}</p>
      </div>
      
      <div className="text-right">
        <p className="font-medium">{price}</p>
        <p className={`text-sm flex items-center justify-end ${
          isPositive ? 'text-success-500' : 'text-error-500'
        }`}>
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3 mr-1" />
          ) : (
            <ArrowDownRight className="w-3 h-3 mr-1" />
          )}
          {Math.abs(change).toFixed(2)}%
        </p>
      </div>
    </div>
  );
};

const MarketOverview: React.FC = () => {
  const marketData = [
    { symbol: 'NIFTY', name: 'Nifty 50', price: '22,428.35', change: 0.85 },
    { symbol: 'BANKNIFTY', name: 'Bank Nifty', price: '48,246.10', change: 1.12 },
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: '2,345.50', change: 1.78 },
    { symbol: 'TCS', name: 'Tata Consultancy', price: '3,698.00', change: -0.32 },
    { symbol: 'HDFC', name: 'HDFC Bank', price: '1,654.25', change: 0.45 },
    { symbol: 'INFY', name: 'Infosys', price: '1,845.25', change: -0.67 },
  ];
  
  return (
    <div className="space-y-0">
      {marketData.map((item, index) => (
        <MarketItem 
          key={index}
          symbol={item.symbol}
          name={item.name}
          price={item.price}
          change={item.change}
        />
      ))}
    </div>
  );
};

export default MarketOverview;