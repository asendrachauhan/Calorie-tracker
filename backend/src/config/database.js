const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the configured MONGODB_URI.
 * Per project requirements, this application strictly connects to the configured
 * MongoDB instance and does NOT silently fall back to in-memory storage.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 20000
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.name} @ ${conn.connection.host}:${conn.connection.port}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed to ${uri}:`, error.message);
    throw error;
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected.');
}

module.exports = { connectDB, disconnectDB };
