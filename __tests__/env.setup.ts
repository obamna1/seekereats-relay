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

// Twilio mock credentials (accountSid must start with 'AC')
process.env.TWILIO_ACCOUNT_SID = 'ACtest1234567890abcdef1234567890ab';
process.env.TWILIO_AUTH_TOKEN = 'test-auth-token-1234567890abcdef';
process.env.TWILIO_PHONE_NUMBER = '+15555555555';

// Square mock credentials for sandbox testing
process.env.SQUARE_ACCESS_TOKEN = 'test-sandbox-access-token';
process.env.SQUARE_LOCATION_ID = 'test-sandbox-location-id';
process.env.SQUARE_APPLICATION_ID = 'test-application-id';
process.env.SQUARE_APP_SECRET = 'test-app-secret';
