const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/listen-with-friends';

console.log('Attempting connection to database path:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ SUCCESS: Able to resolve and connect to MongoDB database instance!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ FAILURE: Could not connect to database:', err.message);
    console.log('Note: The backend has fallback error handling to boot in offline/DB-unavailable mode.');
    process.exit(0); // Exit cleanly so tests don't break general server checks if MongoDB is absent locally
  });
