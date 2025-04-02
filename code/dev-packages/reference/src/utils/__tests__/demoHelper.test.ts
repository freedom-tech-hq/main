import assert from 'node:assert';
import { describe, it } from 'node:test';

// Import the function to test
import { demoHelper } from '../demoHelper.ts';

describe('demoHelper', () => {
  it('should create an alternative magic string', async () => {
    // Act
    const result = demoHelper('the-value');

    // Assert
    assert.strictEqual(result, 'the-alt-magic: the-value');
  });
});
