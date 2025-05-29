import React, { useState } from 'react';
import { Filter, RefreshCw, Search, X } from 'lucide-react';

const OrderBook: React.FC = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Mock order data
  const orders = [
    {
      orderId: 'ORD000123',
      instrument: 'RELIANCE',
      type: 'BUY',
      quantity: 100,
      price: 2345.50,
      status: 'COMPLETE',
      timestamp: '2023-06-15T14:32:45',
      strategy: 'Market Making'
    },
    {
      orderId: 'ORD000124',
      instrument: 'INFY',
      type: 'SELL',
      quantity: 50,
      price: 1845.25,
      status: 'COMPLETE',
      timestamp: '2023-06-15T14:30:12',
      strategy: 'Market Making'
    },
    {
      orderId: 'ORD000125',
      instrument: 'TCS',
      type: 'BUY',
      quantity: 25,
      price: 3698.00,
      status: 'PENDING',
      timestamp: '2023-06-15T14:28:37',
      strategy: 'Momentum'
    },
    {
      orderId: 'ORD000126',
      instrument: 'HDFC',
      type: 'SELL',
      quantity: 75,
      price: 2765.75,
      status: 'REJECTED',
      timestamp: '2023-06-15T14:25:51',
      strategy: 'Momentum'
    },
    {
      orderId: 'ORD000127',
      instrument: 'SBIN',
      type: 'BUY',
      quantity: 200,
      price: 587.25,
      status: 'OPEN',
      timestamp: '2023-06-15T14:23:19',
      strategy: 'Arbitrage'
    },
    {
      orderId: 'ORD000128',
      instrument: 'ICICI',
      type: 'SELL',
      quantity: 150,
      price: 945.60,
      status: 'CANCELLED',
      timestamp: '2023-06-15T14:20:45',
      strategy: 'Arbitrage'
    },
  ];

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      order.orderId.toLowerCase().includes(searchLower) ||
      order.instrument.toLowerCase().includes(searchLower) ||
      order.strategy.toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();

    // Type filter
    const matchesType = typeFilter === 'all' || order.type.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get status badge style
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return 'bg-success-100 text-success-800';
      case 'PENDING':
        return 'bg-warning-100 text-warning-800';
      case 'OPEN':
        return 'bg-primary-100 text-primary-800';
      case 'REJECTED':
        return 'bg-error-100 text-error-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Book</h1>
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
                placeholder="Search orders..."
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
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Status
                </label>
                <select
                  className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="complete">Complete</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Order Type
                </label>
                <select
                  className="block w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
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
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Instrument
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Strategy
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-600 divide-y divide-dark-500">
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-dark-500 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-400">
                    {order.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(order.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {order.instrument}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`${
                      order.type === 'BUY' ? 'text-success-500' : 'text-error-500'
                    } font-medium`}>
                      {order.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {order.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ₹{order.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {order.strategy}
                  </td>
                </tr>
              ))}
              
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    No orders found matching the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 bg-dark-700 border-t border-dark-500">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing <span className="font-medium text-white">{filteredOrders.length}</span> of <span className="font-medium text-white">{orders.length}</span> orders
            </div>
            <div className="flex space-x-1">
              <button className="px-3 py-1 bg-dark-500 text-gray-300 rounded-md hover:bg-dark-400 transition-colors">
                Prev
              </button>
              <button className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors">
                1
              </button>
              <button className="px-3 py-1 bg-dark-500 text-gray-300 rounded-md hover:bg-dark-400 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;