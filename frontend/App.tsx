import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './contexts/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </>
  );
}