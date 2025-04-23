import assert from 'node:assert';
import { describe, it } from 'node:test';

import { getJsFixture, getStringFixture } from 'freedom-testing-tools';

import { parseEmail } from '../parseEmail.ts';

describe('parseEmail', () => {
  it('handles a typical case', async () => {
    // Arrange
    const inEmail = getStringFixture(import.meta.dirname, '../../../../__tests__/fixtures/sample.eml');
    const outEmail = await getJsFixture(import.meta.dirname, '../../../../__tests__/fixtures/sample-parsed.mjs');

    // Act
    const result = await parseEmail(inEmail);

    // Assert
    assert.deepStrictEqual(result, outEmail);
  });
});
