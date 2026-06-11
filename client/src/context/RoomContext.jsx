import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const RoomContext = createContext();

export const useRoom = () => useContext(RoomContext);

// STUN servers configuration for WebRTC
const iceConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const RoomProvider = ({ children }) => {
  const socket = useSocket();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState({
    videoId: null,
    title: null,
    duration: 0,
    isPlaying: false,
    playbackTime: 0,
    addedBy: null
  });

  // WebRTC States
  const [voiceJoined, setVoiceJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({}); // socketId -> MediaStream

  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // socketId -> RTCPeerConnection

  // Reset room state on unload/unmount
  const leaveRoom = () => {
    // 1. Leave Voice Chat first
    leaveVoiceChat();
    // 2. Clear Context States
    setRoom(null);
    setMembers([]);
    setChatMessages([]);
    setQueue([]);
    setCurrentSong({
      videoId: null,
      title: null,
      duration: 0,
      isPlaying: false,
      playbackTime: 0,
      addedBy: null
    });
  };

  // ----------------------------------------------------
  // WebRTC Voice Chat logic (Mesh networking)
  // ----------------------------------------------------

  const joinVoiceChat = async () => {
    if (!socket || voiceJoined) return;
    try {
      console.log('Accessing microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      
      // Stop track processing if muted originally
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });

      setVoiceJoined(true);

      // Notify server we joined voice
      socket.emit('voice-join');

      // Update local visual state
      setMembers(prev => prev.map(m => {
        if (m.socketId === socket.id) {
          return { ...m, isVoiceJoined: true, isMuted: isMuted };
        }
        return m;
      }));

    } catch (err) {
      console.error('Error joining voice chat:', err);
      alert('Could not access microphone. Please check your browser permissions.');
    }
  };

  const leaveVoiceChat = () => {
    if (!socket || !voiceJoined) return;

    // 1. Notify server
    socket.emit('voice-leave');

    // 2. Stop local microphone tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // 3. Close and delete peer connections
    Object.keys(peersRef.current).forEach(socketId => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
      }
    });
    peersRef.current = {};

    // 4. Clear states
    setRemoteStreams({});
    setVoiceJoined(false);

    // Update local member settings
    setMembers(prev => prev.map(m => {
      if (m.socketId === socket.id) {
        return { ...m, isVoiceJoined: false };
      }
      return m;
    }));
  };

  const toggleMute = () => {
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuteState;
      });
    }

    if (socket) {
      socket.emit('voice-toggle-mute', { isMuted: nextMuteState });
    }

    setMembers(prev => prev.map(m => {
      if (m.socketId === socket.id) {
        return { ...m, isMuted: nextMuteState };
      }
      return m;
    }));
  };

  // Create WebRTC Peer connection
  const createPeerConnection = (targetSocketId, isInitiator) => {
    if (peersRef.current[targetSocketId]) {
      return peersRef.current[targetSocketId];
    }

    console.log(`Creating PeerConnection for ${targetSocketId}, isInitiator: ${isInitiator}`);
    const peer = new RTCPeerConnection(iceConfiguration);

    // Add local tracks to connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming remote audio stream
    peer.ontrack = (event) => {
      console.log(`Received remote track from ${targetSocketId}`);
      const remoteStream = event.streams[0];
      setRemoteStreams(prev => ({
        ...prev,
        [targetSocketId]: remoteStream
      }));
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-signal', {
          to: targetSocketId,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    // Connection state changes
    peer.onconnectionstatechange = () => {
      console.log(`Peer state for ${targetSocketId}:`, peer.connectionState);
      if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed' || peer.connectionState === 'closed') {
        cleanupPeer(targetSocketId);
      }
    };

    peersRef.current[targetSocketId] = peer;

    // If initiator, generate SDP Offer
    if (isInitiator) {
      peer.createOffer()
        .then(offer => peer.setLocalDescription(offer))
        .then(() => {
          socket.emit('webrtc-signal', {
            to: targetSocketId,
            signal: peer.localDescription
          });
        })
        .catch(err => console.error('Error generating WebRTC offer:', err));
    }

    return peer;
  };

  const cleanupPeer = (socketId) => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
      delete peersRef.current[socketId];
    }
    setRemoteStreams(prev => {
      const copy = { ...prev };
      delete copy[socketId];
      return copy;
    });
  };

  // Socket triggers inside room
  useEffect(() => {
    if (!socket) return;

    // Room initial load
    socket.on('room-state', ({ room, members }) => {
      setRoom(room);
      setMembers(members);
      setQueue(room.queue);
      if (room.currentSong) {
        setCurrentSong(room.currentSong);
      }
    });

    // Chat handling
    socket.on('chat-history', (history) => {
      setChatMessages(history);
    });

    socket.on('new-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    // Sync Playback State
    socket.on('music-state-update', (state) => {
      setCurrentSong(state);
    });

    // Queue updates
    socket.on('queue-updated', (updatedQueue) => {
      setQueue(updatedQueue);
    });

    // Room user tracking
    socket.on('user-joined', ({ user, members }) => {
      setMembers(members);
      
      // If we are in the voice chat, we must initiate a WebRTC connection to this new user
      if (voiceJoined && user.socketId !== socket.id) {
        // We establish a connection immediately, indicating we are the initiator (offer generator)
        createPeerConnection(user.socketId, true);
      }
    });

    socket.on('user-left', ({ socketId, username, members }) => {
      setMembers(members);
      cleanupPeer(socketId);
    });

    // Peer mute updates
    socket.on('user-mute-updated', ({ socketId, isMuted }) => {
      setMembers(prev => prev.map(m => {
        if (m.socketId === socketId) {
          return { ...m, isMuted };
        }
        return m;
      }));
    });

    // Peer speaking indicators
    socket.on('user-speaking-updated', ({ socketId, isSpeaking }) => {
      setMembers(prev => prev.map(m => {
        if (m.socketId === socketId) {
          return { ...m, isSpeaking };
        }
        return m;
      }));
    });

    // WebRTC signaling receiver
    socket.on('webrtc-signal', async ({ from, signal }) => {
      // If we're not in voice, ignore
      if (!voiceJoined) return;

      try {
        let peer = peersRef.current[from];

        if (signal.type === 'offer') {
          // If connection doesn't exist, create it (we are NOT the initiator)
          peer = createPeerConnection(from, false);
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          
          socket.emit('webrtc-signal', {
            to: from,
            signal: peer.localDescription
          });
        } 
        else if (signal.type === 'answer') {
          if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(signal));
          }
        } 
        else if (signal.type === 'candidate') {
          if (peer) {
            await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC signal:', err);
      }
    });

    // Peer joined voice
    socket.on('user-voice-joined', ({ socketId }) => {
      setMembers(prev => prev.map(m => {
        if (m.socketId === socketId) {
          return { ...m, isVoiceJoined: true };
        }
        return m;
      }));

      // If we are already in voice, initiate connection to them
      if (voiceJoined && socketId !== socket.id) {
        createPeerConnection(socketId, true);
      }
    });

    // Peer left voice
    socket.on('user-voice-left', ({ socketId }) => {
      setMembers(prev => prev.map(m => {
        if (m.socketId === socketId) {
          return { ...m, isVoiceJoined: false };
        }
        return m;
      }));
      cleanupPeer(socketId);
    });

    // Host transfer receiver
    socket.on('host-transferred', ({ newHostId, newHostSocketId, newHostUsername }) => {
      setRoom(prev => {
        if (!prev) return null;
        return { ...prev, host: newHostId };
      });
      // Add custom chat message indicating transfer
      setChatMessages(prev => [
        ...prev,
        {
          _id: `sys-${Date.now()}`,
          sender: { userId: 'system', username: 'System' },
          text: `👑 Host status transferred to ${newHostUsername}.`,
          timestamp: new Date()
        }
      ]);
    });

    // Error messages
    socket.on('error-msg', (msg) => {
      console.warn('Socket error message received:', msg);
    });

    return () => {
      socket.off('room-state');
      socket.off('chat-history');
      socket.off('new-message');
      socket.off('music-state-update');
      socket.off('queue-updated');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('user-mute-updated');
      socket.off('user-speaking-updated');
      socket.off('webrtc-signal');
      socket.off('user-voice-joined');
      socket.off('user-voice-left');
      socket.off('host-transferred');
      socket.off('error-msg');
    };
  }, [socket, voiceJoined]);

  // ----------------------------------------------------
  // Emitting Actions Wrapper
  // ----------------------------------------------------

  const sendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit('send-message', { text });
    }
  };

  const syncMusic = (state) => {
    if (socket && room && room.host === user.id) {
      socket.emit('sync-music', state);
    }
  };

  const addToQueue = (song) => {
    if (socket) {
      socket.emit('add-to-queue', song);
    }
  };

  const removeFromQueue = (songId) => {
    if (socket) {
      socket.emit('remove-from-queue', { songId });
    }
  };

  const skipSong = () => {
    if (socket) {
      socket.emit('skip-song');
    }
  };

  const kickUser = (targetSocketId) => {
    if (socket) {
      socket.emit('admin-kick-user', { targetSocketId });
    }
  };

  const transferHost = (targetSocketId) => {
    if (socket) {
      socket.emit('admin-transfer-host', { targetSocketId });
    }
  };

  const value = {
    room,
    setRoom,
    members,
    chatMessages,
    queue,
    currentSong,
    setCurrentSong,
    voiceJoined,
    joinVoiceChat,
    leaveVoiceChat,
    isMuted,
    toggleMute,
    remoteStreams,
    sendMessage,
    syncMusic,
    addToQueue,
    removeFromQueue,
    skipSong,
    kickUser,
    transferHost,
    leaveRoom
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};
