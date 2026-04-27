import axios from 'axios';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');

let authToken: string | null = null;

export type ExpenseInput = {
  amount: number;
  place: string;
  category: string;
  date: string;
  notes?: string;
};

export type GoalInput = {
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date: string;
  notes?: string;
};

export type AuthInput = {
  email: string;
  password: string;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = null;
};

export const getApiBaseUrl = () => API_URL;

export const healthCheck = () => api.get('/health');
export const signUp = (data: AuthInput) => api.post('/auth/signup', data);
export const signIn = (data: AuthInput) => api.post('/auth/signin', data);
export const getExpenses = () => api.get('/expenses');
export const createExpense = (data: ExpenseInput) => api.post('/expenses', data);
export const getGoals = () => api.get('/goals');
export const createGoal = (data: GoalInput) => api.post('/goals', data);

export default api;