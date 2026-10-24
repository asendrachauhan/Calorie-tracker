const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./test-db');
const Activity = require('../src/models/Activity');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  await Activity.create([
    { activityId: 'ACT-run001', activityName: 'Running', specificMotion: 'jogging, general', metValue: 7 },
    { activityId: 'ACT-run002', activityName: 'Running', specificMotion: 'running, 6 mph (10 min/mile)', metValue: 9.8 },
    { activityId: 'ACT-cyc001', activityName: 'Cycling', specificMotion: 'bicycling, general', metValue: 8 },
    { activityId: 'ACT-swim001', activityName: 'Swimming', specificMotion: 'freestyle, light/moderate effort', metValue: 5.8 }
  ]);
});

describe('Activity API - Search and Categories', () => {
  describe('GET /api/activities', () => {
    it('returns all activities up to limit when no search filter provided', async () => {
      const res = await request(app).get('/api/activities').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(4);
      expect(res.body.count).toBe(4);
    });

    it('filters activities by specificMotion search text case-insensitively', async () => {
      const res = await request(app).get('/api/activities?search=jogging').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].activityId).toBe('ACT-run001');
    });

    it('filters activities by category (activityName)', async () => {
      const res = await request(app).get('/api/activities?category=Running').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every(a => a.activityName === 'Running')).toBe(true);
    });

    it('filters activities by both search text and category', async () => {
      const res = await request(app).get('/api/activities?category=Running&search=6%20mph').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].activityId).toBe('ACT-run002');
    });

    it('respects the limit query parameter (bounded results)', async () => {
      const res = await request(app).get('/api/activities?limit=2').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/activities/categories', () => {
    it('returns sorted distinct activity categories', async () => {
      const res = await request(app).get('/api/activities/categories').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(['Cycling', 'Running', 'Swimming']);
    });
  });
});
