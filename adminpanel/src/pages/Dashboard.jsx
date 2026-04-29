import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  AlertTriangle, 
  TrendingUp, 
  X,
  Hotel,
  ShoppingBag,
  Calendar,
  Gift,
  Users2,
  Shield,
  Zap,
  CheckCircle2,
  Image as ImageIcon,
  Link2,
  ChevronRight,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import moduleBg from '../assets/module_bg.png';
import adminService from '../services/adminService';

const SummaryCard = ({ title, value, subtext, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm"
  >
    <p className="text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">{title}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-[10px] font-bold text-gray-400">GHS</span>
      <h3 className="text-xl font-black text-gray-800">{value}</h3>
    </div>
    {subtext && <p className="text-[10px] text-gray-400 font-medium mt-1">{subtext}</p>}
  </motion.div>
);

const FinanceCard = ({ title, percentage, value, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className={`${colorClass} p-6 rounded-lg text-white shadow-lg relative overflow-hidden group`}
  >
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-sm font-bold opacity-90">{title} <span className="opacity-60">{percentage}</span></h4>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-bold opacity-60">GHS</span>
        <h3 className="text-2xl font-black">{value}</h3>
      </div>
    </div>
    <div className="absolute right-[-10%] bottom-[-20%] w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500"></div>
  </motion.div>
);

const CategoryCard = ({ title, count, label, revenue, reports, delay, badge }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300"
  >
    <div className="h-40 relative flex-shrink-0">
      <img src={moduleBg} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute inset-0 bg-black/40 card-overlay"></div>
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
          {title === 'Accommodation' && <Hotel className="w-4 h-4 text-white" />}
          {title === 'Marketplace' && <ShoppingBag className="w-4 h-4 text-white" />}
          {title === 'Events' && <Calendar className="w-4 h-4 text-white" />}
          {title === 'Free Giveaways' && <Gift className="w-4 h-4 text-white" />}
          {title === 'Community Networking' && <Users2 className="w-4 h-4 text-white" />}
        </div>
        <span className="text-white font-bold text-sm">{title}</span>
      </div>
      {badge && (
        <span className="absolute top-4 right-4 px-2 py-0.5 bg-red-500 text-[10px] font-black text-white rounded-lg uppercase tracking-tighter">
          {badge}
        </span>
      )}
    </div>
    <div className="p-5 space-y-3 flex flex-col flex-1">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black text-gray-800">{count}</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase">{label}</span>
        </div>
      </div>
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5 font-bold text-gray-700">
          <span className="text-[10px] text-gray-400">GHS</span>
          <span>{revenue} <span className="text-[10px] text-gray-400 uppercase">Revenue</span></span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 font-bold text-gray-700 text-xs">
        <span>{reports} <span className="text-[10px] text-gray-400 uppercase">Reports</span></span>
      </div>
      <div className="flex-1"></div>
    </div>
    <button className="w-full py-5 bg-[#e2e8f0] flex items-center justify-between px-6 text-[10px] font-black uppercase tracking-wider text-[#2d5496] hover:bg-[#d1dceb] transition-all duration-300">
      <span className="opacity-80">View {title} Dashboard</span>
      <ChevronRight className="w-4 h-4" />
    </button>
  </motion.div>
);

const OperationalCard = ({ icon: Icon, title, count, revenue, revenueLabel, delay, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${color} bg-opacity-10 text-${color.split('-')[1]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{title}</p>
        <h4 className="text-lg font-black text-gray-800 leading-none">{count}</h4>
      </div>
    </div>
    <div className="pt-3 border-t border-gray-50">
       <div className="flex items-baseline gap-1">
          <span className="text-[8px] font-bold text-gray-400 uppercase">GHS</span>
          <span className="text-sm font-black text-gray-800">{revenue}</span>
          <span className="text-[10px] text-gray-400 font-medium ml-auto uppercase">{revenueLabel}</span>
       </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [counts, setCounts] = useState({
    accommodation: 0,
    marketplace: 0,
    events: 0,
    giveaways: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      try {
        const [acc, mkt, evt, gwy] = await Promise.all([
          adminService.getAccommodationCount(),
          adminService.getMarketplaceCount(),
          adminService.getEventCount(),
          adminService.getGiveawaysCount()
        ]);
        
        setCounts({
          accommodation: acc,
          marketplace: mkt,
          events: evt,
          giveaways: gwy
        });
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Ghana <span className="text-gray-300 font-normal mx-2">—</span> Master Overview
        </h1>
      </div>

      {/* Warning Alert */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#fff4e5] border border-[#ffe5cc] p-4 rounded-lg flex items-center gap-3 justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#ff9800] rounded-lg">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-[#663c00]">
            Abuse surge detected in Community Networking — <span className="font-black underline scale-105 inline-block">12 new reports in last 24h</span>
          </p>
        </div>
        <button className="text-[#663c00] opacity-50 hover:opacity-100 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard title="Total Revenue" value="124,500" delay={0.1} />
        <SummaryCard title="EzyDash Margin" value="37,350" delay={0.2} />
        <SummaryCard title="Total Users" value="1,285,500" delay={0.3} />
        <SummaryCard title="Active Users" value="124,500" subtext="Need Attention" delay={0.4} />
        <SummaryCard title="Reported Content" value="56" subtext="Pending" delay={0.5} />
        <SummaryCard title="Actions Taken" value="112" subtext="This Month" delay={0.6} />
      </div>

      {/* Financial Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinanceCard title="Organizer Payout" percentage="60%" value="74,700" colorClass="bg-gradient-to-br from-[#df7280] to-[#e896a1]" delay={0.1} />
        <FinanceCard title="Regulatory Tax" percentage="10%" value="12,450" colorClass="bg-gradient-to-br from-[#8e74e1] to-[#a996ea]" delay={0.2} />
        <FinanceCard title="Gateway Levy" percentage="24%" value="6,320" colorClass="bg-gradient-to-br from-[#ffb24d] to-[#ffcc80]" delay={0.3} />
        <FinanceCard title="EzyDash" percentage="30%" value="53,680" colorClass="bg-gradient-to-br from-[#00c9e0] to-[#33f5ff]" delay={0.4} />
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <CategoryCard title="Accommodation" count={loading ? '...' : counts.accommodation} label="Listings" revenue="58.2K" reports="75" delay={0.1} />
        <CategoryCard title="Marketplace" count={loading ? '...' : counts.marketplace} label="Listings" revenue="32.1K" reports="75" delay={0.2} badge="High-Risk" />
        <CategoryCard title="Events" count={loading ? '...' : counts.events} label="Events" revenue="24.5K" reports="30" delay={0.3} />
        <CategoryCard title="Free Giveaways" count={loading ? '...' : counts.giveaways} label="Giveaways" revenue="18.1K" reports="14" delay={0.4} />
        <CategoryCard title="Community Networking" count="5320" label="Members" revenue="1.4K" reports="12" delay={0.5} />
      </div>

      {/* Operational Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <OperationalCard icon={Zap} title="Ad Boost" count="84" revenue="28,060" revenueLabel="Revenue" delay={0.1} color="bg-rose-500" />
        <OperationalCard icon={CheckCircle2} title="Subscriptions" count="1250" revenue="124,500" revenueLabel="Revenue Margin" delay={0.2} color="bg-brand-secondary" />
        <OperationalCard icon={Shield} title="User Verification" count="1020" revenue="124,500" revenueLabel="Revenue" delay={0.3} color="bg-amber-500" />
        <OperationalCard icon={ImageIcon} title="Banner Ads" count="84" revenue="8,430" revenueLabel="Revenue" delay={0.4} color="bg-cyan-500" />
        <OperationalCard icon={Link2} title="Connections" count="124,230" revenue="6,480" revenueLabel="Revenue Margin" delay={0.5} color="bg-emerald-500" />
      </div>

      {/* Data Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Ads */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-800 text-sm uppercase">Recent Ads</h3>
          </div>
          <div className="px-4 py-3">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#2d5496] text-white rounded-lg text-[10px] font-black uppercase tracking-wider mb-2">
              <span className="col-span-6">Title</span>
              <span className="col-span-3 text-center">Status</span>
              <span className="col-span-3 text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-200">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="py-4 grid grid-cols-12 gap-4 items-center px-4 hover:bg-gray-50/50 transition-colors">
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Hotel className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-sm font-bold text-gray-700 truncate">House for Rent</span>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <span className="px-2.5 py-1 bg-[#10b981] text-white text-[10px] font-black rounded-lg uppercase">Active</span>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button className="px-4 py-1.5 bg-[#ef4444] text-white text-[10px] font-black rounded-lg uppercase hover:bg-rose-600 transition-colors">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full py-4 bg-[#e2e8f0] text-[10px] font-black uppercase text-gray-500 hover:text-brand-primary transition-colors flex items-center justify-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Reported Content */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-800 text-sm uppercase">Reported Content</h3>
          </div>
          <div className="px-4 py-3">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#2d5496] text-white rounded-lg text-[10px] font-black uppercase tracking-wider mb-2">
              <span className="col-span-5">Title</span>
              <span className="col-span-4 text-center">Issue</span>
              <span className="col-span-3 text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-200">
              {[
                { name: "Rasel", issue: "Inappropriate Post" },
                { name: "Ibrahim", issue: "Inappropriate Post" },
                { name: "Newaz", issue: "Inappropriate Post" },
              ].map((user, i) => (
                <div key={i} className="py-4 grid grid-cols-12 gap-4 items-center px-4 hover:bg-gray-50/50 transition-colors">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                      <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 truncate">{user.name}</p>
                  </div>
                  <div className="col-span-4 text-center">
                    <p className="text-xs font-bold text-gray-800">{user.issue}</p>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button className="px-4 py-1.5 bg-[#2d5496] text-white text-[10px] font-black rounded-lg uppercase hover:bg-[#204075] transition-colors">Review</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full py-4 bg-[#e2e8f0] text-[10px] font-black uppercase text-gray-500 hover:text-brand-primary transition-colors flex items-center justify-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* User Violations */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-800 text-sm uppercase">User Violations</h3>
          </div>
          <div className="px-4 py-3">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#2d5496] text-white rounded-lg text-[10px] font-black uppercase tracking-wider mb-2">
              <span className="col-span-5">Title</span>
              <span className="col-span-4 text-center">Violations</span>
              <span className="col-span-3 text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-200">
              {[
                { name: "Akash", status: "Warning Issued" },
                { name: "Razib", status: "Warning Issued" },
                { name: "Manik", status: "Warning Issued" },
              ].map((user, i) => (
                <div key={i} className="py-4 grid grid-cols-12 gap-4 items-center px-4 hover:bg-gray-50/50 transition-colors">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                      <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 truncate">{user.name}</p>
                  </div>
                  <div className="col-span-4 text-center">
                    <p className="text-xs font-bold text-gray-800">{user.status}</p>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button className="px-4 py-1.5 bg-[#2d5496] text-white text-[10px] font-black rounded-lg uppercase hover:bg-[#204075] transition-colors">Review</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full py-4 bg-[#e2e8f0] text-[10px] font-black uppercase text-gray-500 hover:text-brand-primary transition-colors flex items-center justify-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

