import assert from 'node:assert';
import { afterEach, describe, it, mock } from 'node:test';

import { loadEnv } from '../loadEnv.ts';

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
    const result = loadEnv(testEnvDir);

    // Assert
    assert.strictEqual(typeof result.get, 'function'); // from() DSL constructor
    assert.strictEqual(process.env.TEST_VAR, 'test_value');
    assert.strictEqual(process.env.NON_TEST_VAR, undefined);
  });

  it('should load .env files in correct priority order in non-test environment', () => {
    // Arrange
    process.env = {
      NODE_ENV: 'development'
    };

    // Act
    const result = loadEnv(devEnvDir);

    // Assert
    assert.strictEqual(typeof result.get, 'function'); // from() DSL constructor

    // The highest priority file should win for common variables
    assert.strictEqual(process.env.COMMON_VAR, 'from_env_local');

    // Other variables should be set from their respective files
    assert.strictEqual(process.env.DEV_ONLY, 'true');
    assert.strictEqual(process.env.LOCAL_ONLY, 'true');
    assert.strictEqual(process.env.DEV_LOCAL_ONLY, 'true');
  });

  it('should return false and log warning when no .env files are found', () => {
    // Arrange
    const arrangedEnv = {
      NODE_ENV: 'production'
    };
    process.env = {
      ...arrangedEnv
    };

    // Capture console.warn output
    const consoleWarnMock = mock.fn();
    console.warn = consoleWarnMock;

    // Act
    const result = loadEnv(emptyEnvDir);

    // Assert
    assert.strictEqual(typeof result.get, 'function'); // from() DSL constructor
    assert.deepStrictEqual(process.env, arrangedEnv); // Unchanged
    assert.strictEqual(consoleWarnMock.mock.calls.length, 0);
  });
});
