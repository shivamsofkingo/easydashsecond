import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  ChevronDown, 
  RefreshCcw,
  ChevronRight,
  MoreVertical,
  Filter,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import kycService from '../services/kycService';

const ProfileVerification = () => {
  const navigate = useNavigate();
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await kycService.getKycByStatus(activeTab);
      if (data.status === 1) {
        setKycRequests(data.payload.kycRequests || []);
      }
    } catch (error) {
      console.error('Error fetching KYC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this verification?')) return;
    try {
      await kycService.approveKyc(id);
      fetchData();
    } catch (error) {
      alert('Error approving verification');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this verification?')) return;
    try {
      await kycService.rejectKyc(id);
      fetchData();
    } catch (error) {
      alert('Error rejecting verification');
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/kyc/${id}`);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      {/* Page Title */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
          Profile Verification
        </h1>
      </div>

      {/* Top Toolbar Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h1 className="text-xl font-black text-gray-800 tracking-tight">
          {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Verifications
        </h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2d5496] transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or email" 
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5496]/20 focus:border-[#2d5496] transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter Toolbar */}
        <div className="px-8 py-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            {['PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase transition-all
                  ${activeTab === tab 
                    ? 'bg-[#2d5496] text-white shadow-lg shadow-[#2d5496]/20' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-800 transition-colors">
              Total: {kycRequests.length}
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <div className="px-8 py-4 min-w-[1000px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#2d5496] text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
              <span className="col-span-1">S. No</span>
              <span className="col-span-2">Name</span>
              <span className="col-span-3">Email</span>
              <span className="col-span-1 text-center">Type</span>
              <span className="col-span-2 text-center">Place</span>
              <span className="col-span-1 text-center">Status</span>
              <span className="col-span-2 text-center">Action</span>
            </div>

            {/* Table Rows */}
            <div className="flex flex-col mt-2">
              {loading ? (
                <div className="py-20 text-center">
                  <RefreshCcw className="w-8 h-8 text-[#2d5496] animate-spin mx-auto mb-4" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading...</p>
                </div>
              ) : kycRequests.length === 0 ? (
                <div className="py-20 text-center text-gray-400 font-bold">
                  No {activeTab.toLowerCase()} verification requests found.
                </div>
              ) : (
                kycRequests
                  .filter(req => 
                    req.userId?.name?.toLowerCase().includes(search.toLowerCase()) || 
                    req.userId?.email?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((req, index) => (
                    <div key={req._id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <span className="col-span-1 text-xs font-bold text-gray-600">{index + 1}</span>
                      <span className="col-span-2 text-xs font-bold text-gray-800">{req.userId?.name || 'N/A'}</span>
                      <span className="col-span-3 text-xs font-bold text-gray-600 truncate">{req.userId?.email || 'N/A'}</span>
                      <span className="col-span-1 text-center text-xs font-bold text-gray-500">{req.userId?.profileType || 'N/A'}</span>
                      <span className="col-span-2 text-center text-xs font-bold text-gray-500">{req.userId?.place || 'N/A'}</span>
                      <div className="col-span-1 flex justify-center">
                        <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase
                          ${req.status === 'PENDING' ? 'bg-amber-50 text-amber-400' : 
                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                            'bg-rose-100 text-rose-600'}`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-center gap-2">
                        <button 
                          onClick={() => handleViewDetails(req._id)}
                          className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          title="View Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Pagination Placeholder */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
            Showing {kycRequests.length} Requests
          </p>
          <div className="flex items-center gap-2">
             <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase text-gray-400 cursor-not-allowed">Prev</button>
             <button className="w-8 h-8 rounded-lg text-[11px] font-black bg-[#2d5496] text-white shadow-lg">1</button>
             <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase text-gray-500 hover:border-[#2d5496]">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileVerification;
