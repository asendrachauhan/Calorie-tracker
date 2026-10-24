const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./test-db');
const Food = require('../src/models/Food');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  await Food.create([
    { foodId: 101, name: 'Apple Raw', foodGroup: 'Fruits', calories: 52, servingDescription: '1 medium (182g)', fat: 0.2, protein: 0.3, carbohydrate: 14 },
    { foodId: 102, name: 'Apple Pie', foodGroup: 'Baked Foods', calories: 237, servingDescription: '1 slice (125g)', fat: 11, protein: 1.9, carbohydrate: 34 },
    { foodId: 103, name: 'Banana Raw', foodGroup: 'Fruits', calories: 89, servingDescription: '1 medium (118g)', fat: 0.3, protein: 1.1, carbohydrate: 23 },
    { foodId: 104, name: 'Grilled Chicken Breast', foodGroup: 'Poultry', calories: 165, servingDescription: '100g', fat: 3.6, protein: 31, carbohydrate: 0 }
  ]);
});

describe('Food API - Search and Lookup', () => {
  describe('GET /api/foods', () => {
    it('returns all foods up to limit when no search filter provided', async () => {
      const res = await request(app).get('/api/foods').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(4);
      expect(res.body.count).toBe(4);
    });

    it('filters foods by search text case-insensitively', async () => {
      const res = await request(app).get('/api/foods?search=apple').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every(f => f.name.toLowerCase().includes('apple'))).toBe(true);
    });

    it('filters foods by food group', async () => {
      const res = await request(app).get('/api/foods?group=Fruits').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every(f => f.foodGroup === 'Fruits')).toBe(true);
    });

    it('filters foods by both search text and group', async () => {
      const res = await request(app).get('/api/foods?search=apple&group=Baked%20Foods').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].foodId).toBe(102);
    });

    it('respects the limit query parameter (bounded results)', async () => {
      const res = await request(app).get('/api/foods?limit=2').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/foods/groups', () => {
    it('returns sorted distinct food groups', async () => {
      const res = await request(app).get('/api/foods/groups').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(['Baked Foods', 'Fruits', 'Poultry']);
    });
  });

  describe('GET /api/foods/:foodId', () => {
    it('returns a food item by numeric foodId', async () => {
      const res = await request(app).get('/api/foods/101').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Apple Raw');
      expect(res.body.data.calories).toBe(52);
    });

    it('returns 404 when foodId does not exist', async () => {
      const res = await request(app).get('/api/foods/99999').expect(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 when foodId is not a number', async () => {
      const res = await request(app).get('/api/foods/abc').expect(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });
});
