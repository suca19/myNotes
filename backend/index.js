const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const expensesRoutes = require('./routes/expenses');
const fixedExpensesRoutes = require('./routes/fixedExpenses');
const savingsGoalsRoutes = require('./routes/savingsGoals');
const authenticateToken = require('./middleware/auth');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// Use auth routes
app.use('/api/auth', authRoutes);

// Feature routes
app.use('/api/expenses', expensesRoutes);
app.use('/api/fixed-expenses', fixedExpensesRoutes);
app.use('/api/savingsGoals', savingsGoalsRoutes);

// Backward-compatible alias used by the current frontend client.
app.use('/api/goals', savingsGoalsRoutes);

// Example protected route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'You have access to protected data!',
    user: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});