import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import authenticateToken from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validate';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
  },
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const verifyMock = jwt.verify as jest.Mock;
const validationResultMock = validationResult as jest.Mock;

function createResponse() {
  const res = {} as Response & { status: jest.Mock; json: jest.Mock };

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);

  return res;
}

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('rejects missing auth tokens', () => {
    const req = { headers: {} } as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid bearer tokens', () => {
    const req = { headers: { authorization: 'Bearer valid-token' } } as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    verifyMock.mockReturnValue({ userId: 1, email: 'user@example.com' });

    authenticateToken(req, res, next);

    expect(verifyMock).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(req.user).toEqual({ userId: 1, email: 'user@example.com' });
    expect(next).toHaveBeenCalled();
  });

  it('formats validation errors', () => {
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    validationResultMock.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ type: 'field', path: 'email', msg: 'Invalid email' }],
    });

    handleValidationErrors(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: [{ field: 'email', message: 'Invalid email' }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('passes when validation succeeds', () => {
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    validationResultMock.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    handleValidationErrors(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns a 404 response for unknown routes', () => {
    const req = {} as Request;
    const res = createResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Route not found' });
  });

  it('returns a generic error response', () => {
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    errorHandler(new Error('boom'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error', message: 'boom' });

    consoleErrorSpy.mockRestore();
  });
});