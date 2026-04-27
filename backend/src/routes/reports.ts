import express from 'express';
import authenticateToken from '../middleware/auth';
import pool from '../lib/pool';
import type { Request } from 'express';

const router = express.Router();

router.use(authenticateToken);

router.get('/summary', async (req: Request, res) => {
  try {
    const userId = req.user!.userId;

    const totalSpentResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1', [
      userId,
    ]);

    const currentMonthResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE user_id = $1
       AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );

    const countResult = await pool.query('SELECT COUNT(*) as count FROM expenses WHERE user_id = $1', [userId]);

    return res.json({
      totalSpent: parseFloat(totalSpentResult.rows[0].total),
      currentMonthSpent: parseFloat(currentMonthResult.rows[0].total),
      totalExpenses: Number.parseInt(countResult.rows[0].count, 10),
    });
  } catch (error) {
    console.error('GET /api/reports/summary error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/by-category', async (req: Request, res) => {
  try {
    const userId = req.user!.userId;
    const result = await pool.query(
      `SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM expenses
       WHERE user_id = $1
       GROUP BY category
       ORDER BY total DESC`,
      [userId]
    );

    return res.json({ categories: result.rows });
  } catch (error) {
    console.error('GET /api/reports/by-category error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/monthly', async (req: Request, res) => {
  try {
    const userId = req.user!.userId;
    const result = await pool.query(
      `SELECT DATE_TRUNC('month', date) as month, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM expenses
       WHERE user_id = $1
       AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
       GROUP BY DATE_TRUNC('month', date)
       ORDER BY month ASC`,
      [userId]
    );

    return res.json({ monthlyData: result.rows });
  } catch (error) {
    console.error('GET /api/reports/monthly error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
