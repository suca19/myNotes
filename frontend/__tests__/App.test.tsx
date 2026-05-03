import { render } from '@testing-library/react-native';

jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../navigation/RootNavigator', () => ({
  RootNavigator: () => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'mock-root-navigator' });
  },
}));

describe('App', () => {
  it('renders the authenticated app shell', () => {
    const App = require('../App').default;

    const { getByTestId } = render(<App />);

    expect(getByTestId('mock-root-navigator')).toBeTruthy();
  });
});