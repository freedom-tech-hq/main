import { makeAsyncResultFunc, type PR, uncheckedResult } from 'freedom-async';

import { getUserStore } from './getUserStore.ts';

export const getAllUserEmailAddresses = makeAsyncResultFunc(
  [import.meta.filename, 'getAllUserEmailAddresses'],
  async (trace): PR<string[]> => {
    const userStore = await uncheckedResult(getUserStore(trace));

    return await userStore.keys.asc().keys(trace);
  }
);
