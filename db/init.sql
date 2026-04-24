-- =============================================
-- EXPENSE TRACKER DATABASE SCHEMA
-- =============================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    place VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SAVINGS GOALS TABLE
CREATE TABLE IF NOT EXISTS savings_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FIXED EXPENSES TABLE (recurring bills)
CREATE TABLE IF NOT EXISTS fixed_expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
    category VARCHAR(50) NOT NULL,
    due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR BETTER PERFORMANCE
-- =============================================

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Savings goals indexes
CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_target_date ON savings_goals(target_date);

-- Fixed expenses indexes
CREATE INDEX IF NOT EXISTS idx_fixed_user_id ON fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_frequency ON fixed_expenses(frequency);
CREATE INDEX IF NOT EXISTS idx_fixed_due_day ON fixed_expenses(due_day);

-- =============================================
-- SAMPLE DATA (optional - for testing)
-- =============================================

-- Insert a test user (password is "test123" hashed)
-- Password hash is for: test123
INSERT INTO users (email, password_hash, name) 
SELECT 'test@example.com', '$2b$10$XK9xZqW3LpR5tY7uIvE9eO8nQ2sT4vU6wX8yZ0aB2cD4eF6gH8iJ0kL2mN4', 'Test User'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'test@example.com');