require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { connectRedis } = require('./config/redis');
const http = require('http');
const socketio = require('socket.io');
const server = http.createServer(app);
const io = new socketio.Server(server, { path: process.env.SOCKET_IO_PATH || '/socket.io' });

// attach to app for other modules to emit
app.set('io', io);

io.on('connection', socket => {
  console.log('socket connected', socket.id);
  socket.on('subscribe', (topics) => { /* join rooms */ });
});


const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI);
    await connectRedis(process.env.REDIS_URL).catch((e) => {
      console.warn('Redis not available:', e.message);
    });

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
