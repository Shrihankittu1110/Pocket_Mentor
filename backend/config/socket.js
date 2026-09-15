import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import StudyGroup from '../models/StudyGroup.js';
import { isUserGroupMember } from '../controllers/groupController.js';

export const initSocket = (httpServer) => {
  const envOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((s) => s.trim().replace(/\/+$/, ''))
    : [];

  const allowedOrigins = [
    ...envOrigins,
    'https://pocket-mentor-m3gx-three.vercel.app',
    'https://pocket-mentor-m3gx-three.vercel.app/',
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

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
        socket.handshake.query?.token;

      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'pocket_mentor_super_secret_jwt_key_2026_production_secure'
        );
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          socket.user = user;
        }
      }
      next();
    } catch (err) {
      console.warn('Socket authentication notice:', err.message);
      // Still allow connection for unauthenticated public peer alerts, but socket.user remains null
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id} (User: ${socket.user?.name || 'Guest'})`);

    // Secure Study Group Join Handler
    socket.on('join_group', async (groupId, callback) => {
      try {
        if (!socket.user) {
          const errMsg = 'Authentication required to join study group room';
          socket.emit('auth_error', { message: errMsg });
          socket.emit('error', { message: errMsg });
          if (typeof callback === 'function') callback({ status: 'error', message: errMsg });
          return;
        }

        if (!groupId) {
          const errMsg = 'Group ID is required';
          socket.emit('error', { message: errMsg });
          if (typeof callback === 'function') callback({ status: 'error', message: errMsg });
          return;
        }

        const group = await StudyGroup.findById(groupId);
        if (!group) {
          const errMsg = 'Study group not found';
          socket.emit('error', { message: errMsg });
          if (typeof callback === 'function') callback({ status: 'error', message: errMsg });
          return;
        }

        // Verify that authenticated user is either admin or in members
        if (!isUserGroupMember(group, socket.user._id)) {
          const errMsg = 'Access denied: You are not a member of this study group';
          socket.emit('auth_error', { message: errMsg });
          socket.emit('error', { message: errMsg });
          if (typeof callback === 'function') callback({ status: 'error', message: errMsg });
          return;
        }

        socket.join(groupId);
        console.log(`🔒 Socket ${socket.id} (User: ${socket.user.name}) authorized & joined group: ${groupId}`);
        if (typeof callback === 'function') callback({ status: 'ok', groupId });
      } catch (err) {
        console.error('Socket join_group error:', err);
        socket.emit('error', { message: 'Internal server error while joining group' });
        if (typeof callback === 'function') callback({ status: 'error', message: err.message });
      }
    });

    // Leave a study group room
    socket.on('leave_group', (groupId) => {
      socket.leave(groupId);
      console.log(`Socket ${socket.id} left group room: ${groupId}`);
    });

    // Handle incoming chat message and broadcast to room members
    socket.on('send_message', async (data) => {
      try {
        if (!data || !data.groupId) return;

        if (!socket.user) {
          socket.emit('auth_error', { message: 'Authentication required to send message' });
          return;
        }

        const group = await StudyGroup.findById(data.groupId);
        if (!group || !isUserGroupMember(group, socket.user._id)) {
          socket.emit('auth_error', { message: 'Access denied: You are not a member of this study group' });
          return;
        }

        io.to(data.groupId).emit('new_message', data);
      } catch (err) {
        console.error('Socket send_message error:', err);
      }
    });

    // Handle message deletion broadcast to room members
    socket.on('delete_message', async (data) => {
      try {
        if (!data || !data.groupId || !data.messageId) return;

        if (!socket.user) {
          socket.emit('auth_error', { message: 'Authentication required to delete message' });
          return;
        }

        const group = await StudyGroup.findById(data.groupId);
        if (!group || !isUserGroupMember(group, socket.user._id)) {
          socket.emit('auth_error', { message: 'Access denied: You are not a member of this study group' });
          return;
        }

        io.to(data.groupId).emit('message_deleted', {
          groupId: data.groupId,
          messageId: data.messageId,
        });
      } catch (err) {
        console.error('Socket delete_message error:', err);
      }
    });


    // Typing indicators
    socket.on('typing', async ({ groupId, userName }) => {
      try {
        if (!groupId || !socket.user) return;
        const group = await StudyGroup.findById(groupId);
        if (!group || !isUserGroupMember(group, socket.user._id)) return;

        socket.to(groupId).emit('user_typing', { userName: userName || socket.user.name });
      } catch (err) {
        console.error('Socket typing error:', err);
      }
    });

    socket.on('stop_typing', async ({ groupId }) => {
      try {
        if (!groupId || !socket.user) return;
        socket.to(groupId).emit('user_stop_typing');
      } catch (err) {
        console.error('Socket stop_typing error:', err);
      }
    });

    // Real-time peer question broadcast (Public community feature)
    socket.on('new_peer_question', (questionData) => {
      socket.broadcast.emit('peer_question_alert', questionData);
    });

    socket.on('disconnect', () => {
      console.log(`⚡ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
