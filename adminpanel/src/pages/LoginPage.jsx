import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import authService from '../services/authService';
import logo from '../assets/logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await authService.login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.msg);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center pt-20 px-4">
      {/* Logo Section */}
      <div className="mb-8 animate-in fade-in zoom-in duration-700">
        <img src={logo} alt="EzyDash Logo" className="w-48 h-auto" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[480px] bg-white rounded-lg p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
        {/* Background shapes (WordPress style inspiration) */}
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-secondary/5 rounded-full blur-2xl"></div>

        <form onSubmit={handleLogin} className="relative z-10 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm py-3 px-4 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Username or Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f6f7f9] border border-gray-200 rounded-lg py-3.5 pl-11 pr-4 text-gray-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f6f7f9] border border-gray-200 rounded-lg py-3.5 pl-11 pr-12 text-gray-800 focus:outline-none focus:border-brand-primary focus:bg-white transition-all shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end px-1">
            <button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-brand-accent text-white font-bold py-3 px-10 rounded-lg shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all flex items-center justify-center min-w-[140px]">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log in'}
            </button>
          </div>
        </form>
      </div>

      {/* Footer Links */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <a href="#" className="text-sm text-gray-500 hover:text-brand-primary transition-colors font-medium">Lost your password?</a>
      </div>
    </div>
  );
};

export default LoginPage;
