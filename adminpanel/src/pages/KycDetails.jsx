import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Calendar,
  ShieldCheck,
  Clock,
  ExternalLink,
  FileText
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import kycService from '../services/kycService';
import { motion } from 'framer-motion';

const KycDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const response = await kycService.getKycById(id);
      if (response.status === 1) {
        setData(response.payload);
      }
    } catch (error) {
      console.error('Error fetching KYC details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this user?')) return;
    try {
      await kycService.approveKyc(id);
      fetchDetails();
    } catch (error) {
      alert('Error approving verification');
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this user?')) return;
    try {
      await kycService.rejectKyc(id);
      fetchDetails();
    } catch (error) {
      alert('Error rejecting verification');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-[#2d5496] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-black text-gray-400 uppercase tracking-widest text-xs">Loading Details...</p>
    </div>
  );

  if (!data) return <div className="p-10 text-center font-bold text-gray-500">KYC Request not found.</div>;

  const { kycRequest, profileDetails } = data;
  const user = kycRequest.userId;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">User Details</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reviewing application for {kycRequest.fullName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Profile & Info */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Image & Status */}
                <div className="relative flex-shrink-0">
                  <div className="w-64 h-64 rounded-lg overflow-hidden border border-gray-300 shadow-inner">
                    <img 
                      src={user?.profileImage !== "NA" ? user.profileImage : "https://via.placeholder.com/300"} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`absolute top-4 left-4 px-4 py-2 bg-white/90 backdrop-blur rounded-lg shadow-lg border border-gray-100 flex items-center gap-2
                    ${kycRequest.status === 'PENDING' ? 'text-amber-400' : 
                      kycRequest.status === 'APPROVED' ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {kycRequest.status === 'PENDING' ? <Clock className="w-4 h-4 text-amber-400" /> : 
                     kycRequest.status === 'APPROVED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {kycRequest.status === 'PENDING' ? 'Approval Pending' : kycRequest.status}
                    </span>
                  </div>
                </div>

                {/* Info Fields Stack */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">User Name</label>
                    <div className="px-6 py-4 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-800 truncate text-sm">
                      {user?.name || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Email</label>
                    <div className="px-6 py-4 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-800 break-all text-sm leading-tight min-h-[58px] flex items-center">
                      {user?.email || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">DOB</label>
                    <div className="px-6 py-4 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-800 text-sm">
                      {profileDetails?.dateOfBirth ? new Date(profileDetails.dateOfBirth).toLocaleDateString() : '6-08-1999'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Type</label>
                      <div className="px-6 py-4 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-800 text-sm flex items-center min-h-[58px]">
                        {user?.profileType === 'Non Student' ? 'Non-Student' : user?.profileType || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1 text-[10px] truncate">Non-Student Type</label>
                      <div className="px-6 py-4 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-800 text-sm leading-tight flex items-center min-h-[58px]">
                        {profileDetails?.nonStudentProfileType || 'Event Manager'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Phone No.</label>
                    <div className="px-6 py-4 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-800 flex items-center gap-3 text-sm">
                      <img src="https://flagcdn.com/w20/in.png" className="w-5 h-auto rounded-lg" alt="India" />
                      {user?.phoneNumber || '+91 9019287771'}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Location</label>
                    <div className="px-6 py-4 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-800 text-sm">
                      {user?.place ? `${user.place}, ${user.address || 'XYZ'}` : 'India, XYZ'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="mt-10 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Description</label>
                <div className="w-full h-40 px-6 py-6 bg-gray-50 border border-gray-300 rounded-lg font-bold font-medium">
                  {profileDetails?.businessDescription || "No description provided."}
                </div>
              </div>
            </div>
          </div>

          {/* Identity Proof Section */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 space-y-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Identity Proof</h2>
              <p className="text-xl font-bold text-gray-600">Document Type - <span className="text-[#2d5496]">{kycRequest.nationalIdType || 'Citizenship card'}</span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <p className="text-sm font-black text-gray-400 uppercase ml-2 tracking-widest">Front</p>
                <div className="aspect-[1.6/1] rounded-lg overflow-hidden border border-gray-300 shadow-xl group relative">
                  <img src={kycRequest.frontImage} alt="ID Front" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <a href={kycRequest.frontImage} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="text-white w-8 h-8" />
                  </a>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-black text-gray-400 uppercase ml-2 tracking-widest">Back</p>
                <div className="aspect-[1.6/1] rounded-lg overflow-hidden border border-gray-300 shadow-xl group relative">
                  <img src={kycRequest.backImage} alt="ID Back" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <a href={kycRequest.backImage} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="text-white w-8 h-8" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Verify Actions */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 sticky top-10 space-y-10">
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Verify User Profile</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Review the submitted details carefully before granting verification. Please ensure that all submitted documents and profile details are authentic and match the user's identity. Verification grants a public badge and increase user credibility.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleReject}
                disabled={kycRequest.status !== 'PENDING'}
                className={`py-4 rounded-lg font-black uppercase text-sm transition-all
                  ${kycRequest.status === 'PENDING' 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                Reject
              </button>
              <button 
                onClick={handleApprove}
                disabled={kycRequest.status !== 'PENDING'}
                className={`py-4 rounded-lg font-black uppercase text-sm transition-all
                  ${kycRequest.status === 'PENDING' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                Approve
              </button>
            </div>

            {kycRequest.reviewedBy && (
              <div className="pt-8 border-t border-gray-50 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" /> Reviewed By Admin
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2d5496]/10 flex items-center justify-center text-[#2d5496]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800">{kycRequest.reviewedBy?.name}</p>
                    <p className="text-[10px] font-bold text-gray-400">{new Date(kycRequest.reviewedAt).toLocaleString()}</p>
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

export default KycDetails;
