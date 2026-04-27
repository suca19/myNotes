import express from 'express';
import type { Response } from 'express';
import { body, param } from 'express-validator';
import authenticateToken from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validate';
import pool from '../lib/pool';
import type { Request } from 'express';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await pool.query('SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY target_date ASC', [userId]);
    res.json({ goals: result.rows });
    return;
  } catch (error) {
    console.error('GET /api/savings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id(\\d+)', [param('id').isInt({ gt: 0 }), handleValidationErrors], async (req: Request, res: Response): Promise<void> => {
  try {
    const goalId = Number(req.params.id);
    const userId = req.user!.userId;

    const result = await pool.query('SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2', [goalId, userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Savings goal not found' });
      return;
    }

    res.json({ goal: result.rows[0] });
    return;
  } catch (error) {
    console.error('GET /api/savings/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/',
  [
    body('name').isString().trim().notEmpty(),
    body('target_amount').isFloat({ gt: 0 }),
    body('current_amount').optional().isFloat({ min: 0 }),
    body('target_date').isISO8601(),
    body('notes').optional({ nullable: true }).isString(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { name, target_amount, current_amount, target_date, notes } = req.body as {
        name: string;
        target_amount: number;
        current_amount?: number;
        target_date: string;
        notes?: string;
      };

      const result = await pool.query(
        `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, name.trim(), Number(target_amount), Number(current_amount ?? 0), target_date, notes || null]
      );

      res.status(201).json({ goal: result.rows[0] });
      return;
    } catch (error) {
      console.error('POST /api/savings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put(
  '/:id(\\d+)',
  [
    param('id').isInt({ gt: 0 }),
    body('name').optional().isString().trim().notEmpty(),
    body('target_amount').optional().isFloat({ gt: 0 }),
    body('current_amount').optional().isFloat({ min: 0 }),
    body('target_date').optional().isISO8601(),
    body('notes').optional({ nullable: true }).isString(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const goalId = Number(req.params.id);
      const userId = req.user!.userId;
      const { name, target_amount, current_amount, target_date, notes } = req.body;

      const checkResult = await pool.query('SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2', [goalId, userId]);
      if (checkResult.rows.length === 0) {
        res.status(404).json({ error: 'Savings goal not found' });
        return;
      }

      const existing = checkResult.rows[0];
      const updated = {
        name: name !== undefined ? String(name).trim() : existing.name,
        target_amount: target_amount !== undefined ? Number(target_amount) : Number(existing.target_amount),
        current_amount: current_amount !== undefined ? Number(current_amount) : Number(existing.current_amount),
        target_date: target_date ?? existing.target_date,
        notes: notes !== undefined ? notes : existing.notes,
      };

      const result = await pool.query(
        `UPDATE savings_goals
         SET name = $1, target_amount = $2, current_amount = $3, target_date = $4, notes = $5
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [updated.name, updated.target_amount, updated.current_amount, updated.target_date, updated.notes, goalId, userId]
      );

      res.json({ goal: result.rows[0] });
      return;
    } catch (error) {
      console.error('PUT /api/savings/:id error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete('/:id(\\d+)', [param('id').isInt({ gt: 0 }), handleValidationErrors], async (req: Request, res: Response): Promise<void> => {
  try {
    const goalId = Number(req.params.id);
    const userId = req.user!.userId;

    const result = await pool.query('DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id', [goalId, userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Savings goal not found' });
      return;
    }

    res.json({ success: true, message: 'Savings goal deleted successfully' });
    return;
  } catch (error) {
    console.error('DELETE /api/savings/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await pool.query(
      `SELECT id, name, target_amount, current_amount, target_date,
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
    return;
  } catch (error) {
    console.error('GET /api/savings/progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
