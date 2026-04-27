import request from 'supertest';
import type { Express } from 'express';

describe('Backend health endpoint', () => {
  let app: Express;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

    app = require('../app').default as Express;
  });

  it('returns 200 with status OK', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'OK' });
  });
});
