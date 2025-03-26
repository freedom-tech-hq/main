import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectWithSortedKeys } from 'freedom-cast';

import { generateSha256HashForEmptyString } from './generateSha256HashForEmptyString.ts';
import { generateSha256HashFromString } from './generateSha256HashFromString.ts';

export const generateSha256HashFromHashesById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, hashesById: Partial<Record<string, Sha256Hash>>): PR<Sha256Hash> => {
    const stringValue = JSON.stringify(objectWithSortedKeys(hashesById));

    if (stringValue === '{}') {
      return await generateSha256HashForEmptyString(trace);
    }

    return await generateSha256HashFromString(trace, stringValue);
  }
);
