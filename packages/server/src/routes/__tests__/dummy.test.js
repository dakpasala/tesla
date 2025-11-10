const request = require('supertest');

let app;

beforeAll(async () => {
  ({ default: app } = await import('../../index.js'));
});

describe('Dummy API Routes', () => {
  describe('GET /api/dummy', () => {
    it('should return 200 and list of dummy', async () => {
      const response = await request(app)
        .get('/api/dummy')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
