const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');

const activeRooms = {}; // Cache room details: roomCode -> { users: { socketId: user } }

module.exports = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_123');
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    let currentRoomCode = null;

    console.log(`Socket connected: ${user.username} (${socket.id})`);

    // 1. JOIN ROOM
    socket.on('join-room', async ({ roomCode }) => {
      try {
        const code = roomCode.toUpperCase();
        const room = await Room.findOne({ code })
          .populate('host', 'username avatar')
          .populate('members.user', 'username avatar');

        if (!room) {
          return socket.emit('error-msg', 'Room not found');
        }

        currentRoomCode = code;
        socket.join(code);

        // Track in memory active rooms
        if (!activeRooms[code]) {
          activeRooms[code] = { users: {} };
        }
        
        // Add user to memory state
        activeRooms[code].users[socket.id] = {
          userId: user._id.toString(),
          username: user.username,
          avatar: user.avatar,
          socketId: socket.id,
          isMuted: false,
          isSpeaking: false,
          isVoiceJoined: false
        };

        // Persist membership in Mongoose if not already
        const isMember = room.members.some(m => m.user._id.toString() === user._id.toString());
        if (!isMember) {
          room.members.push({ user: user._id, role: 'member' });
          await room.save();
        }

        console.log(`${user.username} joined room ${code}`);

        // Broadcast user joined
        io.to(code).emit('user-joined', {
          user: activeRooms[code].users[socket.id],
          members: Object.values(activeRooms[code].users)
        });

        // Send current playback state and sync info
        socket.emit('room-state', {
          room,
          members: Object.values(activeRooms[code].users)
        });

        // Load recent chat messages (skip database fetch if ephemeral)
        if (room.isEphemeralChat) {
          socket.emit('chat-history', []);
        } else {
          const messages = await Message.find({ room: room._id })
            .sort({ timestamp: -1 })
            .limit(50);
          socket.emit('chat-history', messages.reverse());
        }

      } catch (err) {
        console.error('Socket join-room error:', err);
        socket.emit('error-msg', 'Error joining room');
      }
    });

    // 2. CHAT MESSAGE
    socket.on('send-message', async ({ text }) => {
      if (!currentRoomCode) return;
      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (!room) return;

        if (room.isEphemeralChat) {
          // Ephemeral chat: broadcast in-memory transient message without database saving
          const tempMessage = {
            _id: `temp-${Date.now()}-${Math.random()}`,
            room: room._id,
            sender: {
              userId: user._id,
              username: user.username,
              avatar: user.avatar
            },
            text,
            timestamp: new Date()
          };
          io.to(currentRoomCode).emit('new-message', tempMessage);
        } else {
          const message = new Message({
            room: room._id,
            sender: {
              userId: user._id,
              username: user.username,
              avatar: user.avatar
            },
            text
          });

          await message.save();

          io.to(currentRoomCode).emit('new-message', message);
        }
      } catch (err) {
        console.error('Send message error:', err);
      }
    });

    // 3. MUSIC PLAYBACK CONTROL (Only Host should control sync, or anyone depending on UI config)
    socket.on('sync-music', async (updatedState) => {
      if (!currentRoomCode) return;
      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (!room) return;

        // Verify if sender is host
        const isHost = room.host.toString() === user._id.toString();
        if (!isHost) {
          return socket.emit('error-msg', 'Only the host can control playback');
        }

        // Update database
        room.currentSong = {
          videoId: updatedState.videoId || room.currentSong.videoId,
          title: updatedState.title || room.currentSong.title,
          duration: updatedState.duration || room.currentSong.duration,
          thumbnail: updatedState.thumbnail || room.currentSong.thumbnail,
          channelTitle: updatedState.channelTitle || room.currentSong.channelTitle,
          addedBy: updatedState.addedBy || room.currentSong.addedBy,
          isPlaying: updatedState.isPlaying,
          playbackTime: updatedState.playbackTime,
          lastUpdated: new Date()
        };

        await room.save();

        // Broadcast sync to everyone else
        socket.to(currentRoomCode).emit('music-state-update', room.currentSong);
      } catch (err) {
        console.error('Sync music error:', err);
      }
    });

    // 4. MUSIC QUEUE ACTIONS
    socket.on('add-to-queue', async (song) => {
      if (!currentRoomCode) return;
      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (!room) return;

        const songObj = {
          videoId: song.videoId,
          title: song.title,
          duration: song.duration,
          thumbnail: song.thumbnail || '',
          channelTitle: song.channelTitle || '',
          addedBy: user.username
        };

        room.queue.push(songObj);
        await room.save();

        io.to(currentRoomCode).emit('queue-updated', room.queue);

        // If nothing is playing, play this song immediately
        if (!room.currentSong.videoId) {
          room.currentSong = {
            ...songObj,
            isPlaying: true,
            playbackTime: 0,
            lastUpdated: new Date()
          };
          // Remove from queue since it becomes current
          room.queue.shift();
          await room.save();

          io.to(currentRoomCode).emit('music-state-update', room.currentSong);
          io.to(currentRoomCode).emit('queue-updated', room.queue);
        }
      } catch (err) {
        console.error('Add queue error:', err);
      }
    });

    socket.on('remove-from-queue', async ({ songId }) => {
      if (!currentRoomCode) return;
      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (!room) return;

        room.queue = room.queue.filter(item => item._id.toString() !== songId);
        await room.save();

        io.to(currentRoomCode).emit('queue-updated', room.queue);
      } catch (err) {
        console.error('Remove queue error:', err);
      }
    });

    socket.on('skip-song', async () => {
      if (!currentRoomCode) return;
      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (!room) return;

        const isHost = room.host.toString() === user._id.toString();
        if (!isHost) {
          return socket.emit('error-msg', 'Only the host can skip');
        }

        if (room.queue.length > 0) {
          const nextSong = room.queue[0];
          room.currentSong = {
            videoId: nextSong.videoId,
            title: nextSong.title,
            duration: nextSong.duration,
            thumbnail: nextSong.thumbnail,
            channelTitle: nextSong.channelTitle,
            addedBy: nextSong.addedBy,
            isPlaying: true,
            playbackTime: 0,
            lastUpdated: new Date()
          };
          room.queue.shift();
        } else {
          // Empty state
          room.currentSong = {
            videoId: null,
            title: null,
            duration: 0,
            isPlaying: false,
            playbackTime: 0,
            lastUpdated: new Date()
          };
        }

        await room.save();
        io.to(currentRoomCode).emit('music-state-update', room.currentSong);
        io.to(currentRoomCode).emit('queue-updated', room.queue);
      } catch (err) {
        console.error('Skip song error:', err);
      }
    });

    // 5. WEBRTC VOICE CHAT SIGNALING (Mesh peer-to-peer setup)
    socket.on('voice-join', () => {
      if (!currentRoomCode || !activeRooms[currentRoomCode]) return;

      const userState = activeRooms[currentRoomCode].users[socket.id];
      if (!userState) return;

      userState.isVoiceJoined = true;
      console.log(`${user.username} joined voice chat`);

      // Notify everyone in the room that this user joined voice
      socket.to(currentRoomCode).emit('user-voice-joined', {
        socketId: socket.id,
        userId: user._id.toString(),
        username: user.username,
        avatar: user.avatar
      });
    });

    socket.on('voice-leave', () => {
      if (!currentRoomCode || !activeRooms[currentRoomCode]) return;

      const userState = activeRooms[currentRoomCode].users[socket.id];
      if (userState) {
        userState.isVoiceJoined = false;
      }
      console.log(`${user.username} left voice chat`);

      socket.to(currentRoomCode).emit('user-voice-left', { socketId: socket.id });
    });

    socket.on('webrtc-signal', ({ to, signal }) => {
      // Forward signal packet (offer, answer, ice candidate) to targeted socket
      io.to(to).emit('webrtc-signal', {
        from: socket.id,
        signal
      });
    });

    // Toggle mute client-side status
    socket.on('voice-toggle-mute', ({ isMuted }) => {
      if (!currentRoomCode || !activeRooms[currentRoomCode]) return;

      const userState = activeRooms[currentRoomCode].users[socket.id];
      if (userState) {
        userState.isMuted = isMuted;
        io.to(currentRoomCode).emit('user-mute-updated', {
          socketId: socket.id,
          isMuted
        });
      }
    });

    // Audio level indicators (speaking check)
    socket.on('voice-speaking-indicator', ({ isSpeaking }) => {
      if (!currentRoomCode || !activeRooms[currentRoomCode]) return;

      const userState = activeRooms[currentRoomCode].users[socket.id];
      if (userState) {
        userState.isSpeaking = isSpeaking;
        socket.to(currentRoomCode).emit('user-speaking-updated', {
          socketId: socket.id,
          isSpeaking
        });
      }
    });

    // 6. ADMIN CONTROLS
    socket.on('admin-kick-user', async ({ targetSocketId }) => {
      if (!currentRoomCode || !activeRooms[currentRoomCode]) return;
      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (!room) return;

        // Verify sender is host
        if (room.host.toString() !== user._id.toString()) {
          return socket.emit('error-msg', 'Only host can kick users');
        }

        const targetUser = activeRooms[currentRoomCode].users[targetSocketId];
        if (!targetUser) return;

        // Remove from DB members list
        room.members = room.members.filter(m => m.user.toString() !== targetUser.userId);
        await room.save();

        // Emit kick event to that specific user
        io.to(targetSocketId).emit('kicked-from-room');

        // Force target socket to leave the room channel
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.leave(currentRoomCode);
        }

        // Remove from memory active cache
        delete activeRooms[currentRoomCode].users[targetSocketId];

        // Notify room members
        io.to(currentRoomCode).emit('user-left', {
          socketId: targetSocketId,
          username: targetUser.username,
          members: Object.values(activeRooms[currentRoomCode].users)
        });

      } catch (err) {
        console.error('Kick user error:', err);
      }
    });

    socket.on('admin-transfer-host', async ({ targetSocketId }) => {
      if (!currentRoomCode || !activeRooms[currentRoomCode]) return;
      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (!room) return;

        if (room.host.toString() !== user._id.toString()) {
          return socket.emit('error-msg', 'Only host can transfer host ownership');
        }

        const targetUser = activeRooms[currentRoomCode].users[targetSocketId];
        if (!targetUser) return;

        // Save new host in DB
        room.host = targetUser.userId;
        await room.save();

        // Broadcast host transfer
        io.to(currentRoomCode).emit('host-transferred', {
          newHostId: targetUser.userId,
          newHostSocketId: targetSocketId,
          newHostUsername: targetUser.username
        });
      } catch (err) {
        console.error('Transfer host error:', err);
      }
    });

    // 7. CLEANUP ON DISCONNECT
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${user.username} (${socket.id})`);
      if (!currentRoomCode || !activeRooms[currentRoomCode]) return;

      const leavingUser = activeRooms[currentRoomCode].users[socket.id];
      if (!leavingUser) return;

      // Remove from room cache
      delete activeRooms[currentRoomCode].users[socket.id];

      // Retrieve Room DB instance
      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (room) {
          // Filter out user from active members
          room.members = room.members.filter(m => m.user.toString() !== leavingUser.userId);
          
          // Check if room is empty now
          const activeUserCount = Object.keys(activeRooms[currentRoomCode].users).length;
          if (activeUserCount === 0) {
            // Room is empty, let's keep the database record but clean up playback
            room.currentSong.isPlaying = false;
            await room.save();
            delete activeRooms[currentRoomCode];
          } else {
            // Room is not empty. If the leaving user was the host, transfer to another socket
            if (room.host.toString() === leavingUser.userId) {
              const remainingSockets = Object.keys(activeRooms[currentRoomCode].users);
              const nextHostSocketId = remainingSockets[0];
              const nextHost = activeRooms[currentRoomCode].users[nextHostSocketId];

              room.host = nextHost.userId;
              await room.save();

              // Broadcast host transfer
              io.to(currentRoomCode).emit('host-transferred', {
                newHostId: nextHost.userId,
                newHostSocketId: nextHostSocketId,
                newHostUsername: nextHost.username
              });
            } else {
              await room.save();
            }

            // Notify remaining users
            io.to(currentRoomCode).emit('user-left', {
              socketId: socket.id,
              username: leavingUser.username,
              members: Object.values(activeRooms[currentRoomCode].users)
            });
          }
        }
      } catch (err) {
        console.error('Socket disconnect DB sync error:', err);
      }
    });
  });
};
