import React, { useState, useEffect } from 'react';
import { 
  Hotel, 
  Search, 
  ChevronDown, 
  Star,
  Download,
  Plus,
  RefreshCcw,
  Zap,
  ShieldAlert,
  MessageSquare,
  Filter,
  MoreVertical,
  ChevronRight,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import adminService from '../services/adminService';

const StatCard = ({ title, value, prefix = "", suffix = "" }) => (
  <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col items-center text-center">
    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{title}</p>
    <div className="flex items-baseline gap-1">
      {prefix && <span className="text-xs font-black text-gray-400">{prefix}</span>}
      <h3 className="text-2xl font-black text-gray-800 tracking-tight">{value}</h3>
      {suffix && <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">{suffix}</span>}
    </div>
  </div>
);

const Accommodations = () => {
  const [accommodations, setAccommodations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All Listings');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [openManageId, setOpenManageId] = useState(null);

  // Mock data for sidebar
  const reportedListings = [
    {
      id: 1,
      title: 'Luxury Flat for sale',
      category: 'Accommodation',
      reasons: ['Inappropriate Images', 'Fake Listing', 'Fraud Suspicion'],
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop'
    }
  ];

  const suspendedHosts = [
    { id: 1, title: 'Luxury Flat for sale', category: 'Electronics', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&h=200&fit=crop' },
    { id: 2, title: 'Luxury Flat for sale', category: 'Electronics', image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=300&h=200&fit=crop' },
    { id: 3, title: 'Luxury Flat for sale', category: 'Electronics', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop' }
  ];

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, activeTab, selectedRegion]);

  const fetchRegions = async () => {
    try {
      const data = await adminService.getAccommodationRegions();
      setRegions(data || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const count = await adminService.getAccommodationCount();
      setTotalCount(count);

      const data = await adminService.getAccommodations(page, 10, selectedRegion);
      setAccommodations(data.accommodations || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setPage(1);
    setIsRegionDropdownOpen(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      {/* Page Title */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
          Accommodation
        </h1>
      </div>

      {/* Summary Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Listings" value="920" />
        <StatCard title="Active Listings" value="832" />
        <StatCard title="Total Bookings" value="2,035" />
        <StatCard title="Total Revenue" prefix="GHS" value="32,750" />
        <StatCard title="Average Booking" value="3.6" suffix="Nights" />
        <StatCard title="Reported" prefix="GHS" value="32,750" />
      </div>

      {/* Top Toolbar Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-black text-gray-800 tracking-tight">Accommodation Overview</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2d5496] transition-colors" />
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5496]/20 focus:border-[#2d5496] transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="px-6 py-2.5 bg-[#2d5496] text-white text-xs font-black rounded-xl uppercase hover:bg-[#1d3a6d] transition-colors shadow-sm">Review</button>
          <button className="px-6 py-2.5 bg-rose-500 text-white text-xs font-black rounded-xl uppercase hover:bg-rose-600 transition-colors shadow-sm">Suspend</button>
          <button className="px-6 py-2.5 bg-emerald-500 text-white text-xs font-black rounded-xl uppercase hover:bg-emerald-600 transition-colors shadow-sm">Boost</button>
          <button className="px-6 py-2.5 bg-[#2d5496] text-white text-xs font-black rounded-xl uppercase hover:bg-[#1d3a6d] transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-9 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {/* Filter Tabs Row */}
            <div className="px-8 py-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-50">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                {['All Listings', 'Reported Listings', 'Suspensions'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap
                      ${activeTab === tab 
                        ? 'bg-[#2d5496] text-white shadow-lg shadow-[#2d5496]/20' 
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'}`}
                  >
                    {tab}
                    {tab === 'All Listings' && <ChevronDown className="w-3 h-3" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {/* Location Filter */}
                <div className="relative">
                  <button 
                    onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-black text-gray-600 hover:border-[#2d5496] transition-colors group"
                  >
                    <span>{selectedRegion || 'All Locations'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-[#2d5496] transition-transform ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isRegionDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-50 shadow-2xl rounded-2xl p-2 z-[60]"
                      >
                        <div onClick={() => handleRegionSelect('')} className="px-3 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer">All Locations</div>
                        {regions.map(r => (
                          <div key={r} onClick={() => handleRegionSelect(r)} className="px-3 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer">{r}</div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-black text-gray-600">
                  Status
                </div>

                <div className="h-8 w-px bg-gray-100 mx-2" />

                <button className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-800 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
                <Filter className="w-4 h-4 text-gray-400 cursor-pointer" />
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-hidden">
              <div className="px-8 py-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-[#2d5496] text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
                  <div className="col-span-3 flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-0 cursor-pointer" />
                    <span>Title</span>
                  </div>
                  <span className="col-span-1 text-center">Host</span>
                  <span className="col-span-1 text-center">Location</span>
                  <span className="col-span-1 text-center">Type</span>
                  <span className="col-span-1 text-center">Price</span>
                  <span className="col-span-1 text-center whitespace-nowrap">Booking</span>
                  <span className="col-span-1 text-center">Review</span>
                  <span className="col-span-1 text-center">Status</span>
                  <span className="col-span-2 text-center">Action</span>
                </div>

                {/* Table Rows with distinct lining */}
                <div className="flex flex-col">
                  {loading ? (
                    <div className="py-20 text-center col-span-12">
                      <RefreshCcw className="w-8 h-8 text-[#2d5496] animate-spin mx-auto mb-4" />
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading...</p>
                    </div>
                  ) : (
                    accommodations.map((item) => (
                      <div key={item._id} className="grid grid-cols-12 gap-2 items-center px-6 py-4 hover:bg-gray-50/50 transition-colors relative border-b border-gray-200 bg-white">
                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-0 cursor-pointer" />
                          <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                            {item.itemImages?.[0] ? (
                              <img src={item.itemImages[0]} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                <Hotel className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-gray-800 leading-tight truncate">{item.title}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 truncate">{item.propertyType || 'Apartment'}</span>
                          </div>
                        </div>

                        <div className="col-span-1 text-center">
                          <span className="text-[11px] font-bold text-gray-600 truncate block">{item.name || 'Tayo NK'}</span>
                        </div>

                        <div className="col-span-1 text-center">
                          <span className="text-[11px] font-bold text-gray-600 truncate block">{item.region || 'Bhuapur'}</span>
                        </div>

                        <div className="col-span-1 flex items-center justify-center gap-1 text-[11px] font-bold text-gray-600">
                          <Hotel className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{item.propertyType || 'Apt'}</span>
                        </div>

                        <div className="col-span-1 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">GHS</span>
                            <span className="text-[11px] font-black text-gray-800">{(item.price || 34210).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="col-span-1 text-center">
                          <span className="text-[11px] font-black text-gray-600">{item.totalViews || 18}</span>
                        </div>

                        <div className="col-span-1 flex justify-center">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star 
                                key={s} 
                                className={`w-2.5 h-2.5 ${s <= (item.averageRatings || 4) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
                              />
                            ))}
                          </div>
                        </div>

                        <div className="col-span-1 flex justify-center">
                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded uppercase tracking-tighter">Active</span>
                        </div>

                        <div className="col-span-2 flex justify-center relative">
                          <button 
                            onClick={() => setOpenManageId(openManageId === item._id ? null : item._id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#2d5496] text-white text-[9px] font-black rounded-lg uppercase hover:bg-[#1d3a6d] transition-all whitespace-nowrap"
                          >
                            Manage <ChevronDown className={`w-2.5 h-2.5 transition-transform ${openManageId === item._id ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Showing {accommodations.length} of {totalCount} Listings
              </p>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase text-gray-500 disabled:opacity-50 hover:border-[#2d5496] transition-colors"
                >
                  Prev
                </button>
                <div className="flex gap-1.5">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-xl text-[11px] font-black flex items-center justify-center transition-all ${
                        page === i + 1 
                          ? 'bg-[#2d5496] text-white shadow-lg' 
                          : 'bg-white border border-gray-200 text-gray-500 hover:border-[#2d5496]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase text-gray-500 disabled:opacity-50 hover:border-[#2d5496] transition-colors flex items-center gap-2"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebars Area */}
        <div className="xl:col-span-3 space-y-6">
          {/* Reported Listings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-6">Reported Listings</h3>
            <div className="space-y-4">
              {reportedListings.map(item => (
                <div key={item.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-300 group hover:bg-white hover:shadow-md transition-all">
                  <div className="flex gap-4 mb-4">
                    <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-black text-gray-800 leading-tight mb-1 truncate">{item.title}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{item.category}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {item.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-rose-500">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {reason}
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-2 bg-[#2d5496] text-white text-[10px] font-black rounded-lg uppercase hover:bg-[#1d3a6d] transition-colors">
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Suspended Hosts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-6">Suspended Hosts</h3>
            <div className="space-y-4">
              {suspendedHosts.map(host => (
                <div key={host.id} className="p-3 bg-gray-50/50 rounded-2xl border border-gray-300 group hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      <img src={host.image} alt={host.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black text-gray-800 truncate">{host.title}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase truncate">{host.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-1.5 bg-rose-500 text-white text-[9px] font-black rounded-lg uppercase">Suspended</button>
                    <button className="flex-1 py-1.5 bg-[#2d5496] text-white text-[9px] font-black rounded-lg uppercase">Manage</button>
                  </div>
                </div>
              ))}
              <button className="w-full mt-4 flex items-center justify-between text-[10px] font-black uppercase text-gray-400 hover:text-[#2d5496] transition-colors group">
                See all Listings
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accommodations;
