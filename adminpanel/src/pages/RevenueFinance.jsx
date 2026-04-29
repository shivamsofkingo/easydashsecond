import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Globe, 
  FileText, 
  Download,
  Info
} from 'lucide-react';
import bannerBg from '../assets/banner_bg.png';


const RevenueCard = ({ title, items, color, totalLabel, totalValue }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex-1">
    <div className={`${color} px-5 py-4 text-white font-black text-sm uppercase tracking-wide`}>
      {title}
    </div>
    <div className="flex flex-col">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="flex justify-between items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-50/50 transition-colors"
        >
          <span className="text-gray-500 text-[13px] font-bold">{item.label}</span>
          <span className="text-[#1e293b] font-black text-[13px]">{item.value}</span>
        </div>
      ))}
      <div className="flex justify-between items-center px-6 py-5 bg-[#e2e8f0]">
        <span className="text-[#1e293b] font-black text-[13px]">{totalLabel}</span>
        <span className="text-[#1e293b] font-black text-[13px]">{totalValue}</span>
      </div>
    </div>
  </div>
);
const StatCard = ({ title, value, change, trend }) => (
  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-1 hover:shadow-md transition-all duration-300">
    <span className="text-gray-500 text-[12px] font-bold uppercase tracking-wider">{title}</span>
    <h3 className="text-2xl font-black text-[#0d2137]">{value}</h3>
    <div className={`flex items-center gap-1 text-[13px] font-black ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
      {trend === 'up' ? <ArrowUpRight className="w-4 h-4 stroke-[3]" /> : <ArrowDownRight className="w-4 h-4 stroke-[3]" />}
      <span>{change}</span>
    </div>
  </div>
);

const RevenueFinance = () => {
  const marketplaceItems = [
    { label: "Total Marketplace Revenue", value: "$232,000" },
    { label: "Marketplace Ad Boosts Revenue", value: "$84,500" },
    { label: "Marketplace User Subscribers Revenue", value: "$56,600" },
    { label: "Fixed Platform Revenue", value: "$32,000" },
    { label: "Marketplace Verified Badge Revenue", value: "$18,900" },
  ];

  const eventItems = [
    { label: "Total Events Revenue", value: "$232,000" },
    { label: "Fixed Platform Revenue", value: "$84,500" },
    { label: "Event Verified Badge Revenue", value: "$56,600" },
    { label: "Event Ad Boosts Revenue", value: "$32,000" },
    { label: "Events User Subscribers Revenue", value: "$18,900" },
  ];

  const accommodationItems = [
    { label: "Total Accommodation Revenue", value: "$232,000" },
    { label: "Accommodation Ad Boosts Revenue", value: "$84,500" },
    { label: "Accommodation Ad Boosts Revenue", value: "$56,600" },
    { label: "Fixed Platform Revenue", value: "$32,000" },
    { label: "Accommodation Verified Badge Revenue", value: "$18,900" },
  ];

  const expenditureData = [
    { label: "Vat % Charges", values: ["$468,000", "$182,000", "$124,000", "$798,000"], trends: ["+19.3%", "-13.3%", "+9.3%", "+16.1%"], up: [true, false, true, true] },
    { label: "Gateway Free % Charges", values: ["$185,600", "$179,500", "$52,000", "$159,000"], trends: ["-29.6%", "+7.5%", "+16.8%", "-14.3%"], up: [false, true, true, false] },
    { label: "Smile ID Verification Cost", values: ["$95,000", "$86,000", "$25,000", "$79,000"], trends: ["-16.8%", "+16.2%", "-19.4%", "+8.9%"], up: [false, true, false, true] },
    { label: "Sellers Payouts", values: ["$128,000", "$62,100", "$134,000", "$132,000"], trends: ["+15.2%", "-16.8%", "-22.8%", "+14.1%"], up: [true, false, false, true] },
    { label: "Organizers Payouts", values: ["$1,251,000", "$234,370", "$301,800", "$7,128,000"], trends: ["+14.8%", "+24.5%", "+17.1%", "+22.2%"], up: [true, true, true, true] },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-black text-[#0d2137] tracking-tight">Revenue & Finance</h1>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            <Globe className="w-4 h-4" />
            View More Countries
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            <FileText className="w-4 h-4" />
            Generate Reports
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Total Revenue" value="$1,351,300" change="+25.8%" trend="up" />
        <StatCard title="Total User Payouts" value="$852,850" change="-12.3%" trend="down" />
        <StatCard title="Total Tax Payout" value="$624,921" change="-33.2%" trend="down" />
        <StatCard title="Total Gateway Payout" value="$2,420,700" change="+4.8%" trend="up" />
        <StatCard title="Other API Payouts" value="$2,685,210" change="-18.3%" trend="down" />
        <StatCard title="Net Revenue" value="$961,200" change="+8.9%" trend="up" />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RevenueCard 
          title="Revenue - Marketplace" 
          items={marketplaceItems} 
          color="bg-[#10b981]" 
          totalLabel="Net Marketplace Revenue - EzyDash" 
          totalValue="$40,700" 
        />
        <RevenueCard 
          title="Revenue - Event Ticketing" 
          items={eventItems} 
          color="bg-[#f97316]" 
          totalLabel="Net Events Revenue - EzyDash" 
          totalValue="$40,700" 
        />
        <RevenueCard 
          title="Revenue - Accommodation" 
          items={accommodationItems} 
          color="bg-[#3b82f6]" 
          totalLabel="Net Accommodation Revenue - EzyDash" 
          totalValue="$40,700" 
        />
      </div>

      {/* Banner Advertisement */}
      <div className="relative h-44 w-full rounded-lg overflow-hidden group cursor-pointer shadow-lg bg-[#ffb800]">
        <img src={bannerBg} alt="Promotion" className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" style={{ objectPosition: '100% 40%' }} />
        
        {/* Abstract Background Shapes as seen in reference */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-[25%] w-[45%] h-full bg-orange-600/30 skew-x-[-25deg]"></div>
          <div className="absolute top-0 left-[45%] w-[12%] h-full bg-red-600/30 skew-x-[-25deg]"></div>
          <div className="absolute top-10 right-[35%] w-12 h-12 border-4 border-white/20 rotate-45"></div>
          <div className="absolute bottom-5 right-[30%] w-8 h-8 border-2 border-white/10 rotate-12"></div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-[#ffb800] via-[#ffb800]/20 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col gap-1 px-16 h-full justify-center">
          <span className="text-[#0d2137] font-black text-xl uppercase tracking-[0.05em]">Revenue - Banner Advertisement</span>
          <h2 className="text-5xl font-black text-[#0d2137] tracking-tight">$2,420,700</h2>
        </div>
      </div>

      {/* Bottom Section: Expenditure & Pie Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Table Section */}
        <div className="xl:col-span-8 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="text-lg font-black text-[#1e293b] mb-4">Expenditure Breakdown</h3>
            <div className="flex gap-2 p-1 bg-gray-100 w-fit rounded-lg">
              <button className="px-4 py-2 bg-[#2d5496] text-white rounded-lg text-[13px] font-bold shadow-sm">
                Expenditure Breakdown
              </button>
              <button className="px-4 py-2 text-gray-500 rounded-lg text-[13px] font-bold hover:bg-gray-200/50 transition-all">
                Reviewed/Auctioned Violations
              </button>
            </div>
          </div>
          <div className="overflow-x-auto px-6 pb-6">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#2d5496] text-white">
                  <th className="px-6 py-4 text-[13px] font-bold rounded-tl-lg">Total Payout</th>
                  <th className="px-4 py-4 text-[13px] font-bold">Event Ticketing</th>
                  <th className="px-4 py-4 text-[13px] font-bold">Marketplace</th>
                  <th className="px-4 py-4 text-[13px] font-bold">Accommodation</th>
                  <th className="px-4 py-4 text-[13px] font-bold rounded-tr-lg">Ad Banner</th>
                </tr>
              </thead>
              <tbody>
                {expenditureData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-bold text-gray-500 border-b border-gray-200">{row.label}</td>
                    {row.values.map((val, j) => (
                      <td key={j} className="px-4 py-4 border-b border-gray-200">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-black text-[#1e293b]">{val}</span>
                          <div className={`flex items-center gap-0.5 text-[10px] font-bold ${row.up[j] ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {row.up[j] ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {row.trends[j]}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie Chart Section */}
        <div className="xl:col-span-4 bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
          <h3 className="text-lg font-black text-[#1e293b]">Total Expenditure Breakdown</h3>
          <div className="flex flex-col md:flex-row items-center gap-8 xl:flex-col">
            <div className="relative w-48 h-48 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="15" strokeDasharray="128.17 123.15" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="15" strokeDasharray="80.42 170.9" strokeDashoffset="-128.17" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#facc15" strokeWidth="15" strokeDasharray="55.29 196.03" strokeDashoffset="-208.59" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#22c55e" strokeWidth="15" strokeDasharray="45.24 206.08" strokeDashoffset="-263.88" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="15" strokeDasharray="22.62 228.7" strokeDashoffset="-309.12" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-full shadow-inner border border-gray-50"></div>
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col gap-4">
              {[
                { color: "bg-[#3b82f6]", label: "Vat % Charges:", value: "$348,500", percent: "46%" },
                { color: "bg-[#ef4444]", label: "Gateway Free % Charges:", value: "$318,700", percent: "32%" },
                { color: "bg-[#facc15]", label: "Smile ID Verification Cost:", value: "$186,400", percent: "22%" },
                { color: "bg-[#22c55e]", label: "Sellers Payouts:", value: "$231,230", percent: "18%" },
                { color: "bg-[#10b981]", label: "Organizers Payouts:", value: "$74,800", percent: "9%" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-lg ${item.color} mt-1.5 flex-shrink-0`}></div>
                  <div className="flex flex-col flex-1">
                    <span className="text-[12px] font-bold text-gray-500 leading-tight">{item.label}</span>
                    <span className="text-[15px] font-black text-[#1e293b]">{item.value}</span>
                  </div>
                  <span className="text-[14px] font-black text-[#1e293b]">{item.percent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueFinance;
