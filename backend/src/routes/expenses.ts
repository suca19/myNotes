import express from 'express';
import { body, param } from 'express-validator';
import authenticateToken from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validate';
import pool from '../lib/pool';
import { Request, Response } from 'express'; 

const router = express.Router();

router.use(authenticateToken);

const createExpenseValidators = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a valid number greater than 0'),
  body('place').isString().trim().notEmpty().withMessage('Place is required'),
  body('category').isString().trim().notEmpty().withMessage('Category is required'),
  body('date').isISO8601().withMessage('Date must be a valid ISO date'),
  body('notes').optional({ nullable: true }).isString(),
  handleValidationErrors,
];

const updateExpenseValidators = [
  param('id').isInt({ gt: 0 }).withMessage('Invalid expense id'),
  body('amount').optional().isFloat({ gt: 0 }),
  body('place').optional().isString().trim().notEmpty(),
  body('category').optional().isString().trim().notEmpty(),
  body('date').optional().isISO8601(),
  body('notes').optional({ nullable: true }).isString(),
  handleValidationErrors,
];

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await pool.query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.json({ expenses: result.rows });
  } catch (error) {
    console.error('GET /api/expenses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', createExpenseValidators, async (req: Request, res: Response) => {
  try {
    const { amount, place, category, date, notes } = req.body as {
      amount: number;
      place: string;
      category: string;
      date: string;
      notes?: string;
    };

    const userId = req.user!.userId;
    const result = await pool.query(
      `INSERT INTO expenses (user_id, amount, place, category, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, Number(amount), String(place).trim(), String(category).trim(), date, notes ?? null]
    );

    return res.status(201).json({ expense: result.rows[0] });
  } catch (error) {
    console.error('POST /api/expenses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', updateExpenseValidators, async (req: Request, res: Response) => {
  try {
    const expenseId = Number(req.params.id);
    const userId = req.user!.userId;

    const existing = await pool.query('SELECT * FROM expenses WHERE user_id = $1 AND id = $2', [userId, expenseId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const current = existing.rows[0];
    const updated = {
      amount: req.body.amount ?? current.amount,
      place: req.body.place !== undefined ? String(req.body.place).trim() : current.place,
      category: req.body.category !== undefined ? String(req.body.category).trim() : current.category,
      date: req.body.date ?? current.date,
      notes: req.body.notes !== undefined ? req.body.notes : current.notes,
    };

    const result = await pool.query(
      `UPDATE expenses
       SET amount = $1, place = $2, category = $3, date = $4, notes = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [Number(updated.amount), updated.place, updated.category, updated.date, updated.notes, expenseId, userId]
    );

    return res.json({ expense: result.rows[0] });
  } catch (error) {
    console.error('PUT /api/expenses/:id error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', [param('id').isInt({ gt: 0 }), handleValidationErrors], async (req: Request, res: Response) => {
  try {
    const expenseId = Number(req.params.id);
    const userId = req.user!.userId;

    const result = await pool.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id', [
      expenseId,
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/expenses/:id error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
