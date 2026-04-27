import request from 'supertest';
import type { Express } from 'express';

jest.mock('../lib/pool');
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(() => ({ userId: 1, email: 'test@test.com' })),
  sign: jest.fn(() => 'mock-token'),
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

import pool from '../lib/pool';

const poolMock = pool as jest.Mocked<typeof pool>;

describe('Auth Endpoints', () => {
  let app: Express;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost/test';
    app = require('../app').default as Express;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('creates a new user and returns a token', async () => {
      const newUser = {
        id: 1,
        email: 'testuser@example.com',
        created_at: new Date().toISOString(),
      };

      poolMock.query.mockResolvedValueOnce({ rows: [] } as any);
      poolMock.query.mockResolvedValueOnce({ rows: [newUser] } as any);

      const response = await request(app).post('/api/auth/signup').send({
        email: 'testuser@example.com',
        password: 'SecurePass123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toEqual({
        id: newUser.id,
        email: newUser.email,
      });
    });

    it('rejects duplicate email registration', async () => {
      poolMock.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'existing@example.com' }],
      } as any);

      const response = await request(app).post('/api/auth/signup').send({
        email: 'existing@example.com',
        password: 'SecurePass123',
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email already registered');
    });

    it('validates email format', async () => {
      const response = await request(app).post('/api/auth/signup').send({
        email: 'invalid-email',
        password: 'SecurePass123',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('validates password length', async () => {
      const response = await request(app).post('/api/auth/signup').send({
        email: 'testuser@example.com',
        password: 'short',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/signin', () => {
    it('authenticates user and returns a token', async () => {
      const user = {
        id: 1,
        email: 'testuser@example.com',
        password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMye', // bcrypt hash
      };

      poolMock.query.mockResolvedValueOnce({ rows: [user] } as any);

      const response = await request(app).post('/api/auth/signin').send({
        email: 'testuser@example.com',
        password: 'SecurePass123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(user.email);
    });

    it('rejects non-existent user', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app).post('/api/auth/signin').send({
        email: 'nonexistent@example.com',
        password: 'SecurePass123',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('normalizes email to lowercase', async () => {
      const user = {
        id: 1,
        email: 'testuser@example.com',
        password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMye',
      };

      poolMock.query.mockResolvedValueOnce({ rows: [user] } as any);

      const response = await request(app).post('/api/auth/signin').send({
        email: 'TestUser@Example.COM',
        password: 'SecurePass123',
      });

      expect(response.status).toBe(200);
      expect(poolMock.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email'),
        expect.arrayContaining(['testuser@example.com'])
      );
    });
  });
});
