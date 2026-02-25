const env = require('./config/env');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Run migrations on startup
require('./db/migrate');

const app = express();

// CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Security
app.use(helmet());

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
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const documentRoutes = require('./routes/documents');
const shareRoutes = require('./routes/share');
const analyticsRoutes = require('./routes/analytics');
const workspaceRoutes = require('./routes/workspaces');
const billingRoutes = require('./routes/billing');
const notificationRoutes = require('./routes/notifications');
const leadsRoutes = require('./routes/leads');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leads', leadsRoutes);

const liveRoutes = require('./routes/live');
app.use('/api/live', liveRoutes);

const dealsRoutes = require('./routes/deals');
app.use('/api/deals', dealsRoutes);

const sessionsRoutes = require('./routes/sessions');
app.use('/api/sessions', sessionsRoutes);

// Analytics nested under documents
app.use('/api/documents', analyticsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  try {
    const fs = require('fs');
    const errorLog = `[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n\n`;
    fs.appendFileSync('docusend_error.log', errorLog);
  } catch (e) {
    console.error('Failed to write to error log:', e);
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.listen(env.PORT, () => {
  console.log(`DocuSend API running at http://localhost:${env.PORT}`);
});
