import { Server } from 'socket.io';

export const initSocket = (httpServer) => {
  const envOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((s) => s.trim().replace(/\/+$/, ''))
    : [];

  const allowedOrigins = [
    ...envOrigins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ];

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/+$/, '');
        if (
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(normalized) ||
          process.env.NODE_ENV !== 'production'
        ) {
          return callback(null, true);
        }
        return callback(null, true); // Allow connection
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // Join a study group room
    socket.on('join_group', (groupId) => {
      socket.join(groupId);
      console.log(`Socket ${socket.id} joined group room: ${groupId}`);
    });

    // Leave a study group room
    socket.on('leave_group', (groupId) => {
      socket.leave(groupId);
      console.log(`Socket ${socket.id} left group room: ${groupId}`);
    });

    // Handle incoming chat message and broadcast to room members
    socket.on('send_message', (data) => {
      if (data && data.groupId) {
        io.to(data.groupId).emit('new_message', data);
      }
    });

    // Typing indicators
    socket.on('typing', ({ groupId, userName }) => {
      socket.to(groupId).emit('user_typing', { userName });
    });

    socket.on('stop_typing', ({ groupId }) => {
      socket.to(groupId).emit('user_stop_typing');
    });

    // Real-time peer question broadcast
    socket.on('new_peer_question', (questionData) => {
      socket.broadcast.emit('peer_question_alert', questionData);
    });

    socket.on('disconnect', () => {
      console.log(`⚡ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
