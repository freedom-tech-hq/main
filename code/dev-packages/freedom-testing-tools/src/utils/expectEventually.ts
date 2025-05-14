import assert from 'node:assert';

import { sleep } from './sleep.ts';

const ONE_SEC_MSEC = 1000;

export interface ExpectEventuallyOptions {
  timeoutMSec?: number;
  /**
   * The number of times the checker must pass in a row before the function returns successfully.
   *
   * @defaultValue `1`
   */
  minPassCount?: number;
  onTimeout?: () => Promise<void> | void;
}

export const expectEventually = async (
  check: () => Promise<void> | void,
  { timeoutMSec = 30 * ONE_SEC_MSEC, minPassCount = 1, onTimeout }: ExpectEventuallyOptions = {}
): Promise<void> => {
  let lastError: unknown = undefined;

  let successCount = 0;
  const start = performance.now();
  do {
    lastError = undefined;
    try {
      await check();
    } catch (e) {
      lastError = e;
    }

    if (lastError === undefined) {
      successCount += 1;
      if (successCount >= minPassCount) {
        return;
      }
    } else {
      successCount = 0;
    }

    await sleep(50);
  } while (performance.now() - start < timeoutMSec);

  await onTimeout?.();

  assert.fail(`Timed out after ${timeoutMSec}ms`);
};
