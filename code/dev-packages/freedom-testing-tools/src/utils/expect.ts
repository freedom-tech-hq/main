import assert from 'node:assert';

export const expectEqual = <T>(value: T, expected: T, msg?: string) => assert.equal(value, expected, msg);
export const expectStrictEqual = <T>(value: T, expected: T, msg?: string) => assert.strictEqual(value, expected, msg);
export const expectDeepEqual = <T>(value: T, expected: T, msg?: string) => assert.deepEqual(value, expected, msg);
export const expectDeepStrictEqual = <T>(value: T, expected: T, msg?: string) => assert.deepStrictEqual(value, expected, msg);
