const mockRequestHandlers: Array<{ fulfilled?: (config: any) => any }> = [];

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      interceptors: {
        request: {
          handlers: mockRequestHandlers,
          use: jest.fn((fulfilled) => {
            mockRequestHandlers.push({ fulfilled });
            return mockRequestHandlers.length - 1;
          }),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

describe('api client', () => {
  beforeEach(() => {
    jest.resetModules();
    mockRequestHandlers.length = 0;
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  it('uses the default base url when no environment variable is set', () => {
    const client = require('../client') as typeof import('../client');

    expect(client.getApiBaseUrl()).toBe('http://localhost:3000/api');
  });

  it('trims trailing slashes and adds the auth header when a token is set', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com/api/';

    const client = require('../client') as typeof import('../client');
    client.setAuthToken('abc123');

    const interceptor = (client.default.interceptors.request as { handlers: Array<{ fulfilled?: (config: any) => any }> }).handlers[0]?.fulfilled;
    const config = interceptor?.({ headers: {} });

    expect(client.getApiBaseUrl()).toBe('https://example.com/api');
    expect(config.headers.Authorization).toBe('Bearer abc123');

    client.clearAuthToken();
    const clearedConfig = interceptor?.({ headers: {} });

    expect(clearedConfig.headers.Authorization).toBeUndefined();
  });

  describe('Auth endpoints', () => {
    it('should call sign up endpoint', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.signUp).toBe('function');
    });

    it('should call sign in endpoint', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.signIn).toBe('function');
    });
  });

  describe('Expense endpoints', () => {
    it('should have getExpenses function', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.getExpenses).toBe('function');
    });

    it('should have createExpense function', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.createExpense).toBe('function');
    });

    it('should have updateExpense function', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.updateExpense).toBe('function');
    });

    it('should have deleteExpense function', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.deleteExpense).toBe('function');
    });
  });

  describe('Goals endpoints', () => {
    it('should have getGoals function', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.getGoals).toBe('function');
    });

    it('should have createGoal function', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.createGoal).toBe('function');
    });

    it('should have deleteGoal function', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.deleteGoal).toBe('function');
    });
  });

  describe('Reports endpoints', () => {
    it('should have getReportSummary function', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.getReportSummary).toBe('function');
    });

    it('should have getReportByCategory function', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.getReportByCategory).toBe('function');
    });

    it('should have getReportMonthly function', () => {
      const client = require('../client') as typeof import('../client');
      expect(typeof client.getReportMonthly).toBe('function');
    });
  });
});