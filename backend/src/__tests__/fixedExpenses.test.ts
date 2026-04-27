import request from 'supertest';
import type { Express } from 'express';

jest.mock('../lib/pool');
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(() => ({ userId: 1, email: 'test@test.com' })),
}));

import pool from '../lib/pool';

const poolMock = pool as jest.Mocked<typeof pool>;

describe('Fixed Expenses Endpoints', () => {
  let app: Express;
  const authToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSJ9.test';

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost/test';
    app = require('../app').default as Express;

    jest.mock('jsonwebtoken', () => ({
      verify: jest.fn(() => ({ userId: 1, email: 'test@test.com' })),
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/fixed-expenses', () => {
    it('returns all fixed expenses for authenticated user', async () => {
      const fixedExpenses = [
        {
          id: 1,
          user_id: 1,
          name: 'Netflix',
          amount: 15.99,
          frequency: 'monthly',
          category: 'Entertainment',
          due_day: 1,
          notes: 'Streaming service',
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          name: 'Gym Membership',
          amount: 50.0,
          frequency: 'monthly',
          category: 'Health',
          due_day: 15,
          notes: 'Monthly gym fee',
          created_at: '2026-01-01T00:00:00Z',
        },
      ];

      poolMock.query.mockResolvedValueOnce({ rows: fixedExpenses } as any);

      const response = await request(app)
        .get('/api/fixed-expenses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.fixedExpenses).toEqual(fixedExpenses);
    });

    it('requires authentication', async () => {
      const response = await request(app).get('/api/fixed-expenses');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });

  describe('POST /api/fixed-expenses', () => {
    it('creates a new fixed expense', async () => {
      const newFixedExpense = {
        id: 1,
        user_id: 1,
        name: 'Netflix',
        amount: 15.99,
        frequency: 'monthly',
        category: 'Entertainment',
        due_day: 1,
        notes: 'Streaming service',
        created_at: '2026-01-01T00:00:00Z',
      };

      poolMock.query.mockResolvedValueOnce({ rows: [newFixedExpense] } as any);

      const response = await request(app)
        .post('/api/fixed-expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Netflix',
          amount: 15.99,
          frequency: 'monthly',
          category: 'Entertainment',
          due_day: 1,
          notes: 'Streaming service',
        });

      expect(response.status).toBe(201);
      expect(response.body.fixedExpense).toEqual(newFixedExpense);
    });

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/fixed-expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 15.99,
          // missing name, frequency, category, due_day
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('validates amount is greater than 0', async () => {
      const response = await request(app)
        .post('/api/fixed-expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Netflix',
          amount: -10,
          frequency: 'monthly',
          category: 'Entertainment',
          due_day: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('validates frequency is one of allowed values', async () => {
      const response = await request(app)
        .post('/api/fixed-expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Netflix',
          amount: 15.99,
          frequency: 'invalid-frequency',
          category: 'Entertainment',
          due_day: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('validates due_day is between 1 and 31', async () => {
      const response = await request(app)
        .post('/api/fixed-expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Netflix',
          amount: 15.99,
          frequency: 'monthly',
          category: 'Entertainment',
          due_day: 32,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/fixed-expenses/:id', () => {
    it('updates an existing fixed expense', async () => {
      const updatedFixedExpense = {
        id: 1,
        user_id: 1,
        name: 'Netflix Premium',
        amount: 19.99,
        frequency: 'monthly',
        category: 'Entertainment',
        due_day: 5,
        notes: 'Premium streaming',
      };

      poolMock.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            name: 'Netflix',
            amount: 15.99,
            frequency: 'monthly',
            category: 'Entertainment',
            due_day: 1,
            notes: 'Streaming service',
          },
        ],
      } as any);

      poolMock.query.mockResolvedValueOnce({ rows: [updatedFixedExpense] } as any);

      const response = await request(app)
        .put('/api/fixed-expenses/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Netflix Premium',
          amount: 19.99,
          due_day: 5,
          notes: 'Premium streaming',
        });

      expect(response.status).toBe(200);
      expect(response.body.fixedExpense).toEqual(updatedFixedExpense);
    });

    it('returns 404 if fixed expense not found', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .put('/api/fixed-expenses/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Netflix Premium',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Fixed expense not found');
    });
  });

  describe('DELETE /api/fixed-expenses/:id', () => {
    it('deletes a fixed expense', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1 }] } as any);

      const response = await request(app)
        .delete('/api/fixed-expenses/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Fixed expense deleted successfully');
    });

    it('returns 404 if fixed expense not found', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .delete('/api/fixed-expenses/999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Fixed expense not found');
    });

    it('requires authentication', async () => {
      const response = await request(app).delete('/api/fixed-expenses/1');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });
});
