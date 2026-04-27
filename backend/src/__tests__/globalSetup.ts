// Global setup for Jest tests - runs before any tests load
export default async function globalSetup() {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
  process.env.JWT_SECRET = 'test-secret';
}
