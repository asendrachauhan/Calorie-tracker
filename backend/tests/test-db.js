const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connect to an isolated in-memory MongoDB instance for automated testing only.
 * This ensures unit/integration test suites run deterministically without modifying
 * the developer's local MongoDB database.
 */
async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

async function closeTestDB() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

module.exports = { connectTestDB, closeTestDB, clearTestDB };
