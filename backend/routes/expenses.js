const express = require('express');
const { Pool } = require('pg');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * Validate expense input.
 * @param {object} data - Request body data.
 * @param {boolean} requireAll - If true, require amount/place/category/date (POST).
 * @returns {{ valid: boolean, error?: string }}
 */
function validateExpenseInput(data, requireAll = true) {
    const { amount, place, category, date } = data;

    if (requireAll) {
        if (
            amount === undefined ||
            place === undefined ||
            category === undefined ||
            date === undefined
        ) {
            return { valid: false, error: 'Amount, place, category, and date are required' };
        }
    }

    if (amount !== undefined) {
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return { valid: false, error: 'Amount must be a valid number greater than 0' };
        }
    }

    if (place !== undefined && String(place).trim().length === 0) {
        return { valid: false, error: 'Place cannot be empty' };
    }

    if (category !== undefined && String(category).trim().length === 0) {
        return { valid: false, error: 'Category cannot be empty' };
    }

    if (date !== undefined && Number.isNaN(Date.parse(date))) {
        return { valid: false, error: 'Date must be a valid date value' };
    }

    return { valid: true };
}

/**
 * Parse and validate expense ID from route params.
 * @param {string} idParam
 * @returns {number|null}
 */
function parseExpenseId(idParam) {
    const id = Number.parseInt(idParam, 10);
    return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Get one expense owned by a specific user.
 * @param {number} userId
 * @param {number} expenseId
 * @returns {Promise<object|null>}
 */
async function getUserExpenseById(userId, expenseId) {
    const result = await pool.query(
        'SELECT * FROM expenses WHERE user_id = $1 AND id = $2',
        [userId, expenseId]
    );
    return result.rows[0] || null;
}

// All expenses routes require authentication
router.use(authenticateToken);

/**
 * GET /api/expenses
 * Get all expenses for the authenticated user.
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            'SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json({ expenses: result.rows });
    } catch (error) {
        console.error('GET /api/expenses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/expenses
 * Create a new expense for the authenticated user.
 */
router.post('/', async (req, res) => {
    try {
        const { amount, place, category, date, notes } = req.body;
        const userId = req.user.userId;

        const validation = validateExpenseInput(req.body, true);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const result = await pool.query(
            `INSERT INTO expenses (user_id, amount, place, category, date, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                userId,
                Number(amount),
                String(place).trim(),
                String(category).trim(),
                date,
                notes ?? null,
            ]
        );

        res.status(201).json({ expense: result.rows[0] });
    } catch (error) {
        console.error('POST /api/expenses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/expenses/:id
 * Delete an expense by ID for the authenticated user.
 */
router.delete('/:id', async (req, res) => {
    try {
        const expenseId = parseExpenseId(req.params.id);
        const userId = req.user.userId;

        if (!expenseId) {
            return res.status(400).json({ error: 'Invalid expense id' });
        }

        const existingExpense = await getUserExpenseById(userId, expenseId);
        if (!existingExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        await pool.query(
            'DELETE FROM expenses WHERE id = $1 AND user_id = $2',
            [expenseId, userId]
        );

        res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('DELETE /api/expenses/:id error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/expenses/:id
 * Update an expense by ID for the authenticated user.
 */
router.put('/:id', async (req, res) => {
    try {
        const expenseId = parseExpenseId(req.params.id);
        const userId = req.user.userId;

        if (!expenseId) {
            return res.status(400).json({ error: 'Invalid expense id' });
        }

        const hasAnyUpdateField =
            req.body.amount !== undefined ||
            req.body.place !== undefined ||
            req.body.category !== undefined ||
            req.body.date !== undefined ||
            req.body.notes !== undefined;

        if (!hasAnyUpdateField) {
            return res.status(400).json({ error: 'Provide at least one field to update' });
        }

        const validation = validateExpenseInput(req.body, false);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const existingExpense = await getUserExpenseById(userId, expenseId);
        if (!existingExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        const updatedExpense = {
            amount: req.body.amount ?? existingExpense.amount,
            place: req.body.place !== undefined ? String(req.body.place).trim() : existingExpense.place,
            category: req.body.category !== undefined ? String(req.body.category).trim() : existingExpense.category,
            date: req.body.date ?? existingExpense.date,
            notes: req.body.notes !== undefined ? req.body.notes : existingExpense.notes,
        };

        const result = await pool.query(
            `UPDATE expenses
             SET amount = $1, place = $2, category = $3, date = $4, notes = $5
             WHERE id = $6 AND user_id = $7
             RETURNING *`,
            [
                Number(updatedExpense.amount),
                updatedExpense.place,
                updatedExpense.category,
                updatedExpense.date,
                updatedExpense.notes,
                expenseId,
                userId,
            ]
        );

        res.json({ expense: result.rows[0] });
    } catch (error) {
        console.error('PUT /api/expenses/:id error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;