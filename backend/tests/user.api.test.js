const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./test-db');
const User = require('../src/models/User');
const DailyRecord = require('../src/models/DailyRecord');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

const validUser = {
  name: 'James Monroe',
  weight: 75.7,
  height: 180,
  gender: 'male',
  dateOfBirth: '1988-06-15'
};

describe('User API - CRUD Operations', () => {

  describe('POST /api/users', () => {
    it('creates a user and returns 201 with computed age and BMR', async () => {
      const res = await request(app)
        .post('/api/users')
        .send(validUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('James Monroe');
      expect(res.body.data.weight).toBe(75.7);
      expect(res.body.data.height).toBe(180);
      expect(res.body.data.gender).toBe('male');
      expect(res.body.data.age).toBeGreaterThan(0);
      expect(res.body.data.bmr).toBeGreaterThan(0);
      expect(res.body.data._id).toBeDefined();
    });

    it('rejects missing name with 400', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ ...validUser, name: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid gender with 400', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ ...validUser, gender: 'other' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects weight out of range with 400', async () => {
      await request(app)
        .post('/api/users')
        .send({ ...validUser, weight: 0 })
        .expect(400);

      await request(app)
        .post('/api/users')
        .send({ ...validUser, weight: 600 })
        .expect(400);
    });

    it('rejects future date of birth with 400', async () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const res = await request(app)
        .post('/api/users')
        .send({ ...validUser, dateOfBirth: future.toISOString().split('T')[0] })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/users', () => {
    it('returns empty array when no users exist', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('returns all users with age and BMR', async () => {
      await request(app).post('/api/users').send(validUser);
      await request(app).post('/api/users').send({ ...validUser, name: 'Jane Doe', gender: 'female' });

      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      res.body.data.forEach(u => {
        expect(u.age).toBeDefined();
        expect(u.bmr).toBeDefined();
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns user by ID', async () => {
      const created = await request(app).post('/api/users').send(validUser);
      const id = created.body.data._id;

      const res = await request(app)
        .get(`/api/users/${id}`)
        .expect(200);

      expect(res.body.data.name).toBe('James Monroe');
    });

    it('returns 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid ObjectId', async () => {
      const res = await request(app)
        .get('/api/users/not-a-valid-id')
        .expect(400);

      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deletes user and cascades to daily records', async () => {
      const created = await request(app).post('/api/users').send(validUser);
      const userId = created.body.data._id;

      // Create a daily record for this user
      await DailyRecord.create({
        userId,
        date: new Date().toISOString().split('T')[0],
        bmr: 1700,
        foodEntries: [],
        activityEntries: []
      });

      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(res.body.data.deletedRecords).toBe(1);

      // Verify user is gone
      await request(app).get(`/api/users/${userId}`).expect(404);

      // Verify records are gone
      const records = await DailyRecord.find({ userId });
      expect(records).toHaveLength(0);
    });

    it('returns 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app).delete(`/api/users/${fakeId}`).expect(404);
    });
  });
});
