const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: ''
  },
  isEphemeralChat: {
    type: Boolean,
    default: false
  },
  isChatOnly: {
    type: Boolean,
    default: false
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['host', 'member'],
        default: 'member'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  queue: [
    {
      videoId: { type: String, required: true },
      title: { type: String, required: true },
      duration: { type: Number, required: true }, // in seconds
      thumbnail: { type: String, default: '' },
      channelTitle: { type: String, default: '' },
      addedBy: { type: String, required: true }
    }
  ],
  currentSong: {
    videoId: { type: String, default: null },
    title: { type: String, default: null },
    duration: { type: Number, default: 0 },
    thumbnail: { type: String, default: '' },
    channelTitle: { type: String, default: '' },
    addedBy: { type: String, default: null },
    isPlaying: { type: Boolean, default: false },
    playbackTime: { type: Number, default: 0 }, // in seconds
    lastUpdated: { type: Date, default: Date.now }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);
