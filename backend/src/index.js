const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./db');
const infoRoutes = require('./routes/info');
const resumeRoutes = require('./routes/resume');
const applyRoutes = require('./routes/apply');
const applicationRoutes = require('./routes/applications');

const app = express();
const PORT = process.env.PORT || 4000;
const feUrl = process.env.FRONTEND_URL;
const whiteListUrls = [
  'http://localhost:5173',
  'http://localhost:3000',
  feUrl
]

// Middleware
app.use(cors({
  origin: whiteListUrls,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve generated CVs as static files
app.use('/generated-cvs', express.static(path.join(__dirname, '..', 'generated-cvs')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/info', infoRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/apply', applyRoutes);
app.use('/api/applications', applicationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Connect to MongoDB, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`⚡ JobHunter API running on http://localhost:${PORT}`);
  });
});

module.exports = app;
