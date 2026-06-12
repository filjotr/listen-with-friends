import React, { useEffect, useRef } from 'react';
import { useRoom } from '../context/RoomContext';
import { useSocket } from '../context/SocketContext';
import { Mic, MicOff, Phone, PhoneOff, Users } from 'lucide-react';

export default function VoiceChat() {
  const socket = useSocket();
  const { 
    members, 
    voiceJoined, 
    joinVoiceChat, 
    leaveVoiceChat, 
    isMuted, 
    toggleMute, 
    remoteStreams 
  } = useRoom();

  const audioRefs = useRef({});

  // speaking volume detection (simple visual indicator)
  useEffect(() => {
    if (!voiceJoined || !socket) return;

    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        // Set up Web Audio API to detect speaking level
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        let wasSpeaking = false;

        javascriptNode.onaudioprocess = () => {
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          let values = 0;

          const length = array.length;
          for (let i = 0; i < length; i++) {
            values += (array[i]);
          }

          const average = values / length;
          const isSpeaking = average > 12; // Threshold for speaking

          if (isSpeaking !== wasSpeaking) {
            wasSpeaking = isSpeaking;
            socket.emit('voice-speaking-indicator', { isSpeaking });
          }
        };
      })
      .catch(err => console.error('Audio processing initialization error:', err));

    return () => {
      if (javascriptNode) javascriptNode.disconnect();
      if (microphone) microphone.disconnect();
      if (audioContext) audioContext.close();
    };
  }, [voiceJoined, socket]);

  // Handle remote audio tag attachment
  useEffect(() => {
    Object.keys(remoteStreams).forEach(socketId => {
      const stream = remoteStreams[socketId];
      const audioElement = audioRefs.current[socketId];
      if (audioElement && stream) {
        audioElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-2">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-brandCyan" />
          <h3 className="font-bold text-main text-sm">Room Voice Chat</h3>
        </div>
        
        <span className="px-2.5 py-1.5 neumorph-btn text-[10px] text-brandCyan font-bold rounded-full uppercase">
          {members.filter(m => m.isVoiceJoined).length} Speaking
        </span>
      </div>

      {/* Grid of Users */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[180px] overflow-y-auto pr-1">
        {members.map((member) => {
          const isMe = socket && member.socketId === socket.id;
          
          return (
            <div 
              key={member.socketId}
              className={`p-3 rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 ${
                member.isSpeaking 
                  ? 'glass-input text-brandCyan' 
                  : 'glass-panel'
              }`}
            >
              {/* Profile image / avatar initials */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs neumorph-btn overflow-hidden">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                  ) : (
                    member.username.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Speaker mic icon badge */}
                {member.isVoiceJoined && (
                  <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-white text-[8px] ${
                    member.isMuted ? 'bg-red-500' : 'bg-brandCyan'
                  }`}>
                    {member.isMuted ? <MicOff className="w-2.5 h-2.5 text-white" /> : <Mic className="w-2.5 h-2.5 text-darkBg" />}
                  </span>
                )}
              </div>

              <span className="text-xs text-main font-semibold truncate max-w-full mt-2">
                {member.username} {isMe && '(You)'}
              </span>

              <span className="text-[9px] text-muted mt-0.5 font-bold">
                {member.isVoiceJoined ? 'In Voice' : 'Silent'}
              </span>

              {/* Render remote peer hidden audio players */}
              {!isMe && member.isVoiceJoined && remoteStreams[member.socketId] && (
                <audio 
                  ref={el => audioRefs.current[member.socketId] = el}
                  autoPlay
                  controls={false}
                  className="hidden"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-3 pt-2">
        {voiceJoined ? (
          <>
            <button
              onClick={toggleMute}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                isMuted 
                  ? 'neumorph-btn text-red-500' 
                  : 'neumorph-btn text-muted hover:text-brandCyan'
              }`}
            >
              {isMuted ? (
                <>
                  <MicOff className="w-4 h-4 text-red-500" />
                  <span>Unmute Mic</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-brandCyan" />
                  <span>Mute Mic</span>
                </>
              )}
            </button>

            <button
              onClick={leaveVoiceChat}
              className="px-4 py-2.5 neumorph-btn text-red-500 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer active:scale-95"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Voice</span>
            </button>
          </>
        ) : (
          <button
            onClick={joinVoiceChat}
            className="w-full py-2.5 neumorph-btn active:scale-95 text-brandCyan font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4 text-brandCyan fill-brandCyan" />
            <span>Join Live Voice Room</span>
          </button>
        )}
      </div>
    </div>
  );
}
