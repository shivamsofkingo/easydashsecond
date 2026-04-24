import React from 'react';
import { ChevronDown, Calendar, User as UserIcon } from 'lucide-react';
import authService from '../services/authService';

const Topbar = () => {
  const user = authService.getUser();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Left Side: Selectors */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <span className="text-lg">🇬🇭</span>
          <span className="text-sm font-semibold text-gray-700">Ghana</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">01 Mar 2024 - 31 Mar 2024</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Right Side: User Profile */}
      <div className="flex items-center gap-3 cursor-pointer group">
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
           <img 
             src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=random`} 
             alt="User Avatar" 
             className="w-full h-full object-cover"
           />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-gray-800">{user?.name || 'Khandaker Rasel'}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
};

export default Topbar;

