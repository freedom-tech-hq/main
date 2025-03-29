import assert from 'node:assert';

export const expectDurationAtLeastMSec = async <R>(durationMSec: number, func: () => R | Promise<R>) => {
  const start = performance.now();
  const result = await func();
  const end = performance.now();

  assert.strictEqual(end - start >= durationMSec, true);

  return result;
};
