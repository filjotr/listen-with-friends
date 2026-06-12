import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/config';
import { User, Award, ShieldAlert, Check, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, token, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [userStats, setUserStats] = useState({ roomsCreated: 0, roomsJoined: 0, timeListened: 0 });
  const [activities, setActivities] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Cool preset avatar gradients/emojis
  const presetAvatars = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=Lucky',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Snuggles',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Spooky',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Patches',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Boots',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Missy'
  ];

  useEffect(() => {
    if (!token) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setUserStats(data.stats);
          setActivities(data.activities);
        }
      } catch (err) {
        console.error('Stats load error:', err);
      }
    };
    fetchStats();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await updateProfile(username, selectedAvatar);
      setMessage('Profile settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatActivityDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen px-4 md:px-12 pt-24 pb-12 max-w-5xl mx-auto flex flex-col space-y-8 relative bg-[var(--base-bg)] text-main">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2.5 neumorph-btn rounded-xl text-muted hover:text-brandCyan transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-main">User Profile</h2>
          <p className="text-muted text-sm mt-1">Manage credentials and analyze statistics</p>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div className="flex items-center space-x-2 text-sm text-green-500 bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
          <Check className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Editor */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl h-fit flex flex-col space-y-6">
          <h3 className="text-lg font-bold text-main">Edit Profile</h3>

          {/* Current Avatar display */}
          <div className="flex flex-col items-center py-4 space-y-3">
            <div className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl neumorph-btn overflow-hidden p-1">
              {selectedAvatar ? (
                <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                username ? username.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <span className="text-xs text-muted">Selected Avatar Preview</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-muted font-semibold uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-4 py-2.5 rounded-xl glass-input text-sm text-main"
              />
            </div>

            {/* Avatar selector presets */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs text-muted font-semibold uppercase tracking-wider">Choose Avatar Preset</label>
              <div className="grid grid-cols-3 gap-2">
                {presetAvatars.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`w-full aspect-square rounded-xl overflow-hidden transition-all p-1.5 cursor-pointer ${
                      selectedAvatar === url ? 'glass-input border-2 border-brandCyan scale-105' : 'glass-panel opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="Preset Avatar" className="w-full h-full object-contain rounded-lg" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 neumorph-btn text-main font-bold rounded-xl active:scale-95 transition-all duration-200 text-sm cursor-pointer"
            >
              {loading ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Right Column: Stats & Activities */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {/* Detailed stats grids */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl">
              <Award className="w-5 h-5 text-brandCyan mb-1.5" />
              <p className="text-xs text-muted font-medium uppercase tracking-wider">Rooms Hosted</p>
              <h4 className="text-xl font-bold text-main mt-1">{userStats.roomsCreated}</h4>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <Award className="w-5 h-5 text-brandPink mb-1.5" />
              <p className="text-xs text-muted font-medium uppercase tracking-wider">Rooms Visited</p>
              <h4 className="text-xl font-bold text-main mt-1">{userStats.roomsJoined}</h4>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <Award className="w-5 h-5 text-purple-400 mb-1.5" />
              <p className="text-xs text-muted font-medium uppercase tracking-wider">Listening Activity</p>
              <h4 className="text-xl font-bold text-main mt-1">{userStats.timeListened} min</h4>
            </div>
          </div>

          {/* Activity Log */}
          <div className="glass-panel p-6 rounded-3xl flex-1">
            <h3 className="text-lg font-bold text-main mb-4">Recent Activities</h3>
            {activities.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-muted text-sm">
                No activity logs found for your account
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div 
                    key={act._id} 
                    className="p-3.5 glass-panel rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1.5 rounded-lg text-xs font-bold neumorph-btn ${
                        act.action === 'create' ? 'text-brandCyan' : 'text-brandPink'
                      }`}>
                        {act.action.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-main">
                          {act.action === 'create' ? 'Created Room' : 'Joined Room'} "{act.roomName}"
                        </h4>
                        <span className="text-[10px] text-muted flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-brandCyan" />
                          <span>{formatActivityDate(act.timestamp)}</span>
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 neumorph-btn text-[10px] font-bold text-muted rounded-md uppercase">
                      {act.roomCode}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
