import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, clearAuthToken } from '../api/client';

export type User = {
  id: number;
  email: string;
};

export type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const loadToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('authToken');
        const savedUser = await AsyncStorage.getItem('authUser');
        
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setAuthToken(savedToken);
        }
      } catch (err) {
        console.error('Failed to load auth state:', err);
      } finally {
        setLoading(false);
      }
    };

    loadToken();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { signIn: apiSignIn } = await import('../api/client');
      const response = await apiSignIn({ email, password });
      const data = response.data as { token: string; user: User };
      
      setToken(data.token);
      setUser(data.user);
      setAuthToken(data.token);

      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('authUser', JSON.stringify(data.user));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const { signUp: apiSignUp } = await import('../api/client');
      const response = await apiSignUp({ email, password });
      const data = response.data as { token: string; user: User };
      
      setToken(data.token);
      setUser(data.user);
      setAuthToken(data.token);

      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('authUser', JSON.stringify(data.user));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setToken(null);
      setUser(null);
      clearAuthToken();

      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('authUser');
    } catch (err) {
      console.error('Failed to sign out:', err);
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
