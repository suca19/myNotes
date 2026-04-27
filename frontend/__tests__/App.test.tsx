import { render, waitFor } from '@testing-library/react-native';
import App from '../App';
import { healthCheck } from '../api/client';

jest.mock('../api/client', () => ({
  healthCheck: jest.fn(),
}));

const mockedHealthCheck = healthCheck as jest.MockedFunction<typeof healthCheck>;

describe('App', () => {
  beforeEach(() => {
    mockedHealthCheck.mockReset();
  });

  it('renders the backend status after a successful health check', async () => {
    mockedHealthCheck.mockResolvedValue({ data: { message: 'Backend is running!' } } as never);

    const { getByText } = render(<App />);

    await waitFor(() => {
      expect(getByText('✅ Connected: Backend is running!')).toBeTruthy();
    });
  });

  it('shows the disconnected state when the request fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedHealthCheck.mockRejectedValue(new Error('offline'));

    const { getByText } = render(<App />);

    await waitFor(() => {
      expect(getByText('❌ Backend not connected')).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });
});