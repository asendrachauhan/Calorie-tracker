const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./test-db');
const User = require('../src/models/User');
const Food = require('../src/models/Food');
const Activity = require('../src/models/Activity');
const DailyRecord = require('../src/models/DailyRecord');

let testUser;
let testUserId;

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Seed sample foods
  await Food.create([
    { foodId: 1, name: 'Cheese Pizza', foodGroup: 'Fast Food', calories: 307, servingDescription: '1 slice (107g)', fat: 13.4, protein: 12.3, carbohydrate: 33.6 },
    { foodId: 2, name: 'Grilled Chicken Breast', foodGroup: 'Poultry', calories: 165, servingDescription: '100g', fat: 3.6, protein: 31, carbohydrate: 0 },
    { foodId: 3, name: 'Brown Rice', foodGroup: 'Grains', calories: 216, servingDescription: '1 cup (195g)', fat: 1.8, protein: 5, carbohydrate: 45 }
  ]);

  // Seed sample activities
  await Activity.create([
    { activityId: 'ACT-running001', activityName: 'Running', specificMotion: 'jogging, general', metValue: 7 },
    { activityId: 'ACT-cycling001', activityName: 'Cycling', specificMotion: 'bicycling, general', metValue: 8 }
  ]);

  // Create a test user
  const res = await request(app)
    .post('/api/users')
    .send({ name: 'James Monroe', weight: 75.7, height: 180, gender: 'male', dateOfBirth: '1988-06-15' });
  testUser = res.body.data;
  testUserId = testUser._id;
});

