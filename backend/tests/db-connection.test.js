const { connectTestDB, closeTestDB } = require('./test-db');
const { connectDB } = require('../src/config/database');

describe('Database Connection Strategy Tests', () => {
  afterEach(async () => {
    delete process.env.MONGODB_URI;
  });

  it('fails fast and throws when MONGODB_URI is unreachable in application mode', async () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:59999/unreachable_db';
    await expect(connectDB()).rejects.toThrow();
  }, 25000);

  it('fails fast when MONGODB_URI is not set', async () => {
    delete process.env.MONGODB_URI;
    await expect(connectDB()).rejects.toThrow('MONGODB_URI environment variable is not defined.');
  });

  it('connects to test-only memory database in automated test environment', async () => {
    await connectTestDB();
    const mongoose = require('mongoose');
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    await closeTestDB();
    expect(mongoose.connection.readyState).toBe(0); // 0 = disconnected
  }, 30000);
});
