const express = require('express');
const { Pool } = require('pg');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * Validate fixed-expense payload.
 * requireAll=true for create, false for update.
 */
function validateFixedExpenseInput(data, requireAll = true) {
    const { name, amount, category, due_day } = data;

    if (requireAll) {
        if (
            name === undefined ||
            amount === undefined ||
            category === undefined ||
            due_day === undefined
        ) {
            return {
                valid: false,
                error: 'Name, amount, category, and due_day are required',
            };
        }
    }

    if (name !== undefined && String(name).trim().length === 0) {
        return { valid: false, error: 'Name cannot be empty' };
    }

    if (amount !== undefined) {
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return { valid: false, error: 'Amount must be a valid number greater than 0' };
        }
    }

    if (category !== undefined && String(category).trim().length === 0) {
        return { valid: false, error: 'Category cannot be empty' };
    }

    if (due_day !== undefined && (Number.isNaN(Number(due_day)) || Number(due_day) < 1 || Number(due_day) > 31)) {
        return { valid: false, error: 'due_day must be a valid day of the month (1-31)' };
    }

    return { valid: true };
}

function parseFixedExpenseId(idParam) {
    const id = Number.parseInt(idParam, 10);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// All fixed-expense routes require authentication.
router.use(authenticateToken);

// GET /api/fixed-expenses - Get all fixed expenses for the authenticated user.
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            `SELECT *
             FROM fixed_expenses
             WHERE user_id = $1
             ORDER BY due_date ASC, category ASC, name ASC`,
            [userId]
        );

        res.json({ fixedExpenses: result.rows });
    } catch (error) {
        console.error('GET /api/fixed-expenses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/fixed-expenses - Create a fixed expense.
router.post('/', async (req, res) => {
    try {
        const validation = validateFixedExpenseInput(req.body, true);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const userId = req.user.userId;
        const { name, amount, category, due_day, notes } = req.body;

        const result = await pool.query(
            `INSERT INTO fixed_expenses (user_id, name, amount, category, due_day, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                userId,
                String(name).trim(),
                Number(amount),
                String(category).trim(),
                due_day,
                notes ?? null,
            ]
        );

        res.status(201).json({ fixedExpense: result.rows[0] });
    } catch (error) {
        console.error('POST /api/fixed-expenses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/fixed-expenses/:id - Update a fixed expense.
router.put('/:id', async (req, res) => {
    try {
        const fixedExpenseId = parseFixedExpenseId(req.params.id);
        if (!fixedExpenseId) {
            return res.status(400).json({ error: 'Invalid fixed expense id' });
        }

        const hasAnyUpdateField =
            req.body.name !== undefined ||
            req.body.amount !== undefined ||
            req.body.category !== undefined ||
            req.body.due_date !== undefined ||
            req.body.notes !== undefined;

        if (!hasAnyUpdateField) {
            return res.status(400).json({ error: 'Provide at least one field to update' });
        }

        const validation = validateFixedExpenseInput(req.body, false);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const userId = req.user.userId;
        const existingResult = await pool.query(
            'SELECT * FROM fixed_expenses WHERE id = $1 AND user_id = $2',
            [fixedExpenseId, userId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Fixed expense not found' });
        }

        const existing = existingResult.rows[0];
        const updatedExpense = {
            name: req.body.name !== undefined ? String(req.body.name).trim() : existing.name,
            amount: req.body.amount !== undefined ? Number(req.body.amount) : existing.amount,
            category:
                req.body.category !== undefined
                    ? String(req.body.category).trim()
                    : existing.category,
            due_date: req.body.due_date ?? existing.due_date,
            notes: req.body.notes !== undefined ? req.body.notes : existing.notes,
        };

        const result = await pool.query(
            `UPDATE fixed_expenses
             SET name = $1, amount = $2, category = $3, due_date = $4, notes = $5
             WHERE id = $6 AND user_id = $7
             RETURNING *`,
            [
                updatedExpense.name,
                updatedExpense.amount,
                updatedExpense.category,
                updatedExpense.due_date,
                updatedExpense.notes,
                fixedExpenseId,
                userId,
            ]
        );

        res.json({ fixedExpense: result.rows[0] });
    } catch (error) {
        console.error('PUT /api/fixed-expenses/:id error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/fixed-expenses/:id - Delete a fixed expense.
router.delete('/:id', async (req, res) => {
    try {
        const fixedExpenseId = parseFixedExpenseId(req.params.id);
        if (!fixedExpenseId) {
            return res.status(400).json({ error: 'Invalid fixed expense id' });
        }

        const userId = req.user.userId;
        const result = await pool.query(
            'DELETE FROM fixed_expenses WHERE id = $1 AND user_id = $2 RETURNING id',
            [fixedExpenseId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Fixed expense not found' });
        }

        res.json({ success: true, message: 'Fixed expense deleted successfully' });
    } catch (error) {
        console.error('DELETE /api/fixed-expenses/:id error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
