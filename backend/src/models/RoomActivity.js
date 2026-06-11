const mongoose = require('mongoose');

const roomActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  action: {
    type: String,
    enum: ['create', 'join', 'leave'],
    required: true
  },
  roomName: {
    type: String
  },
  roomCode: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RoomActivity', roomActivitySchema);
