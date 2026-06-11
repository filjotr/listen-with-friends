import React from 'react';
import { useRoom } from '../context/RoomContext';
import { useSocket } from '../context/SocketContext';
import { ShieldAlert, UserMinus, Crown } from 'lucide-react';

export default function AdminControls() {
  const socket = useSocket();
  const { room, members, kickUser, transferHost } = useRoom();

  if (!room) return null;

  return (
    <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
        <ShieldAlert className="w-4 h-4 text-brandPink" />
        <h3 className="font-bold text-slate-200 text-sm">Admin Controls</h3>
      </div>

      {/* Participant overrides */}
      <div className="flex flex-col space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
        {members.map((member) => {
          const isMe = socket && member.socketId === socket.id;
          if (isMe) return null; // Can't admin yourself

          return (
            <div 
              key={member.socketId}
              className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-xs font-bold flex items-center justify-center border border-white/5 overflow-hidden">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                  ) : (
                    member.username.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs text-slate-300 font-semibold truncate">{member.username}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to transfer host ownership to ${member.username}?`)) {
                      transferHost(member.socketId);
                    }
                  }}
                  className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-darkBg rounded-lg transition-all"
                  title="Make Host"
                >
                  <Crown className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to kick ${member.username} from this room?`)) {
                      kickUser(member.socketId);
                    }
                  }}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-slate-100 rounded-lg transition-all"
                  title="Kick User"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {members.length <= 1 && (
          <p className="text-center text-slate-500 text-xs py-4">No other users in room to manage</p>
        )}
      </div>
    </div>
  );
}
