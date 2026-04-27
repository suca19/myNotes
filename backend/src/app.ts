import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import expensesRoutes from './routes/expenses';
import fixedExpensesRoutes from './routes/fixedExpenses';
import savingsGoalsRoutes from './routes/savingsGoals';
import reportsRoutes from './routes/reports';
import authenticateToken from './middleware/auth';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['*'];

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/fixed-expenses', fixedExpensesRoutes);
app.use('/api/savings-goals', savingsGoalsRoutes);
app.use('/api/savingsGoals', savingsGoalsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/savings', savingsGoalsRoutes);
app.use('/api/goals', savingsGoalsRoutes);

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'You have access to protected data!',
    user: (req as any).user,
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
