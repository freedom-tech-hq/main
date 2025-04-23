import { describe, it } from 'node:test';

import { expect } from 'expect';
import { makeTrace } from 'freedom-contexts';
import { getJsFixture, getStringFixture } from 'freedom-testing-tools';

import { parseEmail } from '../parseEmail.ts';

describe('parseEmail', () => {
  it('handles a typical case', async () => {
    // Arrange
    const inEmail = getStringFixture(import.meta.dirname, '../../../../__tests__/fixtures/sample.eml');
    const outEmail = await getJsFixture(import.meta.dirname, '../../../../__tests__/fixtures/sample-parsed.mjs');

    // Act
    const result = await parseEmail(makeTrace(), inEmail);

    // Assert
    expect(result).toStrictEqual({
      ok: true,
      value: outEmail
    });
  });
});
