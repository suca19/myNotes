import axios from 'axios';

// Get your computer's IP address
// On Ubuntu: hostname -I
const API_URL = 'http://192.168.1.152:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const healthCheck = () => api.get('/health');
export const getExpenses = () => api.get('/expenses');
export const createExpense = (data: any) => api.post('/expenses', data);
export const getGoals = () => api.get('/goals');
export const createGoal = (data: any) => api.post('/goals', data);

export default api;