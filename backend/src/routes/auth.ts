import express from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import pool from '../lib/pool';
import { authLimiter } from '../middleware/rateLimit';
import { handleValidationErrors } from '../middleware/validate';

const router = express.Router();

const authValidators = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  handleValidationErrors,
];

router.use(authLimiter);

router.post('/signup', authValidators, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [normalizedEmail, hashedPassword]
    );

    const user = result.rows[0] as { id: number; email: string };
   // Validate JWT_SECRET exists
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not set');
    }

  const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/signin', authValidators, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const normalizedEmail = String(email).trim().toLowerCase();

    const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [normalizedEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0] as { id: number; email: string; password_hash: string };
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Validate JWT_SECRET exists
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
}

const token = jwt.sign(
    { userId: user.id, email: user.email },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/signin error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
