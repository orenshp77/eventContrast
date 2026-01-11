import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import inviteRoutes from './routes/invites';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { initDatabase } from './db/connection';

dotenv.config();

// Log font availability on startup
function checkFonts() {
  console.log('=== Font Check at Startup ===');
  console.log('__dirname:', __dirname);
  console.log('process.cwd():', process.cwd());

  const fontLocations = [
    path.join(__dirname, '../fonts'),
    path.join(__dirname, 'fonts'),
    path.join(process.cwd(), 'dist/fonts'),
    path.join(process.cwd(), 'src/fonts'),
  ];

  for (const loc of fontLocations) {
    const fontPath = path.join(loc, 'Rubik-Regular.ttf');
    try {
      const exists = fs.existsSync(fontPath);
      console.log(`${loc}: ${exists ? 'FOUND' : 'not found'}`);
      if (exists) {
        const files = fs.readdirSync(loc);
        console.log(`  Files: ${files.join(', ')}`);
      }
    } catch (e) {
      console.log(`${loc}: error checking - ${e}`);
    }
  }
  console.log('=== End Font Check ===');
}

checkFonts();

const app = express();
const PORT = process.env.PORT || 10001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:10000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
const uploadsPath = path.resolve(process.cwd(), 'uploads');
console.log('Uploads path:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Rate limiting for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'יותר מדי בקשות, נסה שוב מאוחר יותר' },
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 submissions per hour
  message: { message: 'יותר מדי הגשות, נסה שוב מאוחר יותר' },
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/public', publicLimiter, publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public/invite/:token/submit', submitLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    await initDatabase();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
