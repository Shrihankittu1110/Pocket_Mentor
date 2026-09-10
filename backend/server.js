import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import peerRoutes from './routes/peerRoutes.js';
import progressRoutes from './routes/progressRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);

// Ensure uploads directory exists on server start
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize Socket.io
initSocket(server);

// Production Security & Compression Middlewares
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://api.dicebear.com", "https://*.dicebear.com"],
        connectSrc: ["'self'", "ws:", "wss:", "*"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Dynamic Allowed Origins for CORS
const envOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim().replace(/\/+$/, ''))
  : [];

const allowedOrigins = [
  ...envOrigins,
  'https://pocket-mentor-m3gx-three.vercel.app/',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

app.use(
  cors({
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
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads folder
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    application: 'Pocket Mentor – AI-Powered Learning & Revision API',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting on sensitive authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/peer', peerRoutes);
app.use('/api/progress', progressRoutes);

// Serve static React frontend in production (if built locally or unified)
const frontendDist = path.join(__dirname, '../frontend/dist');
const hasBuiltFrontend = fs.existsSync(path.join(frontendDist, 'index.html'));

if (process.env.NODE_ENV === 'production' && hasBuiltFrontend) {
  app.use(express.static(frontendDist));

  // Catch-all route to serve React index.html for SPA client-side routing
  app.get('*', (req, res, next) => {
    if (
      req.originalUrl.startsWith('/api') ||
      req.originalUrl.startsWith('/uploads') ||
      req.originalUrl.startsWith('/socket.io')
    ) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // If running as standalone API backend (e.g. frontend deployed separately on Vercel)
  app.get('/', (req, res) => {
    res.json({
      status: 'healthy',
      application: 'Pocket Mentor API Server',
      environment: process.env.NODE_ENV || 'development',
      documentation: '/api/health',
    });
  });
}

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect Database & Start Server
const startServer = async () => {
  await connectDB();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ Port ${PORT} is already in use by another process.`);
      console.error(`👉 You can free port ${PORT} by running:`);
      console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 Pocket Mentor Backend running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io connected and listening for real-time collaboration`);
    console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`);
  });
};

// Graceful process shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down Pocket Mentor...`);
  server.close(async () => {
    console.log('HTTP & WebSocket server closed.');
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
