import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { testLoadEnv } from './fixtures/testLoadEnv.ts';

// Store original values
const originalEnv = { ...process.env };
const originalConsoleWarn = console.warn;

// Define fixture paths
const fixturesDir = `${import.meta.dirname}/fixtures`;
const testEnvDir = `${fixturesDir}/test-env`;
const devEnvDir = `${fixturesDir}/dev-env`;
const emptyEnvDir = `${fixturesDir}/empty-env`;

describe('loadEnv', () => {
  afterEach(() => {
    // Restore globals
    process.env = { ...originalEnv };
    console.warn = originalConsoleWarn;
  });

  it('should load only .env.test in test environment', () => {
    // Arrange
    process.env = {
      NODE_ENV: 'test'
    };

    // Act
    const result = testLoadEnv(testEnvDir);

    // Assert
    assert.strictEqual(result, true);
    assert.strictEqual(process.env.TEST_VAR, 'test_value');
  });

  it('should load .env files in correct priority order in non-test environment', () => {
    // Arrange
    process.env = {
      NODE_ENV: 'development'
    };

    // Act
    const result = testLoadEnv(devEnvDir);

    // Assert
    assert.strictEqual(result, true);

    // The highest priority file should win for common variables
    assert.strictEqual(process.env.COMMON_VAR, 'from_env_local');

    // Other variables should be set from their respective files
    assert.strictEqual(process.env.DEV_ONLY, 'true');
    assert.strictEqual(process.env.LOCAL_ONLY, 'true');
    assert.strictEqual(process.env.DEV_LOCAL_ONLY, 'true');
  });

  it('should return false and log warning when no .env files are found', () => {
    // Arrange
    process.env = {
      NODE_ENV: 'production'
    };

    // Capture console.warn output
    let warningMessage = '';
    console.warn = (message) => {
      warningMessage = message;
    };

    // Act
    const result = testLoadEnv(emptyEnvDir);

    // Assert
    assert.strictEqual(result, false);
    assert.strictEqual(warningMessage, "Env file hasn't been loaded");
  });
});
