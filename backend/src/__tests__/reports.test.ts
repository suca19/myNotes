import request from 'supertest';
import type { Express } from 'express';

jest.mock('../lib/pool');
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(() => ({ userId: 1, email: 'test@test.com' })),
}));

import pool from '../lib/pool';

const poolMock = pool as jest.Mocked<typeof pool>;

describe('Reports Endpoints', () => {
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

  describe('GET /api/reports/summary', () => {
    it('returns expense summary', async () => {
      poolMock.query
        .mockResolvedValueOnce({ rows: [{ total: '2500.50' }] } as any) // total spent
        .mockResolvedValueOnce({ rows: [{ total: '500.25' }] } as any) // current month
        .mockResolvedValueOnce({ rows: [{ count: '25' }] } as any); // total count

      const response = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        totalSpent: 2500.5,
        currentMonthSpent: 500.25,
        totalExpenses: 25,
      });
    });

    it('returns zeros when no expenses', async () => {
      poolMock.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '0' }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any);

      const response = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalSpent).toBe(0);
      expect(response.body.currentMonthSpent).toBe(0);
      expect(response.body.totalExpenses).toBe(0);
    });

    it('requires authentication', async () => {
      const response = await request(app).get('/api/reports/summary');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });

  describe('GET /api/reports/by-category', () => {
    it('returns expenses grouped by category', async () => {
      const categories = [
        {
          category: 'Food',
          total: '500.00',
          count: '15',
        },
        {
          category: 'Transportation',
          total: '300.00',
          count: '5',
        },
        {
          category: 'Entertainment',
          total: '200.00',
          count: '8',
        },
      ];

      poolMock.query.mockResolvedValueOnce({ rows: categories } as any);

      const response = await request(app)
        .get('/api/reports/by-category')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.categories).toEqual(categories);
      expect(poolMock.query).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY category'),
        expect.arrayContaining([1])
      );
    });

    it('returns empty array when no expenses', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/reports/by-category')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.categories).toEqual([]);
    });

    it('returns categories sorted by total descending', async () => {
      const categories = [
        { category: 'Food', total: '500.00', count: '15' },
        { category: 'Transportation', total: '300.00', count: '5' },
        { category: 'Entertainment', total: '200.00', count: '8' },
      ];

      poolMock.query.mockResolvedValueOnce({ rows: categories } as any);

      const response = await request(app)
        .get('/api/reports/by-category')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // Verify results are in descending order by total
      expect(Number(response.body.categories[0].total)).toBeGreaterThanOrEqual(
        Number(response.body.categories[1].total)
      );
    });

    it('requires authentication', async () => {
      const response = await request(app).get('/api/reports/by-category');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });

  describe('GET /api/reports/monthly', () => {
    it('returns monthly expense data for last 5 months', async () => {
      const monthlyData = [
        {
          month: '2025-09-01T00:00:00Z',
          total: '400.00',
          count: '10',
        },
        {
          month: '2025-10-01T00:00:00Z',
          total: '450.00',
          count: '12',
        },
        {
          month: '2025-11-01T00:00:00Z',
          total: '500.00',
          count: '15',
        },
        {
          month: '2025-12-01T00:00:00Z',
          total: '550.00',
          count: '18',
        },
        {
          month: '2026-01-01T00:00:00Z',
          total: '600.00',
          count: '20',
        },
      ];

      poolMock.query.mockResolvedValueOnce({ rows: monthlyData } as any);

      const response = await request(app)
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.monthlyData).toEqual(monthlyData);
      expect(response.body.monthlyData.length).toBe(5);
    });

    it('returns empty array when no expenses', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.monthlyData).toEqual([]);
    });

    it('returns data sorted by month ascending', async () => {
      const monthlyData = [
        { month: '2025-11-01T00:00:00Z', total: '500.00', count: '15' },
        { month: '2025-12-01T00:00:00Z', total: '550.00', count: '18' },
        { month: '2026-01-01T00:00:00Z', total: '600.00', count: '20' },
      ];

      poolMock.query.mockResolvedValueOnce({ rows: monthlyData } as any);

      const response = await request(app)
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // Verify results are in ascending order by month
      for (let i = 0; i < response.body.monthlyData.length - 1; i++) {
        const currentMonth = new Date(response.body.monthlyData[i].month);
        const nextMonth = new Date(response.body.monthlyData[i + 1].month);
        expect(currentMonth.getTime()).toBeLessThanOrEqual(nextMonth.getTime());
      }
    });

    it('handles zero totals correctly', async () => {
      const monthlyData = [{ month: '2026-01-01T00:00:00Z', total: '0', count: '0' }];

      poolMock.query.mockResolvedValueOnce({ rows: monthlyData } as any);

      const response = await request(app)
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.monthlyData[0].total).toBe('0');
      expect(response.body.monthlyData[0].count).toBe('0');
    });

    it('requires authentication', async () => {
      const response = await request(app).get('/api/reports/monthly');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });
});
