import express from 'express';
import type { Response } from 'express';
import { body, param } from 'express-validator';
import authenticateToken from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validate';
import pool from '../lib/pool';
import type { Request } from 'express';

const router = express.Router();

router.use(authenticateToken);

const fixedValidators = [
  body('name').isString().trim().notEmpty(),
  body('amount').isFloat({ gt: 0 }),
  body('frequency').isIn(['weekly', 'monthly', 'yearly']),
  body('category').isString().trim().notEmpty(),
  body('due_day').isInt({ min: 1, max: 31 }),
  body('notes').optional({ nullable: true }).isString(),
  handleValidationErrors,
];

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await pool.query(
      `SELECT * FROM fixed_expenses WHERE user_id = $1 ORDER BY due_day ASC, category ASC, name ASC`,
      [userId]
    );
    return res.json({ fixedExpenses: result.rows });
  } catch (error) {
    console.error('GET /api/fixed-expenses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', fixedValidators, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, amount, frequency, category, due_day, notes } = req.body as {
      name: string;
      amount: number;
      frequency: 'weekly' | 'monthly' | 'yearly';
      category: string;
      due_day: number;
      notes?: string;
    };

    const result = await pool.query(
      `INSERT INTO fixed_expenses (user_id, name, frequency, amount, category, due_day, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        name.trim(),
        frequency,
        Number(amount),
        category.trim(),
        Number(due_day),
        notes ?? null,
      ]
    );

    return res.status(201).json({ fixedExpense: result.rows[0] });
  } catch (error) {
    console.error('POST /api/fixed-expenses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put(
  '/:id',
  [
    param('id').isInt({ gt: 0 }),
    body('name').optional().isString().trim().notEmpty(),
    body('amount').optional().isFloat({ gt: 0 }),
    body('frequency').optional().isIn(['weekly', 'monthly', 'yearly']),
    body('category').optional().isString().trim().notEmpty(),
    body('due_day').optional().isInt({ min: 1, max: 31 }),
    body('notes').optional({ nullable: true }).isString(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const fixedExpenseId = Number(req.params.id);
      const userId = req.user!.userId;

      const existingResult = await pool.query('SELECT * FROM fixed_expenses WHERE id = $1 AND user_id = $2', [
        fixedExpenseId,
        userId,
      ]);

      if (existingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Fixed expense not found' });
      }

      const existing = existingResult.rows[0];
      const updated = {
        name: req.body.name !== undefined ? String(req.body.name).trim() : existing.name,
        amount: req.body.amount !== undefined ? Number(req.body.amount) : existing.amount,
        frequency: req.body.frequency !== undefined ? String(req.body.frequency) : existing.frequency,
        category: req.body.category !== undefined ? String(req.body.category).trim() : existing.category,
        due_day: req.body.due_day !== undefined ? Number(req.body.due_day) : existing.due_day,
        notes: req.body.notes !== undefined ? req.body.notes : existing.notes,
      };

      const result = await pool.query(
        `UPDATE fixed_expenses
         SET name = $1, amount = $2, frequency = $3, category = $4, due_day = $5, notes = $6
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [updated.name, updated.amount, updated.frequency, updated.category, updated.due_day, updated.notes, fixedExpenseId, userId]
      );

      return res.json({ fixedExpense: result.rows[0] });
    } catch (error) {
      console.error('PUT /api/fixed-expenses/:id error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete('/:id', [param('id').isInt({ gt: 0 }), handleValidationErrors], async (req: Request, res: Response) => {
  try {
    const fixedExpenseId = Number(req.params.id);
    const userId = req.user!.userId;
    const result = await pool.query('DELETE FROM fixed_expenses WHERE id = $1 AND user_id = $2 RETURNING id', [
      fixedExpenseId,
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fixed expense not found' });
    }

    return res.json({ success: true, message: 'Fixed expense deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/fixed-expenses/:id error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
