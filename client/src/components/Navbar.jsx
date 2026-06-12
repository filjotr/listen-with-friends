import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Music, LogOut, User, Settings, LayoutDashboard, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getAvatarLetter = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-7xl h-16 z-50 glass-panel rounded-full flex items-center justify-between px-6 md:px-10 transition-all duration-300">
      {/* Brand logo */}
      <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 text-xl font-bold tracking-tight">
        <div className="p-2 rounded-full neumorph-btn flex items-center justify-center">
          <Music className="w-5 h-5 text-brandCyan" />
        </div>
        <span className="text-main hidden sm:inline-block font-extrabold ml-1">
          Listen With Friends
        </span>
      </Link>

      {/* Nav Menu */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2.5 neumorph-btn rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-90"
          title="Toggle Theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4.5 h-4.5 text-slate-700" />
          ) : (
            <Sun className="w-4.5 h-4.5 text-yellow-400" />
          )}
        </button>

        {user ? (
          <>
            <Link
              to="/dashboard"
              className="flex items-center space-x-1 text-sm text-main hover:text-brandCyan transition-colors font-medium px-3 py-1.5 rounded-full"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center space-x-2 text-sm text-main hover:text-brandCyan transition-colors font-medium px-3 py-1.5 rounded-full"
            >
              <div className="w-6 h-6 rounded-full bg-brandCyan/20 text-brandCyan flex items-center justify-center font-bold text-xs border border-brandCyan/30 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  getAvatarLetter(user.username)
                )}
              </div>
              <span className="hidden sm:inline text-main">{user.username}</span>
            </Link>

            <Link
              to="/settings"
              className="p-2 text-main hover:text-brandCyan transition-colors rounded-full"
              title="Settings"
            >
              <Settings className="w-4.5 h-4.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-main hover:text-red-500 transition-colors rounded-full cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm text-main hover:text-brandCyan transition-colors font-semibold px-4 py-2"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm text-main neumorph-btn font-bold px-5 py-2.5 rounded-full hover:scale-105 transition-all duration-200"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
