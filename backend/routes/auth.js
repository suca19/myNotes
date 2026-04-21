const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

//SIGNUP ENDPOINT
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    // VALIDATION - Check if all fields exist
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // CHECK EXISTS - See if email is already in database
    const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );

    if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
    }

    // HASH PASSWORD - Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // CREATE USER - Insert into database
    const result = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
        [email, hashedPassword]
    );

    // GET THE CREATED USER
    const user = result.rows[0];

    // CREATE TOKEN - Generate JWT for authentication
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // SEND RESPONSE
    res.status(201).json({
        success: true,
        token,
        user: {
            id: user.id,
            email: user.email
        }
    });
    });

    //SIGNIN ENDPOINT
    router.post('/signin', async (req, res) => {
        const { email, password } = req.body;

        if(!email || !password){
        return res.status(400).json({ error: 'Email and password are required'});
        }
        const result = await pool.query(
            'SELECT id, email, password_hash FROM users WHERE email = $1',
            [email]
        );
        if(result.rows.length === 0){
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if(!isPasswordValid){
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email
            }
        });

    });

    

module.exports = router;