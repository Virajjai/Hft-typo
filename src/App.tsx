import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import StrategyMonitor from './components/Strategy/StrategyMonitor';
import OrderBook from './components/Trading/OrderBook';
import Positions from './components/Trading/Positions';
import BacktestPage from './components/Backtest/BacktestPage';
import Settings from './components/Settings/Settings';
import AIAssistant from './components/AI/AIAssistant';

function App() {
  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-dark-700">
        <Sidebar />
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          <Header />
          <main className="relative flex-1 overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/strategy" element={<StrategyMonitor />} />
                  <Route path="/orders" element={<OrderBook />} />
                  <Route path="/positions" element={<Positions />} />
                  <Route path="/backtest" element={<BacktestPage />} />
                  <Route path="/ai" element={<AIAssistant />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;