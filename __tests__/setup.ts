// Test setup file
// Runs before all tests

// Extend Jest timeout for integration tests
jest.setTimeout(10000);

// Suppress console logs during tests (optional - comment out if you want to see logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
// };

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
});
