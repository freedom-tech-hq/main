import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeIsoDateTime } from '../../utils/makeIsoDateTime.ts';
import { extractTimeMSecFromTimeId, timeIdInfo } from '../TimeId.ts';

describe('TimeId', () => {
  it('extractTimeMSecFromTimeId should work', (t: TestContext) => {
    const date = new Date();
    const timeId = timeIdInfo.make(`${makeIsoDateTime(date)}-12345678-0123-0123-0123-0123456789ab`);
    const timeMSec = extractTimeMSecFromTimeId(timeId);
    t.assert.strictEqual(timeMSec, date.getTime());
  });
});
