import request from 'supertest';

let app;

beforeAll(async () => {
  ({ default: app } = await import('../../index.js'));
});

describe('Dummy API Routes', () => {
  describe('GET /api/users', () => {
    it('returns the health status payload', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        message: 'Dummy API is working',
      });
    });
  });

  describe('GET /api/users/data', () => {
    it('returns the dummy data payload', async () => {
      const response = await request(app)
        .get('/api/users/data')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Hello from dummy API!',
        version: '1.0.0',
      });
      expect(typeof response.body.timestamp).toBe('string');
    });
  });

  describe('POST /api/users/echo', () => {
    it('echoes the provided message', async () => {
      const payload = { message: 'Full Self-Driving' };

      const response = await request(app)
        .post('/api/users/echo')
        .send(payload)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.echo).toBe(payload.message);
      expect(typeof response.body.receivedAt).toBe('string');
    });

    it('returns 400 when message is missing', async () => {
      const response = await request(app)
        .post('/api/users/echo')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({ error: 'Message is required' });
    });
  });

  describe('GET /api/users/error', () => {
    it('returns 500 using the global error handler', async () => {
      const response = await request(app)
        .get('/api/users/error')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({ error: 'Something went wrong!' });
    });
  });
});
