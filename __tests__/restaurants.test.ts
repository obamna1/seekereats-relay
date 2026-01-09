import request from 'supertest';
import app from '../src/app';

describe('Restaurants API', () => {
  describe('GET /restaurants', () => {
    it('should return a list of restaurants', async () => {
      const response = await request(app).get('/restaurants');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return restaurants with required fields', async () => {
      const response = await request(app).get('/restaurants');

      expect(response.status).toBe(200);

      if (response.body.data.length > 0) {
        const restaurant = response.body.data[0];
        expect(restaurant).toHaveProperty('id');
        expect(restaurant).toHaveProperty('name');
        expect(restaurant).toHaveProperty('address');
      }
    });
  });

  describe('GET /restaurants/:id', () => {
    it('should return 404 for non-existent restaurant', async () => {
      const response = await request(app).get('/restaurants/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    it('should return restaurant details for valid ID', async () => {
      // First get list to find a valid ID
      const listResponse = await request(app).get('/restaurants');

      if (listResponse.body.data.length > 0) {
        const validId = listResponse.body.data[0].id;
        const response = await request(app).get(`/restaurants/${validId}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', validId);
        expect(response.body.data).toHaveProperty('menu');
        expect(Array.isArray(response.body.data.menu)).toBe(true);
      }
    });
  });
});
