// Set environment variables before any tests run
export default async function setup() {
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost/test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
}
