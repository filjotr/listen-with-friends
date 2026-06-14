const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Room = require('../models/Room');
const RoomActivity = require('../models/RoomActivity');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const https = require('https');

// Helper to scrape YouTube Search Results (no API key needed)
const searchYouTube = (query) => {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };

    https.get(url, options, (res) => {
      let html = '';
      res.on('data', (chunk) => { html += chunk; });
      res.on('end', () => {
        try {
          const match = html.match(/ytInitialData\s*=\s*({.+?});/);
          if (!match) return resolve([]);
          
          const data = JSON.parse(match[1]);
          const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
          if (!contents) return resolve([]);
          
          const results = [];
          for (const item of contents) {
            if (item.videoRenderer) {
              const video = item.videoRenderer;
              const videoId = video.videoId;
              const title = video.title?.runs?.[0]?.text || video.title?.simpleText;
              const channelTitle = video.ownerText?.runs?.[0]?.text;
              const thumbnail = video.thumbnail?.thumbnails?.[0]?.url;
              
              const lengthText = video.lengthText?.simpleText || "";
              let duration = 180;
              if (lengthText) {
                const parts = lengthText.split(':').map(Number);
                if (parts.length === 2) duration = parts[0] * 60 + parts[1];
                else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
              }
              
              if (videoId && title) {
                results.push({
                  videoId,
                  title,
                  channelTitle: channelTitle || 'Unknown Artist',
                  thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/0.jpg`,
                  duration
                });
              }
            }
            if (results.length >= 8) break;
          }
          resolve(results);
        } catch (err) {
          resolve([]); // Fallback to empty results on parse error
        }
      });
    }).on('error', (err) => {
      resolve([]);
    });
  });
};

// Search YouTube
router.get('/search-yt', authMiddleware, async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Query parameter q is required' });
  }
  try {
    const results = await searchYouTube(q);
    res.json({ results });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ message: 'Failed to fetch search results' });
  }
});

// Helper to generate unique room code (e.g. ABCD-123)
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create Room
router.post('/create', authMiddleware, async (req, res) => {
  const { name, isPrivate, password, isEphemeralChat } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    let code = generateRoomCode();
    // Ensure uniqueness
    let exists = await Room.findOne({ code });
    while (exists) {
      code = generateRoomCode();
      exists = await Room.findOne({ code });
    }

    const room = new Room({
      code,
      name,
      isPrivate: !!isPrivate,
      password: isPrivate ? password : '',
      isEphemeralChat: !!isEphemeralChat,
      host: req.user._id,
      members: [{ user: req.user._id, role: 'host' }]
    });

    await room.save();

    // Log Activity
    const activity = new RoomActivity({
      user: req.user._id,
      room: room._id,
      action: 'create',
      roomName: room.name,
      roomCode: room.code
    });
    await activity.save();

    // Update User Stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.roomsCreated': 1 }
    });

    res.status(201).json({ room });
  } catch (err) {
    console.error('Room create error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Public Rooms
router.get('/public', authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('host', 'username avatar')
      .populate('members.user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json({ rooms });
  } catch (err) {
    console.error('Fetch public rooms error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check Room Code Validity & Requirements
router.get('/check/:code', authMiddleware, async (req, res) => {
  const { code } = req.params;
  try {
    const room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({
      valid: true,
      name: room.name,
      code: room.code,
      isPrivate: room.isPrivate,
      requiresPassword: room.isPrivate && !!room.password
    });
  } catch (err) {
    console.error('Check room error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join Room Validate Password (before Socket connect)
router.post('/join/:code', authMiddleware, async (req, res) => {
  const { code } = req.params;
  const { password } = req.body;
  try {
    const room = await Room.findOne({ code: code.toUpperCase() })
      .populate('host', 'username avatar')
      .populate('members.user', 'username avatar');
      
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.isPrivate && room.password && room.password !== password) {
      // Allow host to bypass password
      if (room.host._id.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Incorrect room password' });
      }
    }

    // Check if user is already a member, if not, save membership (Socket will do room management, but let's persist here too)
    const isMember = room.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      room.members.push({ user: req.user._id, role: 'member' });
      await room.save();
      
      // Update User stats
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.roomsJoined': 1 }
      });
    }

    // Log Activity
    const activity = new RoomActivity({
      user: req.user._id,
      room: room._id,
      action: 'join',
      roomName: room.name,
      roomCode: room.code
    });
    await activity.save();

    res.json({ room });
  } catch (err) {
    console.error('Room join route error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent rooms user participated in
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    // Find activities of user, group by room
    const activities = await RoomActivity.find({ user: req.user._id, action: { $in: ['join', 'create'] } })
      .sort({ timestamp: -1 })
      .limit(10);

    const roomCodes = [...new Set(activities.map(a => a.roomCode).filter(Boolean))];
    const rooms = await Room.find({ code: { $in: roomCodes } })
      .populate('host', 'username avatar')
      .limit(5);

    res.json({ rooms });
  } catch (err) {
    console.error('Fetch recent rooms error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
