import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('demoMockingSubject', async () => {
  // Mock dependencies and load the subject
  const mockedDemoHelper = mock.fn(() => 'the-mocked-alt-magic');
  mock.module('../demoHelper.ts', {
    namedExports: {
      demoHelper: mockedDemoHelper
    }
  });
  const { demoMockingSubject } = await import('../demoMockingSubject.ts');

  beforeEach(() => {
    mockedDemoHelper.mock.resetCalls();
  });

  it('should create a magic string and use demoHelper', async () => {
     // Act
    const result = demoMockingSubject('the-a', 'the-b');

    // Assert
    assert.strictEqual(result, 'the-magic: the-a, the-mocked-alt-magic');
  });

  it('can illustrate mock verification', async () => {
    // Arrange

    // Act
    demoMockingSubject('the-a', 'the-b');

    // Assert
    assert.strictEqual(mockedDemoHelper.mock.calls.length, 1);
    assert.deepStrictEqual(mockedDemoHelper.mock.calls[0].arguments, ['the-b']);
  });
});
