import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  ChevronLeft, 
  ChevronRight,
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';

// Dummy Data
const statData = [
  { label: 'Total Members', value: '180,290', change: '2.6%', isDown: true },
  { label: 'Active Users', value: '91,367', change: '0.3%', isDown: false },
  { label: 'Active Time on App', value: '5,180hrs', change: '3.8%', isDown: false },
  { label: 'Active time on Web', value: '7,230hrs', change: '1.8%', isDown: true },
  { label: 'New Registrations', value: '32,620', change: '4.3%', isDown: true },
  { label: 'Inactive Users', value: '32,620', change: '1.4%', isDown: true },
];

const activityData = [
  { month: 'Jan', line1: 40, line2: 60, line3: 80, line4: 100 },
  { month: 'Feb', line1: 35, line2: 65, line3: 85, line4: 110 },
  { month: 'Mar', line1: 45, line2: 70, line3: 90, line4: 120 },
  { month: 'Apr', line1: 50, line2: 75, line3: 95, line4: 130 },
  { month: 'May', line1: 55, line2: 80, line3: 100, line4: 140 },
  { month: 'Jun', line1: 65, line2: 90, line3: 115, line4: 155 },
  { month: 'Jul', line1: 60, line2: 85, line3: 105, line4: 135 },
  { month: 'Aug', line1: 75, line2: 105, line3: 140, line4: 180 },
  { month: 'Sep', line1: 85, line2: 120, line3: 160, line4: 210 },
  { month: 'Oct', line1: 90, line2: 130, line3: 175, line4: 240 },
  { month: 'Nov', line1: 80, line2: 115, line3: 165, line4: 220 },
  { month: 'Dec', line1: 95, line2: 135, line3: 185, line4: 260 },
];

const userData = [
  { id: 1, name: 'Janjohansson', handle: '@janjo', platform: 'Web', country: 'Ghana', city: 'Accra', location: 'Varoy, Bhuapur, Tangail.', lastLogin: 'Mar 30, 16.30', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'Janjohansson', handle: '@janjo', platform: 'Mobile', country: 'Ghana', city: 'Accra', location: 'Varoy, Bhuapur, Tangail.', lastLogin: 'Mar 30, 16.30', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'Janjohansson', handle: '@janjo', platform: 'Web', country: 'Ghana', city: 'Accra', location: 'Varoy, Bhuapur, Tangail.', lastLogin: 'Mar 30, 16.30', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, name: 'Janjohansson', handle: '@janjo', platform: 'Web', country: 'Ghana', city: 'Accra', location: 'Varoy, Bhuapur, Tangail.', lastLogin: 'Mar 30, 16.30', avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: 5, name: 'Janjohansson', handle: '@janjo', platform: 'Web', country: 'Ghana', city: 'Accra', location: 'Varoy, Bhuapur, Tangail.', lastLogin: 'Mar 30, 16.30', avatar: 'https://i.pravatar.cc/150?u=5' },
];

const deviceData = [
  { name: 'Mobile App', value: 54, color: '#2563EB' },
  { name: 'Web Browser', value: 28, color: '#EF4444' },
  { name: 'Others', value: 18, color: '#F59E0B' },
];

const locationData = [
  { name: 'Ghana', percentage: '18.6%', trend: '0.6%', isUp: true, color: '#10B981' },
  { name: 'Zambia', percentage: '6.4%', trend: '0.6%', isUp: true, color: '#8B5CF6' },
  { name: 'Uganda', percentage: '7.3%', trend: '0.6%', isUp: false, color: '#F97316' },
  { name: 'Zambia', percentage: '6.4%', trend: '0.6%', isUp: true, color: '#84CC16' },
  { name: 'Iran', percentage: '9.8%', trend: '0.6%', isUp: true, color: '#2563EB' },
];

const StatCard = ({ label, value, change, isDown }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{label}</h3>
      <div className={`flex items-center text-[10px] font-black ${isDown ? 'text-red-500' : 'text-green-500'}`}>
        {isDown ? '-' : '+'} {change}
      </div>
    </div>
    <div className="text-xl font-black text-[#0d2137]">{value}</div>
  </div>
);

