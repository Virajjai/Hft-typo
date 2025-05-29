import React, { useState, useEffect } from 'react';
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
import StatCard from './StatCard';
import MarketOverview from './MarketOverview';
import StrategyStatus from './StrategyStatus';
import { ArrowUpRight, ArrowDownRight, Clock, DollarSign } from 'lucide-react';

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

const Dashboard: React.FC = () => {
  const [pnlData, setPnlData] = useState({
    labels: [] as string[],
    datasets: [] as any[]
  });
  
  // Mock PnL data
  useEffect(() => {
    const generateMockPnLData = () => {
      const hours = [...Array(8).keys()].map(hour => `${9 + hour}:00`);
      
      // Generate realistic PnL pattern with some volatility
      let cumulativePnL = 0;
      const pnlValues = hours.map(() => {
        const change = (Math.random() * 2000) - 800; // Mostly positive but some negatives
        cumulativePnL += change;
        return cumulativePnL;
      });
      
      setPnlData({
        labels: hours,
        datasets: [
          {
            label: 'Today\'s P&L',
            data: pnlValues,
            fill: 'start',
            backgroundColor: (context: any) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 200);
              gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
              gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
              return gradient;
            },
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            tension: 0.4,
          },
        ],
      });
    };
    
    generateMockPnLData();
  }, []);
  
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
          drawBorder: false,
        },
        ticks: {
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
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Daily P&L"
          value="₹12,459"
          change={5.6}
          icon={<DollarSign className="w-6 h-6 text-primary-500" />}
          trend="up"
        />
        <StatCard 
          title="Open Positions"
          value="8"
          change={-2}
          icon={<ArrowUpRight className="w-6 h-6 text-secondary-500" />}
          trend="down"
        />
        <StatCard 
          title="Orders Today"
          value="342"
          change={12.3}
          icon={<ArrowDownRight className="w-6 h-6 text-accent-500" />}
          trend="up"
        />
        <StatCard 
          title="Avg. Latency"
          value="42 ms"
          change={-8.1}
          icon={<Clock className="w-6 h-6 text-success-500" />}
          trend="down"
          positive="down"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-dark-600 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Performance</h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-primary-700 rounded-md hover:bg-primary-600 transition-colors">
                Today
              </button>
              <button className="px-3 py-1 text-sm bg-dark-500 rounded-md hover:bg-dark-400 transition-colors">
                Week
              </button>
              <button className="px-3 py-1 text-sm bg-dark-500 rounded-md hover:bg-dark-400 transition-colors">
                Month
              </button>
            </div>
          </div>
          <div className="h-64">
            {pnlData.labels.length > 0 && (
              <Line data={pnlData} options={chartOptions} />
            )}
          </div>
        </div>
        
        <div className="bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Strategy Status</h2>
          <StrategyStatus />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
          <MarketOverview />
        </div>
        
        <div className="bg-dark-600 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-400">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-400">
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">14:32:45</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">RELIANCE</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">BUY</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">100</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">2,345.50</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-success-500/20 text-success-400">
                      COMPLETE
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">14:30:12</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">INFY</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">SELL</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">50</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">1,845.25</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-success-500/20 text-success-400">
                      COMPLETE
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">14:28:37</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">TCS</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">BUY</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">25</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">3,698.00</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-warning-500/20 text-warning-400">
                      PENDING
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">14:25:51</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">HDFC</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">SELL</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">75</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">2,765.75</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-error-500/20 text-error-400">
                      REJECTED
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;