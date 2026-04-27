import request from 'supertest';
import type { Express } from 'express';

jest.mock('../lib/pool');
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(() => ({ userId: 1, email: 'test@test.com' })),
}));

import pool from '../lib/pool';

const poolMock = pool as jest.Mocked<typeof pool>;

describe('Expenses Endpoints', () => {
  let app: Express;
  const authToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSJ9.test';

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost/test';
    app = require('../app').default as Express;

    // Mock jwt.verify to return a valid user
    jest.mock('jsonwebtoken', () => ({
      verify: jest.fn(() => ({ userId: 1, email: 'test@test.com' })),
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/expenses', () => {
    it('returns all expenses for authenticated user', async () => {
      const expenses = [
        {
          id: 1,
          user_id: 1,
          amount: 50.5,
          place: 'Coffee Shop',
          category: 'Food',
          date: '2026-01-15',
          notes: 'Morning coffee',
          created_at: '2026-01-15T08:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          amount: 25.0,
          place: 'Gas Station',
          category: 'Transportation',
          date: '2026-01-16',
          notes: 'Gas',
          created_at: '2026-01-16T09:00:00Z',
        },
      ];

      poolMock.query.mockResolvedValueOnce({ rows: expenses } as any);

      const response = await request(app).get('/api/expenses').set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.expenses).toEqual(expenses);
      expect(poolMock.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM expenses'),
        expect.arrayContaining([1])
      );
    });

    it('requires authentication', async () => {
      const response = await request(app).get('/api/expenses');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });

  describe('POST /api/expenses', () => {
    it('creates a new expense', async () => {
      const newExpense = {
        id: 1,
        user_id: 1,
        amount: 50.5,
        place: 'Coffee Shop',
        category: 'Food',
        date: '2026-01-15',
        notes: 'Morning coffee',
        created_at: '2026-01-15T08:00:00Z',
      };

      poolMock.query.mockResolvedValueOnce({ rows: [newExpense] } as any);

      const response = await request(app).post('/api/expenses').set('Authorization', `Bearer ${authToken}`).send({
        amount: 50.5,
        place: 'Coffee Shop',
        category: 'Food',
        date: '2026-01-15',
        notes: 'Morning coffee',
      });

      expect(response.status).toBe(201);
      expect(response.body.expense).toEqual(newExpense);
      expect(poolMock.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO expenses'),
        expect.arrayContaining([1, 50.5, 'Coffee Shop', 'Food', '2026-01-15', 'Morning coffee'])
      );
    });

    it('validates amount is greater than 0', async () => {
      const response = await request(app).post('/api/expenses').set('Authorization', `Bearer ${authToken}`).send({
        amount: -10,
        place: 'Coffee Shop',
        category: 'Food',
        date: '2026-01-15',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('validates required fields', async () => {
      const response = await request(app).post('/api/expenses').set('Authorization', `Bearer ${authToken}`).send({
        amount: 50.5,
        // missing place, category, date
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('validates date is ISO8601', async () => {
      const response = await request(app).post('/api/expenses').set('Authorization', `Bearer ${authToken}`).send({
        amount: 50.5,
        place: 'Coffee Shop',
        category: 'Food',
        date: 'invalid-date',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/expenses/:id', () => {
    it('updates an existing expense', async () => {
      const updatedExpense = {
        id: 1,
        user_id: 1,
        amount: 75.0,
        place: 'Fancy Coffee Shop',
        category: 'Food',
        date: '2026-01-15',
        notes: 'Updated note',
      };

      poolMock.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            amount: 50.5,
            place: 'Coffee Shop',
            category: 'Food',
            date: '2026-01-15',
            notes: 'Morning coffee',
          },
        ],
      } as any);

      poolMock.query.mockResolvedValueOnce({ rows: [updatedExpense] } as any);

      const response = await request(app)
        .put('/api/expenses/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 75.0,
          place: 'Fancy Coffee Shop',
          notes: 'Updated note',
        });

      expect(response.status).toBe(200);
      expect(response.body.expense).toEqual(updatedExpense);
    });

    it('returns 404 if expense not found', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .put('/api/expenses/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 75.0,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Expense not found');
    });

    it('validates expense id is a positive integer', async () => {
      const response = await request(app)
        .put('/api/expenses/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 75.0,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    it('deletes an expense', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1 }] } as any);

      const response = await request(app)
        .delete('/api/expenses/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Expense deleted successfully');
    });

    it('returns 404 if expense not found', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .delete('/api/expenses/999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Expense not found');
    });

    it('requires authentication', async () => {
      const response = await request(app).delete('/api/expenses/1');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });
});
