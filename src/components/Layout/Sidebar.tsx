import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Zap, 
  BookOpen, 
  PieChart, 
  BarChart3, 
  Settings, 
  LogOut,
  TrendingUp,
  Bot
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, text }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-primary-700 text-white'
            : 'text-gray-300 hover:bg-dark-500 hover:text-white'
        }`
      }
    >
      <span className="mr-3 text-lg">{icon}</span>
      {text}
    </NavLink>
  );
};

const Sidebar: React.FC = () => {
  return (
    <div className="hidden w-64 bg-dark-600 border-r border-dark-500 md:flex md:flex-col">
      <div className="flex items-center justify-center h-16 px-4">
        <div className="flex items-center">
          <TrendingUp className="w-8 h-8 text-primary-500" />
          <span className="ml-2 text-xl font-semibold text-white">Zerodha HFT</span>
        </div>
      </div>
      <div className="flex flex-col flex-grow px-4 py-6">
        <nav className="flex-1 space-y-2">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} text="Dashboard" />
          <NavItem to="/strategy" icon={<Zap size={20} />} text="Strategy Monitor" />
          <NavItem to="/orders" icon={<BookOpen size={20} />} text="Order Book" />
          <NavItem to="/positions" icon={<PieChart size={20} />} text="Positions" />
          <NavItem to="/backtest" icon={<BarChart3 size={20} />} text="Backtesting" />
          <NavItem to="/ai" icon={<Bot size={20} />} text="AI Assistant" />
        </nav>
        <div className="pt-6 mt-6 border-t border-dark-500">
          <NavItem to="/settings" icon={<Settings size={20} />} text="Settings" />
          <button className="flex items-center w-full px-4 py-3 mt-2 text-sm font-medium text-gray-300 rounded-md hover:bg-dark-500 hover:text-white">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;