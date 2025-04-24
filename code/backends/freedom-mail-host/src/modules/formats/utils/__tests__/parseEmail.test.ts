import { describe, it } from 'node:test';

import { expect } from 'expect';
import { makeTrace } from 'freedom-contexts';
import type { StoredMail } from 'freedom-email-sync';
import { getJsonFixture, getStringFixture } from 'freedom-testing-tools';

import { parseEmail } from '../parseEmail.ts';

describe('parseEmail', () => {
  it('handles a typical case', async () => {
    // Arrange
    const inEmail = getStringFixture(import.meta.dirname, '../../../../__tests__/fixtures/sample-natural.eml');
    const outEmail = getJsonFixture<StoredMail>(import.meta.dirname, '../../../../__tests__/fixtures/sample-natural-parsed.json');

    // Act
    const result = await parseEmail(makeTrace(), inEmail);

    // Assert
    expect(result).toStrictEqual({
      ok: true,
      value: {
        ...outEmail,
        timeMSec: expect.any(Number)
      }
    });
  });

  it('handles all fields', async () => {
    // Arrange
    // TODO: Revise all the fields and extend this synthetic sample
    const inEmail = getStringFixture(import.meta.dirname, '../../../../__tests__/fixtures/sample-all-fields.eml');
    const outEmail = getJsonFixture<StoredMail>(import.meta.dirname, '../../../../__tests__/fixtures/sample-all-fields-parsed.json');

    // Act
    const result = await parseEmail(makeTrace(), inEmail);

    // Assert
    expect(result).toStrictEqual({
      ok: true,
      value: {
        ...outEmail,
        timeMSec: expect.any(Number)
      }
    });
  });
});
