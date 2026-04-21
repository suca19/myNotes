const express = require('express');
const { Pool } = require('pg');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const pool = new Pool ({
    connectionString: process.env.DATABASE_URL,
});

//ALL expenses routes require authentication
router.use(authenticateToken);

//GET /api/expenses - Get all expenses for the authenticated user
router.get('/', async (req, res) => {
    const userId = req.user.userId;
    const result = await pool.query(
        'SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
    res.json({ expenses: result.rows });
});

//POST /api/expenses - Create a new expense for the authenticated user
router.post('/', async (req, res) => {
    const { amount, place, category, date, notes } = req.body;
    const userId = req.user.userId;

    if (!amount || !place || !category || !date || !notes){
        return res.status(400).json({error: 'Amount, place, category, date, notes'});
    }
    const result = await pool.query(
        'INSERT INTO expenses (user_id, amount, place, category, date, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [userId, amount, place, category, date, notes || null]
    );
    res.status(201).json({ success: true, expense: result.rows[0] });
})

module.exports = router;