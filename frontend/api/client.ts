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

// Health
export const healthCheck = () => api.get('/health');

// Auth
export const signUp = (data: AuthInput) => api.post('/auth/signup', data);
export const signIn = (data: AuthInput) => api.post('/auth/signin', data);

// Expenses
export const getExpenses = () => api.get('/expenses');
export const getExpense = (id: number) => api.get(`/expenses/${id}`);
export const createExpense = (data: ExpenseInput) => api.post('/expenses', data);
export const updateExpense = (id: number, data: Partial<ExpenseInput>) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id: number) => api.delete(`/expenses/${id}`);

// Fixed Expenses
export type FixedExpenseInput = {
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  category: string;
  due_day: number;
  notes?: string;
};

export const getFixedExpenses = () => api.get('/fixed-expenses');
export const getFixedExpense = (id: number) => api.get(`/fixed-expenses/${id}`);
export const createFixedExpense = (data: FixedExpenseInput) => api.post('/fixed-expenses', data);
export const updateFixedExpense = (id: number, data: Partial<FixedExpenseInput>) =>
  api.put(`/fixed-expenses/${id}`, data);
export const deleteFixedExpense = (id: number) => api.delete(`/fixed-expenses/${id}`);

// Savings Goals
export const getGoals = () => api.get('/goals');
export const getGoal = (id: number) => api.get(`/goals/${id}`);
export const createGoal = (data: GoalInput) => api.post('/goals', data);
export const updateGoal = (id: number, data: Partial<GoalInput>) => api.put(`/goals/${id}`, data);
export const deleteGoal = (id: number) => api.delete(`/goals/${id}`);

// Reports
export const getReportSummary = () => api.get('/reports/summary');
export const getReportByCategory = () => api.get('/reports/by-category');
export const getReportMonthly = () => api.get('/reports/monthly');

export default api;