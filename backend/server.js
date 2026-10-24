require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`[Server] Calorie Tracker API running on http://localhost:${PORT}`);
    });

    const shutdown = async () => {
      console.log('[Server] Gracefully shutting down...');
      server.close(async () => {
        const { disconnectDB } = require('./src/config/database');
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Server] Fatal error on startup:', error.message);
    process.exit(1);
  }
}

startServer();
