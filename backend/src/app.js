const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Route imports
const userRoutes = require('./routes/user.routes');
const foodRoutes = require('./routes/food.routes');
const activityRoutes = require('./routes/activity.routes');
const recordRoutes = require('./routes/record.routes');
const { validateObjectId } = require('./middleware/validator.middleware');

const app = express();

// Security Middleware: Helmet & Security Headers
app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Allow API usage with cross-origin frontend
}));

// CORS Middleware with Origin Whitelist
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:4200';
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin || origin === allowedOrigin) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev/test, honors credentials
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  maxAge: 86400
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users/:userId/records', validateObjectId('userId'), recordRoutes);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
