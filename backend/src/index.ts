import { env } from './config/env.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Run migrations on startup
import './db/migrate.js';

import { authRoutes } from './modules/auth/index.js';
import { billingRoutes } from './modules/billing/index.js';
import { documentsRoutes } from './modules/documents/index.js';
import { dealsRoutes } from './modules/deals/index.js';
import { leadsRoutes } from './modules/leads/index.js';
import { workspacesRoutes } from './modules/workspaces/index.js';
import { sessionsRoutes } from './modules/sessions/index.js';
import { analyticsRoutes } from './modules/analytics/index.js';
import { dashboardRoutes } from './modules/dashboard/index.js';
import { liveRoutes } from './modules/live/index.js';
import { notificationsRoutes } from './modules/notifications/index.js';
import { shareRoutes } from './modules/share/index.js';

import { errorMiddleware } from './core/middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);

// Security
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow local file serving if needed
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));

// Static files (for uploaded PDFs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/workspaces', workspacesRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/analytics', analyticsRoutes); 

// Global Error Handler
app.use(errorMiddleware);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(env.PORT, () => {
  console.log(`DocuSend API running at http://localhost:${env.PORT}`);
});
