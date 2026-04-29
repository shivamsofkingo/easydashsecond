import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Accommodations from './pages/Accommodations';
import AccommodationDetails from './pages/AccommodationDetails';
import Events from './pages/Events';
import LoginPage from './pages/LoginPage';
import authService from './services/authService';

import RevenueFinance from './pages/RevenueFinance';
import Marketplace from './pages/Marketplace';
import ProfileVerification from './pages/ProfileVerification';
import KycDetails from './pages/KycDetails';
import SubscriptionPlans from './pages/SubscriptionPlans';
import UserActivity from './pages/UserActivity';
import ReportsLogs from './pages/ReportsLogs';
// Protected Route Component
const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Placeholder pages for routes
const Placeholder = ({ title }) => (
  <div className="glass p-10 rounded-lg flex flex-col items-center justify-center min-h-[400px]">
    <h2 className="text-2xl font-bold text-white mb-2">{title} Page</h2>
    <p className="text-gray-400">This module is currently under development.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="enforcement" element={<UserActivity />} />
          <Route path="revenue" element={<RevenueFinance />} />
          <Route path="accommodations">
            <Route index element={<Accommodations />} />
            <Route path="details/:adsId" element={<AccommodationDetails />} />
          </Route>
          <Route path="events" element={<Events />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="subscription-plans" element={<SubscriptionPlans />} />
          <Route path="kyc" element={<ProfileVerification />} />
          <Route path="kyc/:id" element={<KycDetails />} />
          <Route path="logs" element={<ReportsLogs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
