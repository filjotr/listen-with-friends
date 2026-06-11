import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, Music } from 'lucide-react';

export default function LoginPage() {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(emailOrUsername, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center px-4 relative pt-16">
      <div className="absolute top-1/3 left-1/3 w-[250px] h-[250px] bg-brandCyan/5 rounded-full blur-[70px] -z-10"></div>
      
      <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-3xl shadow-glass-glow z-10 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-full bg-brandCyan/10 text-brandCyan mb-4">
            <Music className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-100">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-2">Connect and listen together</p>
        </div>

        {/* Error notification */}
        {(error || authError) && (
          <div className="flex items-center space-x-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Username or Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="you@example.com"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-brandCyan to-brandPink text-darkBg font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <LogIn className="w-4 h-4 text-darkBg" />
            <span>{loading ? 'Logging In...' : 'Log In'}</span>
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-brandCyan font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
