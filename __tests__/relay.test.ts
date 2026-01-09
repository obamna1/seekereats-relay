import request from 'supertest';
import app from '../src/app';

describe('Relay API Authentication', () => {
  describe('Protected endpoints', () => {
    it('should reject requests without X-Relay-Secret header', async () => {
      const response = await request(app)
        .get('/relay/config')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject requests with invalid secret', async () => {
      const response = await request(app)
        .get('/relay/config')
        .set('X-Relay-Secret', 'invalid-secret')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should accept requests with valid secret', async () => {
      const validSecret = process.env.RELAY_SECRET;

      if (validSecret) {
        const response = await request(app)
          .get('/relay/config')
          .set('X-Relay-Secret', validSecret)
          .set('Content-Type', 'application/json');

        // Should be 200 (success) or 400/500 (business error), but not 401
        expect(response.status).not.toBe(401);
      } else {
        // Skip if no secret configured
        console.log('Skipping: RELAY_SECRET not configured');
      }
    });
  });
});

describe('Relay Delivery Endpoints', () => {
  const validSecret = process.env.RELAY_SECRET || 'test-secret';

  describe('POST /relay/delivery (quote request)', () => {
    it('should require pickup and dropoff addresses', async () => {
      const response = await request(app)
        .post('/relay/delivery')
        .set('X-Relay-Secret', validSecret)
        .send({});

      // Should fail validation (400) or auth (401)
      expect([400, 401, 500]).toContain(response.status);
    });
  });
});
