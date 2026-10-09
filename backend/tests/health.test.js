import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/ecommerce-test';
process.env.JWT_SECRET = 'test-secret';

const { app } = await import('../server.js');

test('GET /api/health returns application status', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, 'E-Commerce API is healthy');
  assert.match(response.body.version, /^\d+\.\d+\.\d+$/);
});
