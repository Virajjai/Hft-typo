import React, { useState } from 'react';
import { Play, RefreshCw, Download, Info, Calendar } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BacktestPage: React.FC = () => {
  // State for backtest parameters
  const [strategy, setStrategy] = useState('market-making');
  const [instrument, setInstrument] = useState(['NIFTY']);
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-05-31');
  const [initialCapital, setInitialCapital] = useState(100000);
  
  // State for backtest results
  const [isBacktestComplete, setIsBacktestComplete] = useState(false);
  const [backtestRunning, setBacktestRunning] = useState(false);
  
  // Mock backtest results data
  const mockResults = {
    initialCapital: 100000,
    finalEquity: 112459,
    totalReturn: 12.46,
    annualReturn: 29.85,
    maxDrawdown: 4.32,
    sharpeRatio: 1.85,
    winRate: 68.5,
    totalTrades: 342,
    equityCurve: Array(180).fill(0).map((_, i) => {
      // Start with initial capital and add a slightly upward trend with some randomness
      const baseValue = 100000 * (1 + (i * 0.08 / 180));
      const randomFactor = 1 + (Math.random() * 0.04 - 0.02); // +/- 2%
      return {
        timestamp: new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        equity: Math.round(baseValue * randomFactor)
      };
    })
  };
  
  // Chart data
  const chartData = {
    labels: mockResults.equityCurve.map(point => point.timestamp),
    datasets: [
      {
        label: 'Equity Curve',
        data: mockResults.equityCurve.map(point => point.equity),
        fill: 'start',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
          return gradient;
        },
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.4,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
          color: '#9ca3af',
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              minimumFractionDigits: 0,
            }).format(value);
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };
  
  // Mock function to run backtest
  const runBacktest = () => {
    setBacktestRunning(true);
    
    // Simulate backtest running
    setTimeout(() => {
      setBacktestRunning(false);
      setIsBacktestComplete(true);
    }, 2000);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Backtesting</h1>
        {isBacktestComplete && (
          <div className="flex space-x-2">
            <button className="flex items-center px-3 py-1 bg-dark-500 text-gray-300 rounded-md hover:bg-dark-400 transition-colors">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </button>
            <button className="flex items-center px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Backtest Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Strategy
              </label>
              <select
                className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                disabled={backtestRunning}
              >
                <option value="market-making">Market Making</option>
                <option value="momentum">Momentum</option>
                <option value="arbitrage">Arbitrage</option>
                <option value="gap-trading">Gap Trading</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Instruments
              </label>
              <select
                className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={instrument}
                onChange={(e) => setInstrument([e.target.value])}
                disabled={backtestRunning}
              >
                <option value="NIFTY">NIFTY</option>
                <option value="BANKNIFTY">BANKNIFTY</option>
                <option value="RELIANCE">RELIANCE</option>
                <option value="TCS">TCS</option>
                <option value="HDFC">HDFC</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">Multiple selection coming soon</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="block w-full pl-10 pr-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={backtestRunning}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="block w-full pl-10 pr-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={backtestRunning}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Initial Capital (INR)
              </label>
              <input
                type="number"
                className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                disabled={backtestRunning}
              />
            </div>
            
            <button
              className={`w-full py-2 flex items-center justify-center rounded-md transition-colors ${
                backtestRunning 
                  ? 'bg-primary-700 text-white cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
              onClick={runBacktest}
              disabled={backtestRunning}
            >
              {backtestRunning ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                    <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running Backtest...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Run Backtest
                </>
              )}
            </button>
          </div>
          
          {isBacktestComplete && (
            <div className="mt-6">
              <h3 className="text-md font-semibold mb-3 text-gray-300">Strategy Parameters</h3>
              
              {strategy === 'market-making' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Spread Percentage</span>
                    <span>0.05%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Order Quantity</span>
                    <span>10</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Position Limit</span>
                    <span>50</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Min Price Increment</span>
                    <span>0.05</span>
                  </div>
                </div>
              )}
              
              {strategy === 'momentum' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">MA Short Period</span>
                    <span>10</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">MA Long Period</span>
                    <span>30</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Volume Threshold</span>
                    <span>1.5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Take Profit</span>
                    <span>1.0%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Stop Loss</span>
                    <span>0.5%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="lg:col-span-2">
          {!isBacktestComplete ? (
            <div className="bg-dark-600 rounded-lg shadow-lg p-6 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">No Backtest Results</h3>
                <p className="text-gray-400 max-w-md">
                  Configure your backtest parameters and click "Run Backtest" to see the results.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-dark-600 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-dark-500 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400">Total Return</h3>
                    <p className="text-xl font-semibold text-success-500">+{mockResults.totalReturn}%</p>
                  </div>
                  
                  <div className="bg-dark-500 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400">Annual Return</h3>
                    <p className="text-xl font-semibold text-success-500">+{mockResults.annualReturn}%</p>
                  </div>
                  
                  <div className="bg-dark-500 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400">Max Drawdown</h3>
                    <p className="text-xl font-semibold text-error-500">-{mockResults.maxDrawdown}%</p>
                  </div>
                  
                  <div className="bg-dark-500 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400">Sharpe Ratio</h3>
                    <p className="text-xl font-semibold">{mockResults.sharpeRatio}</p>
                  </div>
                  
                  <div className="bg-dark-500 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400">Win Rate</h3>
                    <p className="text-xl font-semibold">{mockResults.winRate}%</p>
                  </div>
                  
                  <div className="bg-dark-500 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400">Total Trades</h3>
                    <p className="text-xl font-semibold">{mockResults.totalTrades}</p>
                  </div>
                  
                  <div className="bg-dark-500 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400">Initial Capital</h3>
                    <p className="text-xl font-semibold">₹{mockResults.initialCapital.toLocaleString('en-IN')}</p>
                  </div>
                  
                  <div className="bg-dark-500 rounded-lg p-4">
                    <h3 className="text-sm text-gray-400">Final Equity</h3>
                    <p className="text-xl font-semibold">₹{mockResults.finalEquity.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-dark-600 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Equity Curve</h2>
                
                <div className="h-64">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BacktestPage;