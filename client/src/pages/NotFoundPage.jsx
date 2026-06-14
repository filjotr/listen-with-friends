import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldAlert, Disc } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden bg-[var(--base-bg)] text-main">
      <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-3xl text-center z-10 flex flex-col items-center space-y-6">
        
        {/* Animated vinyl / disc icon */}
        <div className="relative">
          <div className="p-4 neumorph-btn text-brandPink rounded-full animate-bounce">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="absolute -top-2 -right-2 p-1 neumorph-btn rounded-full bg-[var(--base-bg)]">
            <Disc className="w-5 h-5 text-brandCyan animate-spin-slow" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-6xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-brandPink to-brandCyan">
            404
          </h2>
          <h3 className="text-xl font-bold text-main">Track Not Found</h3>
          <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">
            The page or room you are looking for has expired, changed names, or is offline.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="w-full flex items-center justify-center space-x-2 py-3.5 neumorph-btn text-main font-bold rounded-xl active:scale-95 transition-all duration-200 text-sm cursor-pointer"
        >
          <Home className="w-4 h-4 text-brandCyan" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
