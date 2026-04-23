const express = require('express');
const { Pool } = require('pg');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// All savings routes require authentication
router.use(authenticateToken);

// GET /api/savings - Get all savings goals for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            'SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY target_date ASC',
            [userId]
        );
        res.json({ goals: result.rows });
    } catch (error) {
        console.error('GET /api/savings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/savings - Create a new savings goal
router.post('/', async (req, res) => {
    try {
        const { name, target_amount, target_date, notes } = req.body;
        const userId = req.user.userId;

        if (!name || !target_amount || !target_date) {
            return res.status(400).json({ 
                error: 'Name, target_amount, and target_date are required' 
            });
        }

        const result = await pool.query(
            `INSERT INTO savings_goals (user_id, name, target_amount, target_date, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, name, target_amount, target_date, notes || null]
        );

        res.status(201).json({ goal: result.rows[0] });
    } catch (error) {
        console.error('POST /api/savings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;