const UserActivity = () => {
  return (
    <div className="flex flex-col gap-5 pb-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-baseline gap-2 mb-1">
        <h1 className="text-xl font-black text-[#0d2137]">User Activity</h1>
        <span className="text-gray-400 font-bold text-lg">— Admin Panel</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-5">
          
          {/* Activity Overview */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <h2 className="text-lg font-black text-[#0d2137]">Activity Overview</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search" 
                    className="pl-9 pr-4 py-1.5 bg-[#F8FAFC] rounded-lg border-none focus:ring-1 focus:ring-blue-500 w-56 text-xs font-bold"
                  />
                </div>
                <button className="bg-[#1E3A8A] text-white px-5 py-1.5 rounded-lg text-xs font-black hover:bg-blue-900 transition-all cursor-pointer">
                  Review
                </button>
                <button className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-black text-gray-700 hover:bg-gray-50 transition-all cursor-pointer">
                  <Download size={14} />
                  Export CSV
                </button>
                <button className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-all cursor-pointer">
                  <Filter size={16} />
                </button>
              </div>
            </div>

            {/* Sub-Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {[
                { label: 'All Activity', value: '1,083,742', color: 'bg-[#1E3A8A]', textColor: 'text-white' },
                { label: 'Logins', value: '13,474', color: 'bg-[#F8FAFC]', textColor: 'text-[#0d2137]' },
                { label: 'Active Time on Platform', value: '345,120hrs', color: 'bg-[#F8FAFC]', textColor: 'text-[#0d2137]' },
                { label: 'Giveaway', value: '354,120', color: 'bg-[#F8FAFC]', textColor: 'text-[#0d2137]' },
                { label: 'Accommodation', value: '652,890', color: 'bg-[#F8FAFC]', textColor: 'text-[#0d2137]' },
              ].map((item, i) => (
                <div key={i} className={`${item.color} ${item.textColor} p-4 rounded-lg shadow-sm`}>
                  <p className="text-[9px] uppercase tracking-wider font-black opacity-60 mb-1">{item.label}</p>
                  <p className="text-base font-black">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorL4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="line4" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorL4)" />
                  <Line type="monotone" dataKey="line1" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="line2" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="line3" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Table Section */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <select className="appearance-none pl-4 pr-10 py-1.5 bg-[#F8FAFC] rounded-lg border-none text-xs font-black text-[#0d2137] focus:ring-1 focus:ring-blue-500 cursor-pointer">
                  <option>All Categories</option>
                </select>
                <ChevronLeft className="-rotate-90 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>
              <div className="relative">
                <select className="appearance-none pl-4 pr-10 py-1.5 bg-[#F8FAFC] rounded-lg border-none text-xs font-black text-[#0d2137] focus:ring-1 focus:ring-blue-500 cursor-pointer">
                  <option>All Status</option>
                </select>
                <ChevronLeft className="-rotate-90 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="w-full pl-10 pr-4 py-1.5 bg-[#F8FAFC] rounded-lg border-none focus:ring-1 focus:ring-blue-500 text-xs font-bold"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-50">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#1E3A8A] text-white">
                    <th className="px-5 py-3 font-black text-[10px] uppercase tracking-wider">User</th>
                    <th className="px-5 py-3 font-black text-[10px] uppercase tracking-wider">Platform</th>
                    <th className="px-5 py-3 font-black text-[10px] uppercase tracking-wider text-center">Country</th>
                    <th className="px-5 py-3 font-black text-[10px] uppercase tracking-wider text-center">City</th>
                    <th className="px-5 py-3 font-black text-[10px] uppercase tracking-wider">Location</th>
                    <th className="px-5 py-3 font-black text-[10px] uppercase tracking-wider">Last Log Ins</th>
                    <th className="px-5 py-3 font-black text-[10px] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {userData.map((user, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-gray-200" />
                          <div>
                            <p className="text-xs font-black text-[#0d2137]">{user.name}</p>
                            <p className="text-[10px] text-gray-400 font-black">{user.handle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-gray-500">{user.platform}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-lg">🇬🇭</span>
                          <span className="text-xs font-black text-[#0d2137]">{user.country}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-bold text-gray-500">{user.city}</td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] text-gray-400 font-medium line-clamp-1 max-w-[150px]">{user.location}</span>
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-gray-500">{user.lastLogin}</td>
                      <td className="px-5 py-3">
                        <button className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-[10px] font-black hover:bg-blue-900 transition-all cursor-pointer">
                          Manage
                          <ChevronLeft className="-rotate-90" size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-5">
              <p className="text-[11px] text-gray-400 font-black">Showing 1-8 of 24</p>
              <div className="flex items-center gap-5">
                <button className="flex items-center gap-1 text-[11px] font-black text-gray-500 hover:text-[#1E3A8A] cursor-pointer">
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <button className="flex items-center gap-1 text-[11px] font-black text-gray-500 hover:text-[#1E3A8A] cursor-pointer">
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-5">
          
          {/* Session Locations */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base font-black text-[#0d2137] mb-5">Session Locations</h2>
            
            <div className="w-full aspect-[4/3] bg-[#F8FAFC] rounded-lg mb-6 flex items-center justify-center overflow-hidden relative border border-gray-50">
              <svg viewBox="0 0 1000 500" className="w-full h-full p-4 opacity-10 fill-[#1E3A8A]">
                 <path d="M150,150 Q200,50 300,100 T500,150 T700,100 T900,200 L900,400 Q800,450 700,400 T500,450 T300,400 T100,450 Z" />
                 <circle cx="280" cy="180" r="15" fill="#8B5CF6" />
                 <circle cx="580" cy="300" r="12" fill="#10B981" />
                 <circle cx="620" cy="280" r="18" fill="#F97316" />
                 <circle cx="850" cy="150" r="22" fill="#2563EB" />
              </svg>
            </div>

            <div className="space-y-4">
              {locationData.map((loc, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-lg shadow-sm" style={{ backgroundColor: loc.color }}></div>
                    <span className="text-xs font-black text-gray-700">{loc.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-[#0d2137]">{loc.percentage}</span>
                    <div className={`flex items-center text-[9px] font-black ${loc.isUp ? 'text-green-500' : 'text-red-500'}`}>
                      <span className="opacity-40 text-gray-400 mr-1.5">0.6%</span>
                      {loc.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Overview */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base font-black text-[#0d2137] mb-5">Device Overview</h2>
            
            <div className="h-[180px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {deviceData.map((dev, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: dev.color }}></div>
                    <span className="text-xs font-black text-gray-700">{dev.name}</span>
                  </div>
                  <span className="text-xs font-black text-[#0d2137]">{dev.value}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserActivity;
