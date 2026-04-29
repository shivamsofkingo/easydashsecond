import React, { useState } from 'react';
import { 
  Search, 
  Eye, 
  Upload, 
  Settings, 
  MoreVertical, 
  Filter,
  Calendar,
  Settings2,
  Users,
  Shield,
  BarChart3,
  Megaphone,
  SearchCode,
  Database,
  Download
} from 'lucide-react';

const StatCard = ({ title, count, label }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col justify-between transition-all hover:shadow-md">
    <div>
      <h3 className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-2">{title}</h3>
      <div className="text-xl font-black text-[#0d2137] mb-1">{count}</div>
      <p className="text-gray-400 text-[10px] font-bold">{label}</p>
    </div>
  </div>
);

const ReportCard = ({ title, description, icon: Icon, colorClass, bgColorClass }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex flex-col items-start transition-all hover:shadow-md hover:border-gray-200 group">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${bgColorClass} ${colorClass} transition-transform group-hover:scale-105 shadow-sm`}>
      <Icon className="w-5 h-5" />
    </div>
    <h4 className="text-[#0d2137] font-black text-xs mb-1.5">{title}</h4>
    <p className="text-gray-400 text-[10px] font-bold leading-relaxed mb-4 flex-1">
      {description}
    </p>
    <button className="px-4 py-1.5 text-[10px] font-black text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0d2137] transition-all self-start shadow-sm cursor-pointer">
      View Reports
    </button>
  </div>
);

const ReportsLogs = () => {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Reports (6,430)' },
    { id: 'user', label: 'User Reports (3)' },
    { id: 'organizer', label: 'Organizer Reports (1)' },
    { id: 'system', label: 'System Logs (792)' }
  ];

  const reportCategories = [
    {
      title: 'System Logs',
      description: 'Platform performance, errors or scans, technical incidents',
      icon: Settings2,
      colorClass: 'text-blue-600',
      bgColorClass: 'bg-blue-100'
    },
    {
      title: 'User Activity',
      description: 'Logins, listings, ticket purchases, reports submitted',
      icon: Users,
      colorClass: 'text-emerald-600',
      bgColorClass: 'bg-emerald-100'
    },
    {
      title: 'Admin Actions',
      description: 'Banner, event, refund approvals, takedowns, manual overides',
      icon: Shield,
      colorClass: 'text-orange-500',
      bgColorClass: 'bg-orange-100'
    },
    {
      title: 'Financial Reports',
      description: 'Platform performance, errors or scans, technical incidents',
      icon: BarChart3,
      colorClass: 'text-green-600',
      bgColorClass: 'bg-green-100'
    },
    {
      title: 'Advertisement Reports',
      description: 'Banners uploaded, country assignments, ad spend, impression',
      icon: Megaphone,
      colorClass: 'text-purple-600',
      bgColorClass: 'bg-purple-100'
    },
    {
      title: 'Country Reports',
      description: 'Localization stats, country-specific earnings, tax deductions',
      icon: Megaphone,
      colorClass: 'text-yellow-500',
      bgColorClass: 'bg-yellow-100'
    },
    {
      title: 'Audit Snapshots',
      description: 'Monthly summaries, admin action history, recolonization logs',
      icon: SearchCode,
      colorClass: 'text-red-500',
      bgColorClass: 'bg-red-100'
    },
    {
      title: 'Data Governance',
      description: 'Retention periods, access-controls, randomization, permissions',
      icon: Database,
      colorClass: 'text-lime-500',
      bgColorClass: 'bg-lime-100'
    }
  ];

  return (
    <div className="p-5 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-6">
          <h1 className="text-xl font-black text-[#0d2137]">Reports & Logs</h1>
          <span className="text-gray-400 font-bold text-lg">— Admin Panel</span>
        </div>
        
        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="User Reports" count="5,400" label="Active Users" />
          <StatCard title="Organiser Reports" count="1,670" label="Active Users" />
          <StatCard title="System Issues" count="782" label="Active Users" />
          <StatCard title="Refund Requests" count="120" label="Active Users" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 mb-8">
          <h2 className="text-lg font-black text-[#0d2137]">Incidents Overview</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search" 
                className="pl-9 pr-4 py-1.5 bg-[#F8FAFC] border-none rounded-lg text-xs font-bold w-64 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
              />
            </div>

            <button className="flex items-center gap-2 px-5 py-1.5 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg text-xs font-black transition-all cursor-pointer">
              Review
            </button>
            
            <button className="flex items-center gap-2 px-5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-black transition-all cursor-pointer">
              <Download size={16} />
              Export CSV
            </button>
            
            <button className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-400 rounded-lg transition-all shadow-sm cursor-pointer">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-[#1E3A8A] text-white shadow-sm' 
                    : 'bg-[#F8FAFC] text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-black text-gray-600 hover:bg-gray-50 transition-all shadow-sm cursor-pointer">
              <Calendar className="w-4 h-4 text-gray-400" />
              01 Mar 2024 - 31 Mar 2024
            </button>
            <button className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all shadow-sm cursor-pointer">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grid of Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {reportCategories.map((cat, idx) => (
            <ReportCard key={idx} {...cat} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsLogs;
