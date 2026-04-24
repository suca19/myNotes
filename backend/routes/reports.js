const express = require('express');
const { Pool } = require('pg');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// All report routes require authentication
router.use(authenticateToken);

// GET /api/reports/summary - Get overall spending summary
router.get('/summary', async (req, res) => {
    try {
        const userId = req.user.userId;

        // Total spent all time
        const totalSpentResult = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1',
            [userId]
        );

        // Current month spending
        const currentMonthResult = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total 
             FROM expenses 
             WHERE user_id = $1 
             AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)`,
            [userId]
        );

        // Number of expenses
        const countResult = await pool.query(
            'SELECT COUNT(*) as count FROM expenses WHERE user_id = $1',
            [userId]
        );

        res.json({
            totalSpent: parseFloat(totalSpentResult.rows[0].total),
            currentMonthSpent: parseFloat(currentMonthResult.rows[0].total),
            totalExpenses: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        console.error('GET /api/reports/summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/reports/by-category - Get spending grouped by category
router.get('/by-category', async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT 
                category,
                COALESCE(SUM(amount), 0) as total,
                COUNT(*) as count
             FROM expenses 
             WHERE user_id = $1
             GROUP BY category
             ORDER BY total DESC`,
            [userId]
        );

        res.json({ categories: result.rows });
    } catch (error) {
        console.error('GET /api/reports/by-category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/reports/monthly - Get monthly spending for last 6 months
router.get('/monthly', async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT 
                DATE_TRUNC('month', date) as month,
                COALESCE(SUM(amount), 0) as total,
                COUNT(*) as count
             FROM expenses 
             WHERE user_id = $1 
             AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
             GROUP BY DATE_TRUNC('month', date)
             ORDER BY month ASC`,
            [userId]
        );

        res.json({ monthlyData: result.rows });
    } catch (error) {
        console.error('GET /api/reports/monthly error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;