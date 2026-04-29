import React from 'react';
import { 
  LayoutDashboard, 
  Users2, 
  Hotel, 
  Calendar, 
  ShoppingBag, 
  UserCircle2, 
  Megaphone, 
  Settings2,
  LogOut,
  BadgeDollarSign,
  Gift,
  Monitor,
  BarChart3,
  CreditCard,
  CheckCircle2,
  BadgePercent
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

import logo from '../assets/logo.png';

import authService from '../services/authService';

const SidebarLink = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
      ${isActive 
        ? 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'}
    `}
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    <span className="font-semibold text-[13px] whitespace-nowrap">{label}</span>
  </NavLink>
);

const Sidebar = () => {
  const handleLogout = () => {
    authService.logout();
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#0d2137] flex flex-col p-4 z-50 overflow-y-auto custom-scrollbar">
      {/* Logo Section */}
      <div className="flex flex-col items-center gap-2 mb-8 mt-2">
        <img src={logo} alt="EzyDash Logo" className="w-16 h-auto" />
        <h1 className="text-xl font-black text-white tracking-tight">EzyDash</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5">
        <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" />
        <SidebarLink to="/revenue" icon={CreditCard} label="Revenue & Finance" />
        <SidebarLink to="/accommodations" icon={Hotel} label="Accommodation" />
        <SidebarLink to="/marketplace" icon={ShoppingBag} label="Marketplace" />
        <SidebarLink to="/events" icon={Calendar} label="Events" />
        <SidebarLink to="/enforcement" icon={UserCircle2} label="User & Enforcement" />
        <SidebarLink to="/subscription-plans" icon={BadgePercent} label="Subscription Plans" />
        <SidebarLink to="/kyc" icon={CheckCircle2} label="Profile Verification" />
        <SidebarLink to="/logs" icon={BarChart3} label="Reports & Audit Logs" />
      </nav>

      {/* Footer / Logout */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;


