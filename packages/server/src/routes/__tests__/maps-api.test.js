
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';


// mock directions API module
vi.mock('../../maps-api/directions.js', () => ({
  getDirections: vi.fn(),
  getAllTransportOptions: vi.fn(),
}));

console.log('Mocked?', getDirections.mock);

import request from 'supertest';
import express from 'express';
import { getAllTransportOptions, getDirections } from '../../maps-api/directions.js';
import mapsRouter from '../maps.js';

const app = express();
app.use(express.json());
app.use('/api/maps', mapsRouter);


//test for directions endpoint
describe('GET /api/maps/directions', () => {
  it('returns the different directions from getDirections', async () => {
    getDirections.mockResolvedValue([
      { summary: 'I-5 S', distance: '121 mi', duration: '2 hours', polyline: 'abcd' },
    ]);

    const res = await request(app)
      .get('/api/maps/directions?origin=Seattle&destination=Portland')
      .expect(200);

    expect(getDirections).toHaveBeenCalledWith('Seattle', 'Portland', 'driving');
    expect(res.body[0].summary).toBe('I-5 S');
  });

  it('returns 500 if getDirections throws', async () => {
    getDirections.mockRejectedValue(new Error('API failure'));

    const res = await request(app)
      .get('/api/maps/directions?origin=LA&destination=SF')
      .expect(500);

    expect(res.body.error).toBe('API failure');
  });
});


describe('GET /api/maps/routes', () => {
	it('returns data from getAllTransportOptions', async () => {
		const fakeRoutes = {
			driving: [
				{ summary: 'Route 1', distance: '10 mi', duration: '15 mins' },
				{ summary: 'Route 2', distance: '12 mi', duration: '18 mins' },
			],
			bicycling: [
				{ summary: 'Bike Path', distance: '9 mi', duration: '40 mins' },
			],
			walking: [
				{ summary: 'Walk Path', distance: '8 mi', duration: '2 hours' },
			],
			transit: [
				{ summary: 'Bus 22', distance: '11 mi', duration: '45 mins' },
			],
		};

		getAllTransportOptions.mockResolvedValue(fakeRoutes);

		const res = await request(app)
			.get('/api/maps/routes?origin=Cupertino,CA&destination=Palo%20Alto,CA')
			.expect(200)

		expect(getAllTransportOptions).toHaveBeenCalledWith('Cupertino,CA', 'Palo Alto,CA');
		
		expect(res.body).toHaveProperty('driving');
		expect(Array.isArray(res.body.driving)).toBe(true);
		expect(res.body.driving[0]).toHaveProperty('summary');
		expect(res.body.driving[0]).toHaveProperty('distance');
		expect(res.body.driving[0]).toHaveProperty('duration');

		expect(res.body).toHaveProperty('transit');
		expect(Array.isArray(res.body.transit)).toBe(true);
		expect(res.body.transit[0]).toHaveProperty('summary');
		expect(res.body.transit[0]).toHaveProperty('distance');
		expect(res.body.transit[0]).toHaveProperty('duration');

	});

	it('returns 500 if getDirections throws', async () => {
		getAllTransportOptions.mockRejectedValue(new Error('API failure'));

		const res = await request(app)
		.get('/api/maps/routes?origin=Cupertino,CA&destination=Palo%20Alto,CA')
		.expect(500);

		expect(res.body.error).toBe('API failure');
	});
});


//test for invalid address --> negative test
describe('Get /api/maps/directions', () => {
    it('returns nothing from getDirections because of invalid route', async () =>{
        getDirections.mockResolvedValue({
	    "error": "API Error: ZERO_RESULTS - No error message"
        });

        const res = await request(app)
            .get('/api/maps/directions?origin=SanLuisObispo,CA&destination=Paris,France')
            .expect(200)

        expect(getDirections).toHaveBeenCalledWith('SanLuisObispo,CA', 'Paris,France', 'driving');
        expect(res.body.error).toBe('API Error: ZERO_RESULTS - No error message');
    });

    it('returns 500 if getDirections throws', async () => {
        getDirections.mockRejectedValue(new Error('API failure'));

        const res = await request(app)
            .get('/api/maps/directions?origin=SanLuisObispo,CA&destination=Paris,France')
            .expect(500)

        expect(res.body.error).toBe('API failure');
    });

});



describe('GET /api/maps/directions', () => {
	it('returns data from getDirections', async () => {
    	const fakeDirections = [
    		{ summary: 'Route 1', distance: '10 mi', duration: '15 mins' },
      		{ summary: 'Route 2', distance: '12 mi', duration: '18 mins' },
    	];

		//just getting the directions that the API would get --> no need to copy Insomnia
		getDirections.mockResolvedValue(fakeDirections);

		const res = await request(app)
            .get('/api/maps/directions?origin=2490%20Louis%20Rd%2C%20Palo%20Alto%2C%20CA%2094303&destination=Tesla%20HQ%2C%203500%20Deer%20Creek%20Rd%2C%20Palo%20Alto%2C%20CA%2094304')
            .expect(200)

		expect(getDirections).toHaveBeenCalledWith('2490 Louis Rd, Palo Alto, CA 94303', 'Tesla HQ, 3500 Deer Creek Rd, Palo Alto, CA 94304', 'driving');

		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body).toHaveLength(2);
		expect(res.body[0]).toHaveProperty('summary');
		expect(res.body[0]).toHaveProperty('distance');
		expect(res.body[0]).toHaveProperty('duration');
	});

	it('returns 500 if getDirections throws', async () => {
		getDirections.mockRejectedValue(new Error('API failure'));

		const res = await request(app)
		.get('/api/maps/directions?origin=Home&destination=Work')
		.expect(500);

		expect(res.body.error).toBe('API failure');
	});
});
