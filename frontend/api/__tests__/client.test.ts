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
});