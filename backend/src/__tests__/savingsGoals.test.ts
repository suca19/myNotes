import request from 'supertest';
import type { Express } from 'express';

jest.mock('../lib/pool');
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(() => ({ userId: 1, email: 'test@test.com' })),
}));

import pool from '../lib/pool';

const poolMock = pool as jest.Mocked<typeof pool>;

describe('Savings Goals Endpoints', () => {
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

  describe('GET /api/savingsGoals', () => {
    it('returns all savings goals for authenticated user', async () => {
      const savingsGoals = [
        {
          id: 1,
          user_id: 1,
          name: 'Vacation Fund',
          target_amount: 5000,
          current_amount: 1500,
          target_date: '2026-12-31',
          notes: 'Summer vacation',
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          name: 'Emergency Fund',
          target_amount: 10000,
          current_amount: 8000,
          target_date: '2026-06-30',
          notes: 'Emergency savings',
          created_at: '2026-01-01T00:00:00Z',
        },
      ];

      poolMock.query.mockResolvedValueOnce({ rows: savingsGoals } as any);

      const response = await request(app)
        .get('/api/savingsGoals')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.goals).toEqual(savingsGoals);
    });

    it('requires authentication', async () => {
      const response = await request(app).get('/api/savingsGoals');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });

  describe('GET /api/savingsGoals/:id', () => {
    it('returns a single savings goal', async () => {
      const goal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 1500,
        target_date: '2026-12-31',
        notes: 'Summer vacation',
        created_at: '2026-01-01T00:00:00Z',
      };

      poolMock.query.mockResolvedValueOnce({ rows: [goal] } as any);

      const response = await request(app)
        .get('/api/savingsGoals/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.goal).toEqual(goal);
    });

    it('returns 404 if goal not found', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/savingsGoals/999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Savings goal not found');
    });

    it('validates goal id is a positive integer', async () => {
      const response = await request(app)
        .get('/api/savingsGoals/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/savingsGoals', () => {
    it('creates a new savings goal', async () => {
      const newGoal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 0,
        target_date: '2026-12-31',
        notes: 'Summer vacation',
        created_at: '2026-01-01T00:00:00Z',
      };

      poolMock.query.mockResolvedValueOnce({ rows: [newGoal] } as any);

      const response = await request(app)
        .post('/api/savingsGoals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Vacation Fund',
          target_amount: 5000,
          target_date: '2026-12-31',
          notes: 'Summer vacation',
        });

      expect(response.status).toBe(201);
      expect(response.body.goal).toEqual(newGoal);
    });

    it('sets current_amount to 0 if not provided', async () => {
      const newGoal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund',
        target_amount: 5000,
        current_amount: 0,
        target_date: '2026-12-31',
        notes: null,
        created_at: '2026-01-01T00:00:00Z',
      };

      poolMock.query.mockResolvedValueOnce({ rows: [newGoal] } as any);

      const response = await request(app)
        .post('/api/savingsGoals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Vacation Fund',
          target_amount: 5000,
          target_date: '2026-12-31',
        });

      expect(response.status).toBe(201);
      expect(response.body.goal.current_amount).toBe(0);
    });

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/savingsGoals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          target_amount: 5000,
          // missing name and target_date
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('validates target_amount is greater than 0', async () => {
      const response = await request(app)
        .post('/api/savingsGoals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Vacation Fund',
          target_amount: -5000,
          target_date: '2026-12-31',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('validates current_amount is non-negative', async () => {
      const response = await request(app)
        .post('/api/savingsGoals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Vacation Fund',
          target_amount: 5000,
          current_amount: -100,
          target_date: '2026-12-31',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('validates target_date is ISO8601', async () => {
      const response = await request(app)
        .post('/api/savingsGoals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Vacation Fund',
          target_amount: 5000,
          target_date: 'invalid-date',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/savingsGoals/:id', () => {
    it('updates an existing savings goal', async () => {
      const updatedGoal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund - Europe',
        target_amount: 7000,
        current_amount: 2000,
        target_date: '2027-12-31',
        notes: 'European vacation',
      };

      poolMock.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            name: 'Vacation Fund',
            target_amount: 5000,
            current_amount: 1500,
            target_date: '2026-12-31',
            notes: 'Summer vacation',
          },
        ],
      } as any);

      poolMock.query.mockResolvedValueOnce({ rows: [updatedGoal] } as any);

      const response = await request(app)
        .put('/api/savingsGoals/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Vacation Fund - Europe',
          target_amount: 7000,
          current_amount: 2000,
          target_date: '2027-12-31',
          notes: 'European vacation',
        });

      expect(response.status).toBe(200);
      expect(response.body.goal).toEqual(updatedGoal);
    });

    it('returns 404 if goal not found', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .put('/api/savingsGoals/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Savings goal not found');
    });

    it('allows partial updates', async () => {
      const partialUpdatedGoal = {
        id: 1,
        user_id: 1,
        name: 'Vacation Fund',
        target_amount: 6000,
        current_amount: 1500,
        target_date: '2026-12-31',
        notes: 'Summer vacation',
      };

      poolMock.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            name: 'Vacation Fund',
            target_amount: 5000,
            current_amount: 1500,
            target_date: '2026-12-31',
            notes: 'Summer vacation',
          },
        ],
      } as any);

      poolMock.query.mockResolvedValueOnce({ rows: [partialUpdatedGoal] } as any);

      const response = await request(app)
        .put('/api/savingsGoals/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          target_amount: 6000,
        });

      expect(response.status).toBe(200);
      expect(response.body.goal.target_amount).toBe(6000);
    });
  });

  describe('DELETE /api/savingsGoals/:id', () => {
    it('deletes a savings goal', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [{ id: 1 }] } as any);

      const response = await request(app)
        .delete('/api/savingsGoals/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Savings goal deleted successfully');
    });

    it('returns 404 if goal not found', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .delete('/api/savingsGoals/999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Savings goal not found');
    });

    it('requires authentication', async () => {
      const response = await request(app).delete('/api/savingsGoals/1');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });
});
