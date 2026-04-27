import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, ShieldAlert, Star, MapPin,
  Clock, Flag, MoreVertical, RefreshCcw, User, Eye, Heart, Users
} from 'lucide-react';
import adminService from '../services/adminService';

const AccommodationDetails = () => {
  const { adsId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchDetails();
  }, [adsId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const details = await adminService.getAccommodationDetails(adsId);
      if (details) {
        setData(details);
      } else {
        setError('Failed to fetch details');
      }
    } catch (err) {
      setError('An error occurred while fetching details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <RefreshCcw className="w-10 h-10 text-[#2d5496] animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Loading details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <ShieldAlert className="w-10 h-10 text-rose-500 mb-4" />
        <p className="text-gray-500 font-bold">{error || 'Ad not found'}</p>
        <button onClick={() => navigate('/accommodations')} className="mt-4 px-4 py-2 bg-[#2d5496] text-white rounded-2xl text-xs font-black uppercase">Go Back</button>
      </div>
    );
  }

  const { ad, reports, reviews } = data;
  const user = ad.userId || {};

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate('/accommodations')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
          Ad Details
        </h1>
      </div>

      {/* Header / User Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-black text-gray-900">{user.name || 'Unknown User'}</h2>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {ad.region || 'Unknown Location'}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
            <span className="text-xs font-bold text-gray-500">Joined on: {user.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg flex items-center gap-1 ${ad.isDeleted ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> {ad.isDeleted ? 'Inactive' : 'Active'}
            </span>
            {user.isVerifiedPM && (
              <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified PM
              </span>
            )}
            {ad.isBoosted && (
              <span className="px-3 py-1 bg-amber-100 text-amber-600 text-[10px] font-black uppercase rounded-lg flex items-center gap-1">
                Boosted
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 flex-1">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button className="px-6 py-2.5 bg-[#2d5496] text-white text-xs font-black rounded-lg uppercase hover:bg-[#1d3a6d] transition-colors shadow-sm">
              Approve Listing
            </button>
            <button className="px-6 py-2.5 bg-rose-500 text-white text-xs font-black rounded-lg uppercase hover:bg-rose-600 transition-colors shadow-sm">
              Reject Listing
            </button>
            <button className="px-6 py-2.5 bg-amber-500 text-white text-xs font-black rounded-lg uppercase hover:bg-amber-600 transition-colors shadow-sm">
              Pause Listing
            </button>
            <button className="px-6 py-2.5 bg-teal-500 text-white text-xs font-black rounded-lg uppercase hover:bg-teal-600 transition-colors shadow-sm">
              Remove Listing
            </button>
          </div>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 text-[10px] font-black rounded-lg uppercase hover:bg-gray-200 transition-colors flex items-center gap-2">
            <Flag className="w-3.5 h-3.5" /> Flag User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-2xl font-black text-gray-900 mb-6">{ad.title}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {ad.itemImages && ad.itemImages.length > 0 ? (
                    <img src={ad.itemImages[activeImage]} alt="Main Ad" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Available</div>
                  )}
                </div>
                {ad.itemImages && ad.itemImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {ad.itemImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border-2 transition-all ${activeImage === idx ? 'border-[#2d5496] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Map Placeholder */}
              <div className="aspect-[4/3] rounded-lg bg-gray-100 border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 bg-[url('https://maps.gstatic.com/mapfiles/maps_lite/landscape/2.png')] bg-cover bg-center"></div>
                <div className="z-10 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-gray-800 text-sm">{ad.region || 'Location'}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <p className="text-sm font-bold text-gray-500"><span className="text-gray-400">Ad type:</span> <span className="text-gray-800 uppercase tracking-wide">Accommodation</span></p>
                <p className="text-sm font-bold text-gray-500"><span className="text-gray-400">Posted on:</span> <span className="text-gray-800">{formatDate(ad.createdAt)}</span></p>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                  <span className="text-gray-400">Listing status:</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-lg ${ad.isDeleted ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {ad.isDeleted ? 'Inactive' : 'Active'}
                  </span>
                </div>
              </div>

              <div className="w-px bg-gray-100 hidden md:block"></div>

              <div className="flex-1 space-y-4">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-2">Ad Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ad Price</span>
                    <span className="text-lg font-black text-[#2d5496]">GHS {ad.price} <span className="text-xs text-gray-500">/mo</span></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Views</span>
                    <span className="text-lg font-black text-gray-800 flex items-center gap-1.5"><Eye className="w-4 h-4 text-gray-400" /> {ad.totalViews || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Favorites</span>
                    <span className="text-lg font-black text-gray-800 flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-400" /> {ad.favouriteCount || 0} times</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clients (Bookings)</span>
                    <span className="text-lg font-black text-gray-800 flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-400" /> {ad.totalBookings || 0}</span>
                  </div>
                </div>
                {ad.isBoosted && (
                  <p className="text-xs font-bold text-amber-600 bg-amber-50 p-2 rounded-lg inline-block">Boosted Till: {formatDate(ad.boostExpiry)}</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">Description</h3>
              <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
                {ad.description || 'No description provided.'}
              </p>
            </div>
          </div>


        </div>

        {/* Sidebar - Column 4 */}
        <div className="md:col-span-12 lg:col-span-4">
          <div className="flex flex-col gap-8 h-full">
          {/* Seller Snapshot */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-6">Seller Snapshot</h3>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Seller" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#2d5496] text-white text-xl font-bold">
                    {(user.name || 'S')[0]}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-800">{user.name}</h4>
                <p className="text-[10px] font-bold text-gray-400">#{user._id?.substring(0, 8)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Active Status</span>
                <span className="text-xs font-black text-gray-800">{user.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Total Listings</span>
                <span className="text-xs font-black text-gray-800">{user.totalAdsPosted || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs font-bold text-gray-500">Total Reports</span>
                <span className={`text-xs font-black ${user.totalReports > 0 ? 'text-rose-500' : 'text-gray-800'}`}>
                  {user.totalReports || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Reviews Section - Moved to Sidebar and made scrollable */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col flex-1 min-h-[300px]">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-6 flex items-center gap-2">
              Reviews <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">{reviews.length}</span>
            </h3>

            {reviews.length === 0 ? (
              <div className="text-center py-10">
                <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
                {reviews.map(review => (
                  <div key={review._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border border-white">
                        {review.userId?.profileImage ? (
                          <img src={review.userId.profileImage} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#2d5496] text-white text-[10px] font-bold">
                            {(review.userId?.name || 'U')[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-[11px] font-black text-gray-800 truncate">{review.userId?.name || 'Unknown User'}</h4>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-2.5 h-2.5 ${s <= (review.ratings || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="text-[9px] text-gray-400 font-bold ml-1">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-600 font-medium leading-relaxed italic">
                      "{review.review || 'No written review.'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditional Rendering: Reported Issues */}
          {reports && reports.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-rose-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>

              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-6 relative z-10">Reported Issues</h3>

              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span className="text-sm font-black text-rose-600">{reports.length} Total Reports</span>
              </div>

              <div className="bg-rose-50/50 rounded-lg border border-rose-100 p-4 mb-4 space-y-3">
                {reports.slice(0, 5).map(report => (
                  <div key={report._id} className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-600 truncate mr-2">{report.reason}</span>
                    <span className="text-[10px] font-black text-rose-500 bg-white px-2 py-0.5 rounded-lg shadow-sm border border-rose-50">
                      Reported
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">Mark as</span>
                  <span className="text-xs font-black text-gray-800">
                    {formatDate(reports[0]?.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">Risk Level</span>
                  <span className="px-2 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg uppercase">High Risk</span>
                </div>
              </div>
            </div>
          )}

          {/* Enforcement History (Only show if there are reports, as requested) */}
          {reports && reports.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Enforcement History</h3>
                <button className="text-[10px] font-black uppercase text-[#2d5496] hover:underline">View All</button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1"><Flag className="w-4 h-4 text-amber-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-800">Flagged for Review</p>
                    <p className="text-[10px] font-bold text-gray-400">{formatDate(reports[0]?.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default AccommodationDetails;
