import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldAlert, Disc } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Decorative gradient elements */}
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-brandCyan/10 rounded-full blur-[90px] -z-10 animate-spin-slow"></div>
      
      <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-3xl text-center shadow-glass-glow z-10 flex flex-col items-center space-y-6">
        
        {/* Animated vinyl / disc icon */}
        <div className="relative">
          <div className="p-4 bg-brandPink/15 text-brandPink rounded-full animate-bounce">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <Disc className="absolute -top-2 -right-2 w-6 h-6 text-brandCyan animate-spin-slow" />
        </div>

        <div>
          <h2 className="text-6xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-brandPink to-brandCyan">
            404
          </h2>
          <h3 className="text-xl font-bold text-slate-200 mt-2">Track Not Found</h3>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            The page or room you are looking for has expired, changed names, or is offline.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-brandCyan to-brandPink text-darkBg font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 text-sm"
        >
          <Home className="w-4 h-4 text-darkBg" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
