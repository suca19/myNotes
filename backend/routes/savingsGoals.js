const express = require('express');
const { Pool } = require('pg');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

function parseGoalId(idParam) {
    const id = Number.parseInt(idParam, 10);
    return Number.isInteger(id) && id > 0 ? id : null;
}

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

// GET /api/savings/:id - Get a single savings goal for the authenticated user
router.get('/:id(\\d+)', async (req, res) => {
    try {
        const goalId = parseGoalId(req.params.id);
        const userId = req.user.userId;

        if (!goalId) {
            return res.status(400).json({ error: 'Invalid savings goal id' });
        }

        const result = await pool.query(
            'SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2',
            [goalId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Savings goal not found' });
        }

        res.json({ goal: result.rows[0] });
    } catch (error) {
        console.error('GET /api/savings/:id error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/savings - Create a new savings goal
router.post('/', async (req, res) => {
    try {
        const { name, target_amount, current_amount, target_date, notes } = req.body;
        const userId = req.user.userId;

        if (!name || !target_amount || !target_date) {
            return res.status(400).json({ 
                error: 'Name, target_amount, and target_date are required' 
            });
        }

        const result = await pool.query(
            `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [userId, name, target_amount, current_amount, target_date, notes || null]
        );

        res.status(201).json({ goal: result.rows[0] });
    } catch (error) {
        console.error('POST /api/savings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/savings/:id - Update a savings goal
router.put('/:id(\\d+)', async (req, res) => {
    try {
        const goalId = parseGoalId(req.params.id);
        const userId = req.user.userId;
        const { name, target_amount, current_amount, target_date, notes } = req.body;

        if (!goalId) {
            return res.status(400).json({ error: 'Invalid savings goal id' });
        }

        // Check if goal exists and belongs to user
        const checkResult = await pool.query(
            'SELECT id FROM savings_goals WHERE id = $1 AND user_id = $2',
            [goalId, userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Savings goal not found' });
        }

        // Build dynamic update query
        let updateFields = [];
        let updateValues = [];
        let valueCounter = 1;

        if (name !== undefined) {
            updateFields.push(`name = $${valueCounter++}`);
            updateValues.push(name);
        }
        if (target_amount !== undefined) {
            updateFields.push(`target_amount = $${valueCounter++}`);
            updateValues.push(target_amount);
        }
        if (current_amount !== undefined) {
            updateFields.push(`current_amount = $${valueCounter++}`);
            updateValues.push(current_amount);
        }
        if (target_date !== undefined) {
            updateFields.push(`target_date = $${valueCounter++}`);
            updateValues.push(target_date);
        }
        if (notes !== undefined) {
            updateFields.push(`notes = $${valueCounter++}`);
            updateValues.push(notes);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateValues.push(goalId, userId);
        const query = `
            UPDATE savings_goals 
            SET ${updateFields.join(', ')} 
            WHERE id = $${valueCounter++} AND user_id = $${valueCounter}
            RETURNING *
        `;

        const result = await pool.query(query, updateValues);
        res.json({ goal: result.rows[0] });
    } catch (error) {
        console.error('PUT /api/savings/:id error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/savings/:id - Delete a savings goal
router.delete('/:id(\\d+)', async (req, res) => {
    try {
        const goalId = parseGoalId(req.params.id);
        const userId = req.user.userId;

        if (!goalId) {
            return res.status(400).json({ error: 'Invalid savings goal id' });
        }

        const checkResult = await pool.query(
            'SELECT id FROM savings_goals WHERE id = $1 AND user_id = $2',
            [goalId, userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Savings goal not found' });
        }

        await pool.query(
            'DELETE FROM savings_goals WHERE id = $1 AND user_id = $2',
            [goalId, userId]
        );

        res.json({ success: true, message: 'Savings goal deleted successfully' });
    } catch (error) {
        console.error('DELETE /api/savings/:id error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/savings/progress - Get progress summary for all goals
router.get('/progress', async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            `SELECT 
                id, name, target_amount, current_amount, target_date,
                ROUND((current_amount / target_amount) * 100, 2) as progress_percentage,
                CASE 
                    WHEN current_amount >= target_amount THEN 'achieved'
                    WHEN current_amount > 0 THEN 'in_progress'
                    ELSE 'not_started'
                END as status
             FROM savings_goals 
             WHERE user_id = $1
             ORDER BY target_date ASC`,
            [userId]
        );
        res.json({ goals: result.rows });
    } catch (error) {
        console.error('GET /api/savings/progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;