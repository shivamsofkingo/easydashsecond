import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Ticket, 
  ClipboardCheck, 
  Clock, 
  RotateCcw, 
  AlertCircle,
  Search,
  Filter,
  Download,
  LayoutGrid,
  ChevronDown,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Eye,
  Flag,
  MessageSquare,
  BarChart3,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import adminService from '../services/adminService';

const Events = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTicketsSold: 0,
    pendingReview: 0,
    upcomingEvents: 0,
    totalRefunds: 0,
    canceledEvents: 0
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Events');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [page, activeTab]);

  const fetchStats = async () => {
    const data = await adminService.getEventDashboardStats();
    if (data) setStats(data);
  };

  const fetchEvents = async () => {
    setLoading(true);
    const type = activeTab.toLowerCase().split(' ')[0]; // 'all', 'upcoming', 'past', 'delete' (deleted)
    const data = await adminService.getEvents(page, type === 'all' ? 'all' : type);
    setEvents(data.events || []);
    setTotalPages(data.meta?.totalPages || 1);
    setLoading(false);
  };

  const statCards = [
    { title: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'text-gray-800' },
    { title: 'Total Tickets Sold', value: stats.totalTicketsSold.toLocaleString(), icon: Ticket, color: 'text-gray-800' },
    { title: 'Listing Pending Review', value: stats.pendingReview, icon: ClipboardCheck, color: 'text-gray-800' },
    { title: 'Upcoming Events', value: stats.upcomingEvents, icon: Clock, color: 'text-gray-800' },
    { title: 'Refunds', value: `GHS ${stats.totalRefunds.toLocaleString()}`, icon: RotateCcw, color: 'text-gray-800' },
    { title: 'Canceled Events', value: stats.canceledEvents, icon: AlertCircle, color: 'text-gray-800' },
  ];

  const getStatusStyle = (event) => {
    const today = new Date();
    const eventDate = new Date(event.date);
    
    if (event.eventStatus === 'cancelled') return 'bg-red-100 text-red-600';
    if (event.isEventCompleted || eventDate < today) return 'bg-purple-100 text-purple-600';
    if (event.eventStatus === 'postponed') return 'bg-orange-100 text-orange-600';
    return 'bg-blue-100 text-blue-600';
  };

  const getStatusText = (event) => {
    const today = new Date();
    const eventDate = new Date(event.date);
    
    if (event.eventStatus === 'cancelled') return 'Cancelled';
    if (event.isEventCompleted || eventDate < today) return 'Ended';
    if (event.eventStatus === 'postponed') return 'Pause';
    return 'Active';
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 px-4 md:px-0 overflow-x-hidden">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-4 md:p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">{card.title}</p>
            <h3 className={`text-xl md:text-2xl font-black ${card.color}`}>{card.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-800">Revenue Breakdown</h2>
            <button className="px-5 py-2.5 bg-[#02b290] text-white rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-[#029a7c] transition-colors shadow-sm whitespace-nowrap">
              View Tickets History
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-[700px] overflow-hidden">
            {/* Tabs & Filters */}
            <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 bg-gray-50/30">
              <div className="flex flex-wrap items-center p-1 bg-gray-100/50 border border-gray-100 rounded-lg gap-1">
                {['All Events', 'Upcoming Events', 'Past Events', 'Delete Event'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-tight rounded-lg transition-all ${
                      activeTab === tab ? 'bg-[#2d5496] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab} {tab === 'All Events' && `(${stats.totalEvents})`}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-3">
                 <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-gray-600 hover:border-brand-primary transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                 </button>
                 <div className="flex items-center p-1 bg-white border border-gray-100 rounded-xl gap-1">
                    <button className="p-1.5 rounded-lg bg-gray-50 text-gray-400"><LayoutGrid className="w-4 h-4" /></button>
                    <button className="p-1.5 rounded-lg text-gray-400"><MoreVertical className="w-4 h-4" /></button>
                 </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 flex flex-wrap items-center gap-4 border-b border-gray-50 bg-white">
               <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[10px] font-black text-gray-600 min-w-[120px] justify-between cursor-pointer hover:bg-gray-100 transition-colors">
                  <span>Categories</span>
                  <ChevronDown className="w-3 h-3" />
               </div>
               <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[10px] font-black text-gray-600 min-w-[120px] justify-between cursor-pointer hover:bg-gray-100 transition-colors">
                  <span>Status</span>
                  <ChevronDown className="w-3 h-3" />
               </div>
               <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-[#2d5496] rounded-xl text-sm font-medium outline-none transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
               </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-hidden">
              <table className="w-full text-left border-separate border-spacing-0 table-fixed">
                <thead>
                  <tr className="bg-[#2d5496] text-white">
                    <th className="w-10 px-4 py-4 rounded-tl-lg">
                      <input type="checkbox" className="rounded border-white/20 bg-white/10" />
                    </th>
                    <th className="w-[28%] px-2 py-4 text-[9px] font-black uppercase tracking-wider">Title</th>
                    <th className="w-[12%] px-2 py-4 text-[9px] font-black uppercase tracking-wider">Category</th>
                    <th className="w-[12%] px-2 py-4 text-[9px] font-black uppercase tracking-wider">Sold</th>
                    <th className="w-[12%] px-2 py-4 text-[9px] font-black uppercase tracking-wider">Status</th>
                    <th className="w-[14%] px-2 py-4 text-[9px] font-black uppercase tracking-wider">Payout</th>
                    <th className="w-[11%] px-2 py-4 text-[9px] font-black uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="w-[11%] px-2 py-4 text-[9px] font-black uppercase tracking-wider rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {loading ? (
                    <tr><td colSpan="8" className="py-20 text-center animate-pulse text-gray-400 uppercase font-black tracking-widest text-[9px]">Loading Events...</td></tr>
                  ) : events.length === 0 ? (
                    <tr><td colSpan="8" className="py-20 text-center text-gray-400 uppercase font-black tracking-widest text-[9px]">No Events Found</td></tr>
                  ) : (
                    events.map((event) => (
                      <tr 
                        key={event._id} 
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="px-4 py-4 border-b border-gray-200">
                          <input type="checkbox" className="rounded border-gray-200" />
                        </td>
                        <td className="px-2 py-4 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm group-hover:scale-105 transition-transform duration-300">
                              {event.itemImages?.[0] ? (
                                <img src={event.itemImages[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Calendar className="w-4 h-4 text-gray-300 m-auto mt-2.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-black text-gray-800 leading-tight truncate">{event.title}</p>
                              <p className="text-[8px] text-gray-400 font-bold mt-1 flex items-center gap-1">
                                <span className="text-[#2d5496] truncate">
                                  Posted by: {typeof event.userId === 'object' ? event.userId.name : (event.userId?.name || 'shivam')}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-4 border-b border-gray-200">
                          <span className="px-2 py-1 bg-gray-50 rounded-lg text-[8px] font-black text-gray-500 uppercase tracking-tight border border-gray-200">
                            {Array.isArray(event.category) ? event.category[0] : event.category || 'Event'}
                          </span>
                        </td>
                        <td className="px-2 py-4 border-b border-gray-200">
                           <div className="flex flex-col">
                              <p className="text-[10px] font-black text-gray-800">{event.totalSeats - event.availableSeats}/{event.totalSeats}</p>
                              <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                 <div 
                                   className="h-full bg-[#02b290] rounded-full" 
                                   style={{ width: `${Math.min(100, ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100)}%` }}
                                 />
                              </div>
                           </div>
                        </td>
                        <td className="px-2 py-4 border-b border-gray-200">
                           <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider inline-block ${getStatusStyle(event)}`}>
                             {getStatusText(event)}
                           </span>
                        </td>
                        <td className="px-2 py-4 border-b border-gray-200">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-800 truncate">{(event.organizerRevenue || 0).toLocaleString()} {event.currency || 'USD'}</span>
                              <span className="text-[7px] font-bold text-gray-300 uppercase">Holding</span>
                           </div>
                        </td>
                        <td className="px-2 py-4 border-b border-gray-200">
                           <span className="text-[10px] font-black text-gray-500 whitespace-nowrap">
                             {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                           </span>
                        </td>
                        <td className="px-2 py-4 border-b border-gray-200 relative">
                           <button 
                             onClick={() => setOpenMenuId(openMenuId === event._id ? null : event._id)}
                             className="flex items-center gap-1 px-3 py-1.5 bg-[#2d5496] text-white rounded-lg text-[9px] font-black uppercase hover:bg-[#1e3a8a] transition-all shadow-sm active:scale-95 whitespace-nowrap ml-auto"
                           >
                             Manage
                             <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${openMenuId === event._id ? 'rotate-180' : ''}`} />
                           </button>

                           <AnimatePresence>
                             {openMenuId === event._id && (
                               <motion.div 
                                 initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                 animate={{ opacity: 1, scale: 1, y: 0 }}
                                 exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                 className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 p-1.5 z-[999] origin-top-right"
                               >
                                  {[
                                    { icon: User, label: 'View User' },
                                    { icon: Eye, label: 'View Ad' },
                                    { icon: Flag, label: 'Flag Ad' },
                                    { icon: MessageSquare, label: 'Message' },
                                    { icon: BarChart3, label: 'Sales' },
                                  ].map((action, i) => (
                                    <button key={i} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-xl transition-colors group text-left">
                                      <action.icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#2d5496]" />
                                      <span className="text-[10px] font-black text-gray-600 group-hover:text-[#2d5496]">{action.label}</span>
                                    </button>
                                  ))}
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-50/10 border-t border-gray-50 flex flex-wrap items-center justify-between gap-4">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Showing {events.length} of {stats.totalEvents} Events</p>
               <div className="flex items-center gap-2">
                  <button className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase text-gray-400 cursor-not-allowed">Prev</button>
                  <button className="w-8 h-8 rounded-xl bg-[#2d5496] text-white text-[9px] font-black shadow-lg">1</button>
                  <button className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase text-gray-600 hover:border-brand-primary transition-colors">Next</button>
               </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-72 space-y-6 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xs font-black text-gray-800 leading-tight tracking-tight uppercase">Upcoming Events<br/><span className="text-[#02b290]">by Ticket Sales</span></h3>
               <BarChart3 className="w-4 h-4 text-gray-300" />
            </div>
            
            <div className="space-y-4">
               {[
                 { title: 'Accra Food & Drink Festival', category: 'Festival', trend: '+1,200', date: '24 Mar' },
                 { title: 'Ghana Tech Summit', category: 'Tech', trend: '-620', trendVal: 'GHS 500', isDown: true },
                 { title: 'AfroBeats Night Party', category: 'Music', trend: '+620', trendVal: 'GHS 500' },
                 { title: 'A-Z Concept Product Design', category: 'Design', trend: '+620', trendVal: 'GHS 500' },
               ].map((item, idx) => (
                 <div key={idx} className="bg-gray-50/50 border border-gray-50/50 p-4 rounded-xl flex items-center gap-3 group cursor-pointer hover:bg-white hover:shadow-xl hover:border-gray-100 transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg bg-white flex-shrink-0 border border-gray-100 shadow-sm group-hover:scale-110 transition-transform"></div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[11px] font-black text-gray-800 leading-tight truncate">{item.title}</p>
                       <p className="text-[8px] font-bold text-gray-400 uppercase mt-1.5">{item.category}</p>
                    </div>
                    <div className="text-right">
                       <div className={`flex items-center gap-0.5 text-[10px] font-black ${item.isDown ? 'text-red-500' : 'text-[#02b290]'}`}>
                          {item.isDown ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {item.trend}
                       </div>
                       <p className="text-[8px] font-black text-gray-300 mt-1">{item.date || item.trendVal}</p>
                    </div>
                 </div>
               ))}
            </div>
            
            <button className="w-full mt-6 py-3 text-[9px] font-black text-[#2d5496] uppercase hover:bg-gray-50 rounded-2xl transition-all border border-gray-50">View All</button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-xs font-black text-gray-800 mb-6 uppercase tracking-widest text-center">Reported Events</h3>
            
            <div className="bg-red-50/30 rounded-xl p-5 flex items-center gap-4 hover:bg-white hover:shadow-lg transition-all border border-red-50 cursor-pointer group">
               <div className="w-10 h-10 rounded-2xl bg-white border border-red-100 flex-shrink-0"></div>
               <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-gray-800 leading-tight truncate">Fashion Report</p>
                  <p className="text-[9px] font-bold text-red-500 uppercase mt-1">Pending Review</p>
               </div>
               <button className="px-3 py-1.5 bg-[#2d5496] text-white rounded-xl text-[9px] font-black uppercase">Review</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
