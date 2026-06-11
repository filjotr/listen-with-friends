require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const socketService = require('./services/socket');

const app = express();
const server = http.createServer(app);

// CORS config
const allowedOrigins = process.env.CLIENT_URL || '*';
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Listen With Friends backend running smoothly' });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource not found' });
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Socket.IO Boot
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

socketService(io);

// DB Connection & Start Server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/listen-with-friends';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB database connected successfully!');
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed. Starting server without DB (fallback storage):', err.message);
    // Continue running so testing handles fallbacks if DB unavailable
    server.listen(PORT, () => {
      console.log(`Server started in offline mode on port ${PORT} (DB Unavailable)`);
    });
  });

module.exports = { app, server };
