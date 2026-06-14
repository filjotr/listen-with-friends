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
  const hostId = room?.host?._id || room?.host;
  const userId = user?._id || user?.id;
  const isHost = hostId && userId && hostId.toString() === userId.toString();

  // Connect socket and register to room
  useEffect(() => {
    if (!socket || !code) return;

    const joinSession = () => {
      socket.emit('join-room', { roomCode: code });
    };

    // Emit immediately if already connected
    if (socket.connected) {
      joinSession();
    }

    // Re-emit automatically when socket reconnects
    socket.on('connect', joinSession);

    // Listen for kick events
    socket.on('kicked-from-room', () => {
      alert('You have been kicked from the room by the host.');
      navigate('/dashboard');
    });

    return () => {
      socket.off('connect', joinSession);
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
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-[var(--base-bg)] text-main">
        <div className="w-10 h-10 border-t-2 border-brandCyan rounded-full animate-spin"></div>
        <span className="text-muted text-sm">Entering synchronized room...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-8 pt-24 pb-12 max-w-7xl mx-auto flex flex-col space-y-6 relative bg-[var(--base-bg)] text-main">
      {/* Header Panel */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 neumorph-btn rounded-xl text-muted hover:text-brandCyan transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div>
            <h2 className="text-xl font-bold text-main flex items-center space-x-2">
              <span>{room.name}</span>
              {isHost && (
                <span className="px-2.5 py-0.5 neumorph-btn text-brandPink text-[9px] font-bold rounded-full uppercase flex items-center space-x-1">
                  <Shield className="w-2.5 h-2.5 text-brandPink" />
                  <span>Host</span>
                </span>
              )}
            </h2>
            <div className="flex items-center text-xs text-muted space-x-2 mt-1.5">
              <span className="font-mono neumorph-btn px-2.5 py-0.5 rounded font-bold uppercase text-brandCyan text-xs">
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
          className="px-5 py-2.5 neumorph-btn text-brandCyan font-bold text-xs rounded-xl flex items-center space-x-2 active:scale-95 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-brandCyan" /> : <Share2 className="w-4 h-4 text-brandCyan" />}
          <span>{copied ? 'Link Copied!' : 'Share Room Invite'}</span>
        </button>
      </div>

      {/* Main Feature Grid Layout */}
      {room.isChatOnly ? (
        /* Standalone Private Chat Layout (WhatsApp style) */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch flex-1 min-h-[calc(100vh-280px)]">
          {/* E2EE Voice Chat list - taking 1 column in lg, or stacked on mobile */}
          <div className="lg:col-span-1 flex flex-col justify-start">
            <VoiceChat />
          </div>

          {/* Epic full height Room Chat - taking 3 columns in lg, or stacked on mobile */}
          <div className="lg:col-span-3 flex flex-col h-full min-h-[450px]">
            <RoomChat />
          </div>
        </div>
      ) : (
        /* Standard Music Synchronization Layout */
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
      )}
    </div>
  );
}
