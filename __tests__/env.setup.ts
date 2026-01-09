/**
 * Environment setup for tests
 * This file runs BEFORE any modules are loaded, allowing us to set
 * required environment variables that are validated on module import.
 */

// Set test environment variables (these are mock values for testing)
process.env.DOORDASH_DEVELOPER_ID = 'test-developer-id';
process.env.DOORDASH_KEY_ID = 'test-key-id';
process.env.DOORDASH_SIGNING_SECRET = 'dGVzdC1zaWduaW5nLXNlY3JldA=='; // Base64 encoded
process.env.RELAY_SECRET = 'test-relay-secret';
process.env.PORT = '3000';
process.env.NODE_ENV = 'test';

// Database URL - use a test database or mock
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
