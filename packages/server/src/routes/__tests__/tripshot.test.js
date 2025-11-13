const request = require('supertest');

let app;

beforeAll(async () => {
  const imported = await import('../../index.js');
  app = imported.default;
});

describe('TripShot API Endpoints', () => {
  describe('POST /tripshot/commutePlan', () => {
    it('200 = success', async () => {
      const res = await request(app).post('/tripshot/commutePlan').query({
        day: '2025-10-30',
        time: '10:56 AM',
        timezone: 'Pacific',
        startLat: 37.4113397,
        startLng: -122.1476391,
        startName: '1501 Page Mill',
        endLat: 37.3945701,
        endLng: -122.1501086,
        endName: '3500 Deer Creek',
        travelMode: 'Walking',
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);

      //sample mock data fields required to have in the response
      expect(res.body).toHaveProperty('startPoint');
      expect(res.body).toHaveProperty('endPoint');
      expect(res.body).toHaveProperty('options');
      expect(Array.isArray(res.body.options)).toBe(true);
      if (res.body.options.length > 0) {
        const first = res.body.options[0];
        expect(first).toHaveProperty('arrivalStopId');
        expect(first).toHaveProperty('departureStopId');
      }
    });

    it('returns 400 = error when required query parameters are missing', async () => {
      const res = await request(app).post('/tripshot/commutePlan').query({});
      expect([400, 422]).toContain(res.statusCode);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /tripshot/liveStatus', () => {
    it('returns 200', async () => {
      const res = await request(app)
        .post('/tripshot/liveStatus')
        .query({
          rideIds: [
            '1ca7a65e-88f0-4505-a28e-fe7130c341a9:2025-10-30',
            '7f6df240-d2e1-4fa1-b203-6037f8a61d66:2025-10-30',
          ],
        });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toHaveProperty('rides');
      expect(Array.isArray(res.body.rides)).toBe(true);
      if (res.body.rides.length > 0) {
        const ride = res.body.rides[0];
        //matches  mock data that I simplified
        expect(ride).toHaveProperty('rideId');
        expect(ride).toHaveProperty('routeId');
        expect(ride).toHaveProperty('stopStatus');
      }
    });

    it('returns 400 when rideIds invalid (missing)', async () => {
      const res = await request(app).post('/tripshot/liveStatus').query({});
      expect([400, 422]).toContain(res.statusCode);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toHaveProperty('error');
    });
  });
});
