const net = require('net');

const checkMongoPort = () => {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port: 27017, host: '127.0.0.1' });
    socket.setTimeout(400);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
};

async function start() {
  const mongoUri = process.env.MONGO_URI || '';
  const isLocal = mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost') || !mongoUri;

  let useMock = false;
  if (isLocal) {
    const isMongoOpen = await checkMongoPort();
    if (!isMongoOpen) {
      useMock = true;
    }
  }

  if (useMock) {
    console.log('------------------------------------------------------------');
    console.log('MongoDB port 27017 is offline. Loading in-memory Mongoose mock...');
    console.log('------------------------------------------------------------');
    
    const mongooseMock = require('./mongoose-mock');
    require.cache[require.resolve('mongoose')] = {
      id: require.resolve('mongoose'),
      filename: require.resolve('mongoose'),
      loaded: true,
      exports: mongooseMock
    };
  } else {
    console.log('------------------------------------------------------------');
    console.log('Connecting to real database...');
    console.log('------------------------------------------------------------');
  }
  
  // Start the server
  require('./server');
}

start().catch(err => {
  console.error('Failed to start server:', err);
});
