import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import adminService from '../services/adminService';

const PlanCard = ({ title, activeTab, onTabChange, tabs, currentPlan, onPriceUpdate, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newPrice, setNewPrice] = useState(currentPlan?.price || '');

  useEffect(() => {
    if (currentPlan) {
      setNewPrice(currentPlan.price);
    }
  }, [currentPlan]);

  const handleSave = async () => {
    const priceNum = Number(newPrice);
    if (isNaN(priceNum)) {
      alert("Please enter a valid price");
      return;
    }
    if (priceNum === currentPlan?.price) {
      setIsEditing(false);
      return;
    }
    const success = await onPriceUpdate(currentPlan._id, priceNum);
    if (success) {
      setIsEditing(false);
    } else {
      alert("Failed to update price. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-6 space-y-6 flex flex-col h-full">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        
        {/* Toggles */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 border ${
                activeTab === tab
                  ? 'bg-[#10b981] text-white border-[#10b981]'
                  : 'bg-white text-[#10b981] border-[#10b981] opacity-60 hover:opacity-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Price Section */}
      <div className="bg-[#f8f9fa] rounded-lg p-4 flex items-center justify-between group border border-gray-300 mt-auto">
        <div className="flex items-center gap-6">
          <span className="text-xl font-black text-gray-900">Price</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-gray-900">$</span>
            {isEditing ? (
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-20 bg-white border border-[#10b981] rounded-lg px-2 py-1 text-xl font-black focus:outline-none"
                autoFocus
              />
            ) : (
              <span className="text-xl font-black text-gray-900">{currentPlan?.price || '0'}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="p-1.5 bg-[#10b981] text-white rounded-lg hover:bg-[#0da673]">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setIsEditing(false); setNewPrice(currentPlan?.price); }} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-[#10b981] hover:bg-[#10b981]/5 rounded-lg transition-all"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Features Section - Only show for non-boost plans */}
      {(title === "Profile Verification plan" || title === "Accommodation Plan") && (
        <div className="bg-white rounded-lg p-6 space-y-4 border border-gray-300 mt-4 flex-1">
          <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Includes</h4>
          <ul className="space-y-3">
            {(currentPlan?.features || currentPlan?.tierFeatures || [
              title === "Accommodation Plan" && currentPlan?.tier === "Starter" && "5 Ads limit",
              title === "Accommodation Plan" && currentPlan?.tier === "Starter" && "3 Boost limit",
              title === "Accommodation Plan" && currentPlan?.tier === "Pro" && "8 Ads limit",
              title === "Accommodation Plan" && currentPlan?.tier === "Pro" && "10 Boost limit",
              title === "Accommodation Plan" && currentPlan?.tier === "Pro" && "Verification badge",
              title === "Accommodation Plan" && currentPlan?.tier === "Elite" && "Unlimited Ads",
              title === "Accommodation Plan" && currentPlan?.tier === "Elite" && "Unlimited Boosts",
              title === "Accommodation Plan" && currentPlan?.tier === "Elite" && "Featured Banner",
              title === "Profile Verification plan" && "Verified badge",
              title === "Profile Verification plan" && "Increased account protection",
              title === "Profile Verification plan" && "Enhanced Support",
              title === "Profile Verification plan" && "Upgraded Profile Links"
            ].filter(Boolean)).map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-bold text-gray-500">
                <span className="text-gray-300">.</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const SubscriptionPlans = () => {
  const [profilePlans, setProfilePlans] = useState([]);
  const [boostPlans, setBoostPlans] = useState([]);
  const [accomodationPlans, setAccomodationPlans] = useState([]);
  const [activeProfileTab, setActiveProfileTab] = useState('Monthly');
  const [activeBoostTab, setActiveBoostTab] = useState('3 Days');
  const [activeAccTab, setActiveAccTab] = useState('Starter');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pPlans, bPlans, aPlans] = await Promise.all([
        adminService.getAllPlans(),
        adminService.getBoostPlans(),
        adminService.getAccomodationPlans()
      ]);
      
      if (bPlans.length === 0) await adminService.initializeBoostPlans();
      if (aPlans.length === 0) await adminService.initializeAccomodationPlans();
      
      const [finalBPlans, finalAPlans] = await Promise.all([
        bPlans.length === 0 ? adminService.getBoostPlans() : Promise.resolve(bPlans),
        aPlans.length === 0 ? adminService.getAccomodationPlans() : Promise.resolve(aPlans)
      ]);

      setProfilePlans(pPlans);
      setBoostPlans(finalBPlans);
      setAccomodationPlans(finalAPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProfilePriceUpdate = async (id, price) => {
    const success = await adminService.updatePlan(id, price);
    if (success) fetchData();
    return success;
  };

  const handleBoostPriceUpdate = async (id, price) => {
    const success = await adminService.updateBoostPlan(id, price);
    if (success) fetchData();
    return success;
  };

  const handleAccPriceUpdate = async (id, price) => {
    const success = await adminService.updateAccomodationPlan(id, price);
    if (success) fetchData();
    return success;
  };

  const currentProfilePlan = profilePlans.find(p => p.planName === activeProfileTab);
  const currentBoostPlan = boostPlans.find(p => `${p.duration} Days` === activeBoostTab);
  const currentAccPlan = accomodationPlans.find(p => p.tier === activeAccTab);

  if (loading && profilePlans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#10b981] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 py-6 px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Subscription plans & Boost</h1>
      </div>

      {/* Top Row: Profile & Boost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlanCard 
          title="Profile Verification plan"
          tabs={['Monthly', 'Yearly']}
          activeTab={activeProfileTab}
          onTabChange={setActiveProfileTab}
          currentPlan={currentProfilePlan}
          onPriceUpdate={handleProfilePriceUpdate}
        />

        <PlanCard 
          title="Boost post plan for accommodation"
          tabs={['3 Days', '7 Days', '14 Days']}
          activeTab={activeBoostTab}
          onTabChange={setActiveBoostTab}
          currentPlan={currentBoostPlan}
          onPriceUpdate={handleBoostPriceUpdate}
        />
      </div>

      {/* Bottom Row: Accommodation (Full Width) */}
      <div className="w-full">
        <PlanCard 
          title="Accommodation Plan"
          tabs={['Starter', 'Pro', 'Elite']}
          activeTab={activeAccTab}
          onTabChange={setActiveAccTab}
          currentPlan={currentAccPlan}
          onPriceUpdate={handleAccPriceUpdate}
        />
      </div>
    </div>
  );
};

export default SubscriptionPlans;
