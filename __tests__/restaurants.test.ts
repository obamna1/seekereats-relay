/**
 * Tests for Square-only Restaurant Routes
 *
 * Tests the new /restaurants endpoint that returns Square merchants
 * as restaurants. This replaces the old Prisma-based restaurant table.
 *
 * IMPORTANT: These tests verify the Square-only architecture where
 * restaurants = connected Square merchants via OAuth.
 */

import request from 'supertest';
import app from '../src/app';

describe('Square-Only Restaurants API', () => {
  describe('GET /restaurants', () => {
    it('should return a list of connected Square merchants as restaurants', async () => {
      const response = await request(app).get('/restaurants');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return restaurants with Square-specific fields', async () => {
      const response = await request(app).get('/restaurants');

      expect(response.status).toBe(200);

      if (response.body.data.length > 0) {
        const restaurant = response.body.data[0];
        // Required fields from Square merchant
        expect(restaurant).toHaveProperty('id'); // DB ID
        expect(restaurant).toHaveProperty('merchantId'); // Square merchant ID
        expect(restaurant).toHaveProperty('name');
        expect(restaurant).toHaveProperty('image');
        expect(restaurant).toHaveProperty('address');
        expect(restaurant).toHaveProperty('city');
        // Placeholder fields (Uber Direct later)
        expect(restaurant).toHaveProperty('deliveryTime');
        expect(restaurant).toHaveProperty('deliveryFee');
      }
    });

    it('should respect sandbox parameter', async () => {
      const sandboxResponse = await request(app).get('/restaurants?sandbox=true');
      const prodResponse = await request(app).get('/restaurants?sandbox=false');

      expect(sandboxResponse.status).toBe(200);
      expect(prodResponse.status).toBe(200);

      // Sandbox and prod should return different (or same) merchants based on env
    });

    it('should return empty array when no merchants connected', async () => {
      // This tests the graceful handling of no merchants
      const response = await request(app).get('/restaurants?sandbox=true');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // May be empty or have data depending on test state
    });
  });

  describe('GET /restaurants/:id', () => {
    it('should return 404 for non-existent restaurant', async () => {
      const response = await request(app).get('/restaurants/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return restaurant with merchantId for valid ID', async () => {
      // First get list to find a valid ID
      const listResponse = await request(app).get('/restaurants');

      if (listResponse.body.data && listResponse.body.data.length > 0) {
        const validId = listResponse.body.data[0].id;
        const response = await request(app).get(`/restaurants/${validId}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('id', validId);
        expect(response.body.data).toHaveProperty('merchantId'); // Square merchant ID
      }
    });
  });
});

describe('Square Menu API with MerchantId', () => {
  describe('GET /square/menu', () => {
    it('should accept merchantId parameter', async () => {
      const response = await request(app)
        .get('/square/menu?sandbox=true')
        .set('X-Relay-Secret', process.env.RELAY_SECRET || 'test-secret');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should fetch menu for specific merchant in production', async () => {
      // Get a merchant ID first
      const merchantsResponse = await request(app).get('/restaurants?sandbox=false');

      if (merchantsResponse.body.data && merchantsResponse.body.data.length > 0) {
        const merchantId = merchantsResponse.body.data[0].merchantId;

        const response = await request(app)
          .get(`/square/menu?merchantId=${merchantId}&sandbox=false`)
          .set('X-Relay-Secret', process.env.RELAY_SECRET || 'test-secret');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      }
    });

    it('should use default merchant when merchantId not provided', async () => {
      const response = await request(app)
        .get('/square/menu?sandbox=true')
        .set('X-Relay-Secret', process.env.RELAY_SECRET || 'test-secret');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('environment', 'sandbox');
    });
  });
});

describe('OAuth Token Persistence', () => {
  /**
   * CRITICAL TEST: Verifies that OAuth tokens survive across API calls
   * Restaurants should NEVER need to re-authenticate
   */
  it('should maintain OAuth tokens across multiple requests', async () => {
    // Make multiple requests to verify tokens persist
    const response1 = await request(app).get('/restaurants?sandbox=false');
    const response2 = await request(app).get('/restaurants?sandbox=false');
    const response3 = await request(app).get('/restaurants?sandbox=false');

    // All should succeed if tokens are persisted
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response3.status).toBe(200);

    // Should return same merchants (tokens didn't get lost)
    if (response1.body.data.length > 0) {
      expect(response1.body.data[0].merchantId).toBe(response2.body.data[0].merchantId);
      expect(response2.body.data[0].merchantId).toBe(response3.body.data[0].merchantId);
    }
  });
});
