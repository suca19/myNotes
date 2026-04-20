const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.post('/signup', async (req, res) => {
    const { email, password, name } = req.body;

    // 1. VALIDATION - Check if all fields exist
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // 2. CHECK EXISTS - See if email is already in database
    const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );

    if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
    }

    // 3. HASH PASSWORD - Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. CREATE USER - Insert into database
    const result = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
        [email, hashedPassword, name]
    );

    // 5. GET THE CREATED USER
    const user = result.rows[0];

    // 6. CREATE TOKEN - Generate JWT for authentication
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 7. SEND RESPONSE
    res.status(201).json({
        success: true,
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        }
    });
});

module.exports = router;