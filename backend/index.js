const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// Expenses endpoints
app.get('/api/expenses', (req, res) => {
  // TODO: Get from database
  res.json({ expenses: [] });
});

app.post('/api/expenses', (req, res) => {
  // TODO: Save to database
  const { amount, place, category } = req.body;
  res.json({ success: true, expense: { id: Date.now(), amount, place, category } });
});

// Goals endpoints
app.get('/api/goals', (req, res) => {
  res.json({ goals: [] });
});

app.post('/api/goals', (req, res) => {
  const { name, targetAmount, targetDate } = req.body;
  res.json({ success: true, goal: { id: Date.now(), name, targetAmount, targetDate } });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});