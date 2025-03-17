import { makeSuccess } from '../types/Result.ts';

/** Creates a no-op async function that always return `undefined` as a success result. */
export const noopAsyncResultFunc = async () => makeSuccess(undefined);
