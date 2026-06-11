import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import YouTubePlayer from '../components/YouTubePlayer';
import VoiceChat from '../components/VoiceChat';
import KaraokeLyrics from '../components/KaraokeLyrics';
import RoomChat from '../components/RoomChat';
import SongQueue from '../components/SongQueue';
import AdminControls from '../components/AdminControls';
import { Share2, Shield, Users, ArrowLeft, Copy, Check } from 'lucide-react';

export default function RoomPage() {
  const { code } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    room, 
    members, 
    leaveRoom,
  } = useRoom();

  const [copied, setCopied] = useState(false);
  const isHost = room?.host?.toString() === user?.id?.toString();

  // Connect socket and register to room
  useEffect(() => {
    if (!socket || !code) return;

    socket.emit('join-room', { roomCode: code });

    // Listen for kick events
    socket.on('kicked-from-room', () => {
      alert('You have been kicked from the room by the host.');
      navigate('/dashboard');
    });

    return () => {
      socket.off('kicked-from-room');
      // Perform clean unloads
      leaveRoom();
    };
  }, [socket, code]);

  const handleCopyInvite = () => {
    const inviteLink = `${window.location.origin}/room/${code.toUpperCase()}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-t-2 border-brandCyan rounded-full animate-spin"></div>
        <span className="text-slate-400 text-sm">Entering synchronized room...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-8 pt-24 pb-12 max-w-7xl mx-auto flex flex-col space-y-6 relative">
      {/* Background radial meshes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/3 w-[30vw] h-[30vw] bg-brandCyan/5 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/3 w-[30vw] h-[30vw] bg-brandPink/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header Panel */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between border-white/5 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-slate-200 transition-colors border border-white/5"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>{room.name}</span>
              {isHost && (
                <span className="px-2 py-0.5 bg-brandPink/15 text-brandPink border border-brandPink/10 text-[9px] font-bold rounded-full uppercase flex items-center space-x-1">
                  <Shield className="w-2.5 h-2.5" />
                  <span>Host</span>
                </span>
              )}
            </h2>
            <div className="flex items-center text-xs text-slate-400 space-x-2 mt-1">
              <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded font-bold uppercase text-slate-300">
                {room.code}
              </span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-brandCyan" />
                <span>{members.length} members connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invite link copying */}
        <button
          onClick={handleCopyInvite}
          className="px-5 py-2.5 bg-brandCyan text-darkBg font-bold text-xs rounded-xl flex items-center space-x-2 shadow-neon-cyan hover:scale-[1.02] active:scale-95 transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-darkBg" /> : <Share2 className="w-4 h-4 text-darkBg" />}
          <span>{copied ? 'Link Copied!' : 'Share Room Invite'}</span>
        </button>
      </div>

      {/* Main Feature Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Player & Voice Status */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <YouTubePlayer />
          <VoiceChat />
          {isHost && <AdminControls />}
        </div>

        {/* Right Column: Karaoke & Playlist queues */}
        <div className="lg:col-span-1 flex flex-col md:flex-row lg:flex-col gap-6">
          <div className="flex-1 min-w-0">
            <KaraokeLyrics />
          </div>

          <div className="flex-1 min-w-0 flex flex-col space-y-6">
            <SongQueue />
            <RoomChat />
          </div>
        </div>
      </div>
    </div>
  );
}
