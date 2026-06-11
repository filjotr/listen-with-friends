import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/config';
import { Plus, Users, Lock, Unlock, Eye, Sparkles, Clock, Globe, ArrowRight, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Local state
  const [publicRooms, setPublicRooms] = useState([]);
  const [recentRooms, setRecentRooms] = useState([]);
  const [userStats, setUserStats] = useState({ roomsCreated: 0, roomsJoined: 0, timeListened: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Room inputs
  const [roomCode, setRoomCode] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPrivate, setCreatePrivate] = useState(false);
  const [createPassword, setCreatePassword] = useState('');

  // Password Overlay Modal
  const [joiningCode, setJoiningCode] = useState(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Loading/Errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch public rooms
      const pubRes = await fetch(`${API_BASE_URL}/rooms/public`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pubData = await pubRes.json();
      if (pubRes.ok) setPublicRooms(pubData.rooms);

      // Fetch recent rooms
      const recRes = await fetch(`${API_BASE_URL}/rooms/recent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const recData = await recRes.json();
      if (recRes.ok) setRecentRooms(recData.rooms);

      // Fetch user profile metrics & activity
      const statsRes = await fetch(`${API_BASE_URL}/auth/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) {
        setUserStats(statsData.stats || { roomsCreated: 0, roomsJoined: 0, timeListened: 0 });
        setRecentActivities(statsData.activities || []);
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
      setError('Could not retrieve dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Create Room handler
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!createName.trim()) {
      setError('Please provide a name for your room');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: createName,
          isPrivate: createPrivate,
          password: createPrivate ? createPassword : ''
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create room');
      }

      // Redirect immediately to room page
      navigate(`/room/${data.room.code}`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Check and Join room logic
  const handleJoinByCode = async (e) => {
    if (e) e.preventDefault();
    if (!roomCode.trim()) return;

    setError('');
    const code = roomCode.trim().toUpperCase();

    try {
      // 1. Check validity of room code
      const checkRes = await fetch(`${API_BASE_URL}/rooms/check/${code}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        throw new Error(checkData.message || 'Room code is invalid');
      }

      if (checkData.requiresPassword) {
        // Show password input overlay
        setJoiningCode(code);
        setJoinPassword('');
        setJoinError('');
        setShowPasswordModal(true);
      } else {
        // Direct Join REST route to register user in room members db list
        const joinRes = await fetch(`${API_BASE_URL}/rooms/join/${code}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!joinRes.ok) {
          const joinData = await joinRes.json();
          throw new Error(joinData.message || 'Join failed');
        }

        // Navigate to room view
        navigate(`/room/${code}`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Submit password for private room
  const handleJoinPasswordSubmit = async (e) => {
    e.preventDefault();
    setJoinError('');

    try {
      const joinRes = await fetch(`${API_BASE_URL}/rooms/join/${joiningCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: joinPassword })
      });

      const joinData = await joinRes.json();
      if (!joinRes.ok) {
        throw new Error(joinData.message || 'Incorrect room password');
      }

      // Password matches, head in
      setShowPasswordModal(false);
      navigate(`/room/${joiningCode}`);
    } catch (err) {
      setJoinError(err.message);
    }
  };

  return (
    <div className="min-h-screen px-4 md:px-12 pt-24 pb-12 max-w-7xl mx-auto flex flex-col space-y-8 relative">
      <div className="absolute top-10 right-20 w-[200px] h-[200px] bg-brandCyan/5 rounded-full blur-[80px] -z-10"></div>
      <div className="absolute bottom-10 left-20 w-[300px] h-[300px] bg-brandPink/5 rounded-full blur-[100px] -z-10"></div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 flex items-center space-x-2">
            <span>Hello, {user?.username}</span>
            <Sparkles className="w-5 h-5 text-brandCyan" />
          </h2>
          <p className="text-slate-400 text-sm mt-1">Ready to sync music with friends?</p>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-brandCyan/15 text-brandCyan rounded-xl">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Rooms Created</p>
            <h4 className="text-2xl font-bold text-slate-100 mt-1">{userStats.roomsCreated}</h4>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-brandPink/15 text-brandPink rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Rooms Joined</p>
            <h4 className="text-2xl font-bold text-slate-100 mt-1">{userStats.roomsJoined}</h4>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-purple-500/15 text-purple-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Listening History</p>
            <h4 className="text-2xl font-bold text-slate-100 mt-1">{userStats.timeListened} mins</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Join and Create */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          {/* Join room */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Unlock className="w-4 h-4 text-brandCyan" />
              <span>Join via Code</span>
            </h3>
            <form onSubmit={handleJoinByCode} className="flex space-x-2">
              <input
                type="text"
                placeholder="Code (e.g. D3H8FA)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl glass-input text-sm font-bold uppercase tracking-wider text-center"
              />
              <button
                type="submit"
                className="px-4 bg-brandCyan text-darkBg font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform"
              >
                Join
              </button>
            </form>
          </div>

          {/* Create room */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-brandPink" />
              <span>Create New Room</span>
            </h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-slate-400 font-medium">Room Name</label>
                <input
                  type="text"
                  placeholder="Saturday Jam Session"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="px-4 py-2 rounded-xl glass-input text-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-slate-300 font-medium">Private Room?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createPrivate}
                    onChange={(e) => setCreatePrivate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brandPink"></div>
                </label>
              </div>

              {createPrivate && (
                <div className="flex flex-col space-y-1 animate-fadeIn">
                  <label className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="px-4 py-2 rounded-xl glass-input text-sm"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-brandCyan to-brandPink text-darkBg font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                Create and Launch
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Room Listings */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {/* Public active rooms */}
          <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2 mb-4">
              <Globe className="w-4 h-4 text-brandCyan" />
              <span>Public Listening Rooms</span>
            </h3>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-8 h-8 border-t-2 border-brandCyan rounded-full animate-spin"></div>
                <span className="text-sm text-slate-400">Loading active rooms...</span>
              </div>
            ) : publicRooms.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 border border-dashed border-white/5 rounded-2xl">
                <span className="text-slate-500 text-sm">No active public rooms right now</span>
                <span className="text-slate-600 text-xs mt-1">Create one to get things started!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 overflow-y-auto max-h-[360px] pr-1">
                {publicRooms.map(room => (
                  <div
                    key={room._id}
                    className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-white/5 hover:border-brandCyan/20 transition-all hover:bg-white/5"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-200 text-sm truncate max-w-[80%]">{room.name}</h4>
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 font-bold rounded-full uppercase">
                          {room.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Host: {room.host?.username || 'Unknown'}</p>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <div className="flex items-center text-xs text-slate-400 space-x-1">
                        <Users className="w-3.5 h-3.5 text-brandCyan" />
                        <span>{room.members?.length || 0} active</span>
                      </div>
                      <button
                        onClick={() => { setRoomCode(room.code); handleJoinByCode(); }}
                        className="p-2 bg-brandCyan/10 hover:bg-brandCyan text-brandCyan hover:text-darkBg rounded-xl transition-all duration-200"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Rooms joined */}
          {recentRooms.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl">
              <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2 mb-4">
                <Clock className="w-4 h-4 text-brandPink" />
                <span>Jump Back In</span>
              </h3>
              <div className="flex flex-col space-y-2">
                {recentRooms.map(room => (
                  <div
                    key={room._id}
                    onClick={() => { setRoomCode(room.code); handleJoinByCode(); }}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-between cursor-pointer border border-white/5 hover:border-brandPink/30 transition-all duration-200"
                  >
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{room.name}</h4>
                      <p className="text-xs text-slate-500">Host: {room.host?.username || 'Unknown'}</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-brandPink/15 text-brandPink rounded-lg border border-brandPink/10 uppercase">
                      {room.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Overlay Modal Dialog */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-darkBg/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl shadow-glass-glow flex flex-col">
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Lock className="w-5 h-5 text-brandPink" />
              <span>Private Room Required</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Please enter password for Room code: {joiningCode}</p>

            {joinError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl mt-4">
                {joinError}
              </p>
            )}

            <form onSubmit={handleJoinPasswordSubmit} className="mt-4 space-y-4">
              <input
                type="password"
                placeholder="Enter password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm text-center"
                autoFocus
              />

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 text-slate-300 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brandPink text-slate-100 font-bold rounded-xl text-sm shadow-neon-pink hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
