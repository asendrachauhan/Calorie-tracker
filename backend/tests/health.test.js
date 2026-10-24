const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {
  it('GET /api/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/non-existent returns 404 with structured error', async () => {
    const res = await request(app).get('/api/non-existent');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
