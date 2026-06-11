const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  songs: [
    {
      videoId: { type: String, required: true },
      title: { type: String, required: true },
      duration: { type: Number, required: true },
      thumbnail: { type: String, default: '' },
      channelTitle: { type: String, default: '' }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Playlist', playlistSchema);
