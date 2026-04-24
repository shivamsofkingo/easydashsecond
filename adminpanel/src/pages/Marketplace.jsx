import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  ChevronDown, 
  MoreVertical, 
  Plus, 
  Filter, 
  Download,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Monitor,
  Hotel,
  Zap,
  Package,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data for the table
const listingsData = [
  { id: 1, title: 'Samsung Galaxy S7', user: 'Rasel', category: 'Electronics', status: 'Boosted', revenue: 'GHS 812', date: '2 days ago', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=100&h=100&fit=crop' },
  { id: 2, title: 'iPhone 14 Pro Max', user: 'Rasel', category: 'Fashion', status: 'Paused', revenue: 'GHS 236', date: '1 day ago', image: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=100&h=100&fit=crop' },
  { id: 3, title: 'Laptop for Sale', user: 'Rasel', category: 'Services', status: 'Pending', revenue: 'GHS 258', date: '6 days ago', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop' },
  { id: 4, title: 'Home for sale', user: 'Rasel', category: 'Services', status: 'Boosted', revenue: 'GHS 258', date: '1 day ago', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&h=100&fit=crop' },
  { id: 5, title: 'Dining Table Set', user: 'Rasel', category: 'Home', status: 'Boosted', revenue: 'GHS 472', date: '11 days ago', image: 'https://images.unsplash.com/photo-1577145900571-030671eb9004?w=100&h=100&fit=crop' },
];

const categoryCards = [
  { title: 'Study Materials', listings: 600, boosted: 392, revenue: '15.4K', color: 'bg-indigo-50', icon: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&h=100&fit=crop' },
  { title: 'Electronics & Gadgets', listings: 600, boosted: 210, revenue: '9.8K', color: 'bg-blue-50', icon: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=150&h=100&fit=crop' },
  { title: 'Furniture & Homewares', listings: 600, boosted: 302, revenue: '4.4K', color: 'bg-stone-50', icon: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=150&h=100&fit=crop' },
  { title: 'Gigs & Services', listings: 600, boosted: 183, revenue: '2.8K', color: 'bg-emerald-50', icon: 'https://images.unsplash.com/photo-1454165833767-027ffdd7031e?w=150&h=100&fit=crop' },
  { title: 'Stationary & Supplies', listings: 600, boosted: 115, revenue: '0.8K', color: 'bg-amber-50', icon: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=150&h=100&fit=crop' },
  { title: 'Other Goods & Services', listings: 600, boosted: 392, revenue: '15.4K', color: 'bg-rose-50', icon: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&h=100&fit=crop' },
];

const reportedContent = [
  { title: 'Toyota Corolla 2024', category: 'Electronics', trend: '+620', revenue: '500', isUp: true, image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=100&h=60&fit=crop' },
  { title: 'Apple Macbook Air', category: 'Electronics', trend: '-620', revenue: '500', isUp: false, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&h=60&fit=crop' },
  { title: 'Room for Rent', category: 'Electronics', trend: '+620', revenue: '500', isUp: true, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=100&h=60&fit=crop' },
  { title: 'Samsung Galaxy S22', category: 'Electronics', trend: '+620', revenue: '500', isUp: true, image: 'https://images.unsplash.com/photo-1644141655284-369f9e15904d?w=100&h=60&fit=crop' },
  { title: 'Samsung Galaxy S22', category: 'Electronics', trend: '+620', revenue: '500', isUp: true, image: 'https://images.unsplash.com/photo-1644141655284-369f9e15904d?w=100&h=60&fit=crop' },
];

const StatCard = ({ title, value, prefix = "" }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 min-w-[200px] flex-1">
    <p className="text-xs font-bold text-gray-500 uppercase tracking-tight mb-2">{title}</p>
    <div className="flex items-baseline gap-1">
      {prefix && <span className="text-xs font-bold text-gray-400">{prefix}</span>}
      <h3 className="text-2xl font-black text-gray-800 tracking-tight">{value}</h3>
    </div>
  </div>
);

const Marketplace = () => {
  const [activeTab, setActiveTab] = useState('All Categories');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showFlagOptions, setShowFlagOptions] = useState(null);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Marketplace</h1>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Listings" value="3,440" />
        <StatCard title="Boosted Listings" value="318" />
        <StatCard title="Listing Pending Review" value="22" />
        <StatCard title="Deleted Listings" value="78" />
        <StatCard title="Total marketplace Revenue" prefix="GHS" value="32,750" />
      </div>

      {/* Revenue Breakdown Section */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <h2 className="text-xl font-black text-gray-800">Revenue Breakdown</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2d5496] transition-colors" />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5496]/20 focus:border-[#2d5496] transition-all"
              />
            </div>
            <button className="px-6 py-2.5 bg-[#2d5496] text-white text-xs font-black rounded-xl uppercase hover:bg-[#204075] transition-colors">Review</button>
            <button className="px-6 py-2.5 bg-[#ef4444] text-white text-xs font-black rounded-xl uppercase hover:bg-rose-600 transition-colors">Suspend</button>
            <button className="px-6 py-2.5 bg-[#10b981] text-white text-xs font-black rounded-xl uppercase hover:bg-emerald-600 transition-colors">Boost</button>
          </div>
        </div>

        {/* Categories Tabs & Export */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
            {['All Categories', 'Boosting', 'Feedback'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-2
                  ${activeTab === tab 
                    ? 'bg-[#2d5496] text-white shadow-lg shadow-[#2d5496]/20' 
                    : 'text-gray-500 hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}
              >
                {tab}
                {tab === 'All Categories' && <ChevronDown className="w-3 h-3" />}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <button className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-gray-800 transition-colors border-r border-gray-200 pr-4">
              <Download className="w-3 h-3" />
              Export CSV
            </button>
            <div className="flex items-center gap-2">
               <button className="p-2 text-gray-400 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
               <button className="p-2 text-gray-400 hover:text-gray-600"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {categoryCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-lg ${card.color} border border-gray-100 hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="h-28 relative rounded-lg overflow-hidden mb-4">
                 <img src={card.icon} alt={card.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                 <div className="absolute inset-0 bg-black/10"></div>
              </div>
              <h4 className="text-[13px] font-black text-gray-800 mb-4 leading-tight">{card.title}</h4>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-gray-800">{card.listings}</span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Listings</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-gray-800">{card.boosted}</span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Boosted</span>
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">GHS</span>
                  <span className="text-sm font-black text-gray-800">{card.revenue}</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter ml-1">Revenue</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Listings Section */}
        <div className="xl:col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50">
            <h3 className="text-lg font-black text-gray-800 mb-6">Listings</h3>
            
            <div className="flex flex-wrap items-center gap-3">
               <div className="relative min-w-[140px]">
                 <select className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2d5496]/20">
                   <option>All Listings</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
               </div>
               <div className="relative min-w-[180px]">
                 <select className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2d5496]/20">
                   <option>Reported Listing (310)</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
               </div>
               <div className="relative min-w-[140px]">
                 <select className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2d5496]/20">
                   <option>Category</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
               </div>
               <div className="relative group flex-1 min-w-[200px]">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Search" 
                    className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2d5496]/20 transition-all"
                 />
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="px-8 py-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-[#2d5496] text-white rounded-xl text-[10px] font-black uppercase tracking-wider mb-2">
                <div className="col-span-3 flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-0 cursor-pointer" />
                  <span>Title</span>
                </div>
                <span className="col-span-1 text-center">User</span>
                <span className="col-span-2 text-center">Category</span>
                <span className="col-span-2 text-center">Boost Status</span>
                <span className="col-span-1 text-center">Revenue</span>
                <span className="col-span-1 text-center">Date</span>
                <span className="col-span-2 text-left pl-10">Action</span>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-200 border-b border-gray-200">
                {listingsData.map((item, i) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center px-6 py-4 hover:bg-gray-50/50 transition-colors relative">
                    <div className="col-span-3 flex items-center gap-3 min-w-0">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-0 cursor-pointer" />
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-gray-800 truncate">{item.title}</span>
                        {item.id === 3 && <span className="text-[10px] text-orange-500 font-bold">for Sale</span>}
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-xs font-bold text-gray-600">{item.user}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1.5 min-w-0">
                      <div className="p-1 bg-gray-100 rounded flex-shrink-0">
                        {item.category === 'Electronics' && <Zap className="w-3 h-3 text-gray-500" />}
                        {item.category === 'Fashion' && <ShoppingBag className="w-3 h-3 text-gray-500" />}
                        {item.category === 'Services' && <Package className="w-3 h-3 text-gray-500" />}
                        {item.category === 'Home' && <Hotel className="w-3 h-3 text-gray-500" />}
                      </div>
                      <span className="text-[11px] font-bold text-gray-600 truncate">{item.category}</span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <span className={`px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-tighter ${
                        item.status === 'Boosted' ? 'bg-orange-500 text-white' : 
                        item.status === 'Paused' ? 'bg-[#2d5496] text-white' :
                        'bg-amber-400 text-white'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-[11px] font-black text-gray-800 whitespace-nowrap">{item.revenue}</span>
                    </div>
                    <div className="col-span-1 text-center pr-2">
                      <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{item.date}</span>
                    </div>
                    <div className="col-span-2 flex justify-start pl-8 relative">
                      <button 
                        onClick={() => {
                          setOpenDropdown(openDropdown === item.id ? null : item.id);
                          setShowFlagOptions(null);
                        }}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2d5496] text-white text-[10px] font-black rounded-lg uppercase transition-all hover:bg-[#204075] whitespace-nowrap"
                      >
                        Manage <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === item.id ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Manage Dropdown */}
                      <AnimatePresence>
                        {openDropdown === item.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] py-2"
                          >
                             {['View User', 'View Ad', 'Flag Ad', 'Message User'].map((action) => (
                               <button 
                                 key={action} 
                                 onClick={() => action === 'Flag Ad' && setShowFlagOptions(!showFlagOptions)}
                                 className={`w-full px-4 py-2 text-left text-xs font-bold flex items-center justify-between transition-colors
                                   ${action === 'Flag Ad' && showFlagOptions ? 'bg-gray-50 text-[#2d5496]' : 'text-gray-600 hover:bg-gray-50'}`}
                               >
                                 {action}
                                 {action === 'Flag Ad' && <ChevronRight className={`w-3 h-3 transition-transform ${showFlagOptions ? 'rotate-90' : ''}`} />}
                               </button>
                             ))}
                             
                             {/* Nested flag menu */}
                             <AnimatePresence>
                               {showFlagOptions && (
                                 <motion.div
                                   initial={{ opacity: 0, height: 0 }}
                                   animate={{ opacity: 1, height: 'auto' }}
                                   exit={{ opacity: 0, height: 0 }}
                                   className="overflow-hidden bg-gray-50/50"
                                 >
                                   <div className="mx-2 my-1 border-t border-gray-100"></div>
                                   {['Inappropriate Post', 'Fake Listing', 'Suspected Scam'].map((flag) => (
                                     <button key={flag} className="w-full px-6 py-2 text-left text-[10px] font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                       {flag}
                                     </button>
                                   ))}
                                 </motion.div>
                               )}
                             </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Pagination */}
          <div className="p-8 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Showing 1-8 of 24</span>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-xs font-black uppercase text-gray-400 hover:text-gray-800 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button className="flex items-center gap-1 text-xs font-black uppercase text-gray-800 hover:text-[#2d5496] transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Reported Content Sidebar */}
        <div className="xl:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col">
          <h3 className="text-lg font-black text-gray-800 mb-8">Reported Content</h3>
          
          <div className="space-y-4 flex-1">
            {reportedContent.map((item, i) => (
              <div key={i} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-4 hover:bg-white hover:shadow-md transition-all cursor-pointer">
                <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="text-sm font-black text-gray-800 truncate">{item.title}</h4>
                   <p className="text-[10px] font-bold text-gray-400 uppercase">{item.category}</p>
                </div>
                <div className="text-right">
                   <div className={`flex items-center justify-end gap-1 text-xs font-black ${item.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                     {item.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                     {item.trend}
                   </div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">GHS {item.revenue}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-8 py-4 bg-gray-50 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-[#2d5496] hover:bg-[#e2e8f0] transition-all flex items-center justify-center gap-1">
             View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
