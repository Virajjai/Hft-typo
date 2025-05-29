import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Filter, RefreshCw, Search, X } from 'lucide-react';

const Positions: React.FC = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  
  // Mock positions data
  const positions = [
    {
      instrument: 'RELIANCE',
      quantity: 100,
      avgPrice: 2345.50,
      currentPrice: 2378.25,
      pnl: 3275.00,
      strategy: 'Market Making',
      timestamp: '2023-06-15T09:32:45'
    },
    {
      instrument: 'INFY',
      quantity: -50,
      avgPrice: 1845.25,
      currentPrice: 1830.80,
      pnl: 722.50,
      strategy: 'Momentum',
      timestamp: '2023-06-15T10:15:20'
    },
    {
      instrument: 'TCS',
      quantity: 25,
      avgPrice: 3698.00,
      currentPrice: 3680.50,
      pnl: -437.50,
      strategy: 'Arbitrage',
      timestamp: '2023-06-15T10:45:10'
    },
    {
      instrument: 'HDFC',
      quantity: -75,
      avgPrice: 2765.75,
      currentPrice: 2790.25,
      pnl: -1837.50,
      strategy: 'Market Making',
      timestamp: '2023-06-15T11:20:35'
    },
    {
      instrument: 'SBIN',
      quantity: 200,
      avgPrice: 587.25,
      currentPrice: 595.40,
      pnl: 1630.00,
      strategy: 'Momentum',
      timestamp: '2023-06-15T12:05:15'
    },
  ];

  // Calculate total P&L
  const totalPnl = positions.reduce((sum, position) => sum + position.pnl, 0);

  // Filter positions based on search and filters
  const filteredPositions = positions.filter(position => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      position.instrument.toLowerCase().includes(searchLower) ||
      position.strategy.toLowerCase().includes(searchLower);

    // Strategy filter
    const matchesStrategy = strategyFilter === 'all' || position.strategy.toLowerCase() === strategyFilter.toLowerCase();

    return matchesSearch && matchesStrategy;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Positions</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilterOpen(!filterOpen)}
            className="p-2 rounded-md bg-dark-500 text-gray-300 hover:bg-dark-400 transition-colors"
          >
            <Filter size={20} />
          </button>
          <button className="p-2 rounded-md bg-dark-500 text-gray-300 hover:bg-dark-400 transition-colors">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-sm text-gray-400">Open Positions</h2>
          <p className="text-2xl font-semibold mt-1">{positions.length}</p>
        </div>
        
        <div className="bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-sm text-gray-400">Long Positions</h2>
          <p className="text-2xl font-semibold mt-1 text-success-500">
            {positions.filter(p => p.quantity > 0).length}
          </p>
        </div>
        
        <div className="bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-sm text-gray-400">Short Positions</h2>
          <p className="text-2xl font-semibold mt-1 text-error-500">
            {positions.filter(p => p.quantity < 0).length}
          </p>
        </div>
        
        <div className="bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-sm text-gray-400">Total P&L</h2>
          <p className={`text-2xl font-semibold mt-1 flex items-center ${
            totalPnl >= 0 ? 'text-success-500' : 'text-error-500'
          }`}>
            {totalPnl >= 0 ? (
              <ArrowUpRight className="w-5 h-5 mr-1" />
            ) : (
              <ArrowDownRight className="w-5 h-5 mr-1" />
            )}
            ₹{Math.abs(totalPnl).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </div>
      </div>

      <div className="bg-dark-600 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-dark-500">
          <div className="flex items-center">
            <div className="relative flex-grow mr-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-200" />
                </button>
              )}
            </div>
          </div>

          {filterOpen && (
            <div className="mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Strategy
                </label>
                <select
                  className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={strategyFilter}
                  onChange={(e) => setStrategyFilter(e.target.value)}
                >
                  <option value="all">All Strategies</option>
                  <option value="market making">Market Making</option>
                  <option value="momentum">Momentum</option>
                  <option value="arbitrage">Arbitrage</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-400">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Instrument
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Avg. Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  P&L
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Strategy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-600 divide-y divide-dark-500">
              {filteredPositions.map((position, index) => {
                // Calculate price change percentage
                const changePercent = ((position.currentPrice - position.avgPrice) / position.avgPrice) * 100;
                // For short positions, invert the change percentage
                const adjustedChangePercent = position.quantity < 0 ? -changePercent : changePercent;
                
                return (
                  <tr key={index} className="hover:bg-dark-500 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                      {position.instrument}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        position.quantity > 0 ? 'text-success-500' : 'text-error-500'
                      }`}>
                        {position.quantity > 0 ? 'LONG' : 'SHORT'} {Math.abs(position.quantity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      ₹{position.avgPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      ₹{position.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`flex items-center ${
                        adjustedChangePercent >= 0 ? 'text-success-500' : 'text-error-500'
                      }`}>
                        {adjustedChangePercent >= 0 ? (
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 mr-1" />
                        )}
                        {Math.abs(adjustedChangePercent).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        position.pnl >= 0 ? 'text-success-500' : 'text-error-500'
                      }`}>
                        {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {position.strategy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <button className="px-3 py-1 bg-error-600 text-white rounded-md hover:bg-error-700 transition-colors text-xs">
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {filteredPositions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    No positions found matching the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Positions;