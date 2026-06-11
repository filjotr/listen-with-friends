import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Music, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getAvatarLetter = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-7xl h-16 z-50 glass-panel rounded-full flex items-center justify-between px-6 md:px-10 shadow-lg transition-all duration-300">
      {/* Brand logo */}
      <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 text-xl font-bold tracking-tight">
        <div className="p-2 rounded-full bg-gradient-to-tr from-brandPink to-brandCyan shadow-neon-cyan">
          <Music className="w-5 h-5 text-darkBg" />
        </div>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 hidden sm:inline-block font-extrabold">
          Listen With Friends
        </span>
      </Link>

      {/* Nav Menu */}
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <Link
              to="/dashboard"
              className="flex items-center space-x-1 text-sm text-slate-300 hover:text-brandCyan transition-colors font-medium px-3 py-1.5 rounded-full hover:bg-white/5"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center space-x-2 text-sm text-slate-300 hover:text-brandCyan transition-colors font-medium px-3 py-1.5 rounded-full hover:bg-white/5"
            >
              <div className="w-6 h-6 rounded-full bg-brandCyan/20 text-brandCyan flex items-center justify-center font-bold text-xs border border-brandCyan/30 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  getAvatarLetter(user.username)
                )}
              </div>
              <span className="hidden sm:inline">{user.username}</span>
            </Link>

            <Link
              to="/settings"
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors hover:bg-white/5 rounded-full"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors hover:bg-red-500/10 rounded-full"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm text-slate-300 hover:text-slate-100 transition-colors font-semibold px-4 py-2"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm text-darkBg bg-gradient-to-r from-brandCyan to-brandPink font-bold px-5 py-2.5 rounded-full shadow-neon-pink hover:scale-105 transition-transform duration-200"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