describe('Daily Record API - Food & Activity Entries', () => {

  const getToday = () => new Date().toISOString().split('T')[0];

  describe('GET /api/users/:userId/records', () => {
    it('returns empty array when no records exist', async () => {
      const res = await request(app)
        .get(`/api/users/${testUserId}/records`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/users/:userId/records/:date', () => {
    it('returns empty record structure for a date with no entries', async () => {
      const today = getToday();
      const res = await request(app)
        .get(`/api/users/${testUserId}/records/${today}`)
        .expect(200);

      expect(res.body.data.date).toBe(today);
      expect(res.body.data.bmr).toBeGreaterThan(0);
      expect(res.body.data.foodEntries).toEqual([]);
      expect(res.body.data.activityEntries).toEqual([]);
      expect(res.body.data.totalCaloriesIn).toBe(0);
      expect(res.body.data.totalCaloriesOut).toBe(0);
      expect(res.body.data.netCalories).toBeLessThan(0); // 0 - BMR
    });

    it('rejects date outside 30-day range', async () => {
      const d = new Date();
      d.setDate(d.getDate() - 31);
      const oldDate = d.toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/users/${testUserId}/records/${oldDate}`)
        .expect(400);

      expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
    });

    it('rejects future date', async () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const futureDate = d.toISOString().split('T')[0];

      await request(app)
        .get(`/api/users/${testUserId}/records/${futureDate}`)
        .expect(400);
    });
  });

  describe('POST /api/users/:userId/records/:date/foods', () => {
    it('adds a food entry and creates the daily record', async () => {
      const today = getToday();
      const res = await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 1, portion: 2, mealType: 'Lunch' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.foodEntries).toHaveLength(1);

      const entry = res.body.data.foodEntries[0];
      expect(entry.foodName).toBe('Cheese Pizza');
      expect(entry.baseCalories).toBe(307);
      expect(entry.portion).toBe(2);
      expect(entry.calculatedCalories).toBe(614); // 307 * 2
      expect(entry.mealType).toBe('Lunch');
      expect(entry.servingDescription).toBe('1 slice (107g)');
      expect(entry.foodGroup).toBe('Fast Food');
    });

    it('stores BMR snapshot in the daily record', async () => {
      const today = getToday();
      await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 1, portion: 1, mealType: 'Breakfast' });

      const record = await DailyRecord.findOne({ userId: testUserId, date: today });
      expect(record.bmr).toBeGreaterThan(0);
    });

    it('adds multiple food entries to the same daily record', async () => {
      const today = getToday();

      await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 1, portion: 1, mealType: 'Breakfast' });

      const res = await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 2, portion: 1.5, mealType: 'Lunch' })
        .expect(201);

      expect(res.body.data.foodEntries).toHaveLength(2);
    });

    it('rejects invalid meal type', async () => {
      const today = getToday();
      await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 1, portion: 1, mealType: 'SecondBreakfast' })
        .expect(400);
    });

    it('rejects non-existent food ID', async () => {
      const today = getToday();
      const res = await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 9999, portion: 1, mealType: 'Lunch' })
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('rejects portion below minimum', async () => {
      const today = getToday();
      await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 1, portion: 0, mealType: 'Lunch' })
        .expect(400);
    });
  });

  describe('DELETE /api/users/:userId/records/:date/foods/:entryId', () => {
    it('removes a food entry from the daily record', async () => {
      const today = getToday();
      const addRes = await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 1, portion: 1, mealType: 'Lunch' });

      const entryId = addRes.body.data.foodEntries[0]._id;

      const res = await request(app)
        .delete(`/api/users/${testUserId}/records/${today}/foods/${entryId}`)
        .expect(200);

      expect(res.body.data.foodEntries).toHaveLength(0);
    });
  });

  describe('POST /api/users/:userId/records/:date/activities', () => {
    it('adds an activity entry with correct calorie calculation', async () => {
      const today = getToday();
      const res = await request(app)
        .post(`/api/users/${testUserId}/records/${today}/activities`)
        .send({ activityId: 'ACT-running001', durationMinutes: 30 })
        .expect(201);

      expect(res.body.data.activityEntries).toHaveLength(1);
      const entry = res.body.data.activityEntries[0];
      expect(entry.activityName).toBe('Running');
      expect(entry.metValue).toBe(7);
      expect(entry.userWeightKg).toBe(75.7);
      expect(entry.durationMinutes).toBe(30);

      // MET * weight * (minutes/60) = 7 * 75.7 * 0.5 = 264.95
      expect(entry.calculatedCaloriesBurned).toBeCloseTo(264.95, 1);
    });

    it('rejects non-existent activity ID', async () => {
      const today = getToday();
      await request(app)
        .post(`/api/users/${testUserId}/records/${today}/activities`)
        .send({ activityId: 'ACT-nonexistent', durationMinutes: 30 })
        .expect(404);
    });

    it('rejects duration less than 1 minute', async () => {
      const today = getToday();
      await request(app)
        .post(`/api/users/${testUserId}/records/${today}/activities`)
        .send({ activityId: 'ACT-running001', durationMinutes: 0 })
        .expect(400);
    });
  });

  describe('DELETE /api/users/:userId/records/:date/activities/:entryId', () => {
    it('removes an activity entry from the daily record', async () => {
      const today = getToday();
      const addRes = await request(app)
        .post(`/api/users/${testUserId}/records/${today}/activities`)
        .send({ activityId: 'ACT-running001', durationMinutes: 30 });

      const entryId = addRes.body.data.activityEntries[0]._id;

      const res = await request(app)
        .delete(`/api/users/${testUserId}/records/${today}/activities/${entryId}`)
        .expect(200);

      expect(res.body.data.activityEntries).toHaveLength(0);
    });
  });

  describe('Net Calorie Calculation via API', () => {
    it('computes correct net calories from food and activity entries', async () => {
      const today = getToday();

      // Add food: Cheese Pizza x2 = 614 cal
      await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 1, portion: 2, mealType: 'Lunch' });

      // Add food: Grilled Chicken x1 = 165 cal
      await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 2, portion: 1, mealType: 'Dinner' });

      // Add activity: Running 30 min = 7 * 75.7 * 0.5 = 264.95
      await request(app)
        .post(`/api/users/${testUserId}/records/${today}/activities`)
        .send({ activityId: 'ACT-running001', durationMinutes: 30 });

      // Fetch record
      const res = await request(app)
        .get(`/api/users/${testUserId}/records/${today}`)
        .expect(200);

      const record = res.body.data;
      expect(record.totalCaloriesIn).toBeCloseTo(779, 0); // 614 + 165
      expect(record.totalCaloriesOut).toBeCloseTo(264.95, 1);
      expect(record.bmr).toBeGreaterThan(0);

      // Net = CaloriesIn - BMR - CaloriesOut
      const expectedNet = record.totalCaloriesIn - record.bmr - record.totalCaloriesOut;
      expect(record.netCalories).toBeCloseTo(expectedNet, 1);
    });
  });

  describe('Unique Daily Record Constraint', () => {
    it('reuses the same record document for multiple entries on the same date', async () => {
      const today = getToday();

      await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 1, portion: 1, mealType: 'Breakfast' });

      await request(app)
        .post(`/api/users/${testUserId}/records/${today}/foods`)
        .send({ foodId: 2, portion: 1, mealType: 'Lunch' });

      // Should be exactly 1 record for this user+date
      const count = await DailyRecord.countDocuments({ userId: testUserId, date: today });
      expect(count).toBe(1);
    });
  });
});
