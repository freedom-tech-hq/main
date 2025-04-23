import { makeAsyncResultFunc, type PR, uncheckedResult } from 'freedom-async';

import type { User } from './getUserStore.ts';
import { getUserStore } from './getUserStore.ts';

export const findUserByEmail = makeAsyncResultFunc(
  [import.meta.filename, 'findUserByEmail'],
  async (trace, email: string): PR<User, 'not-found'> => {
    const userStore = await uncheckedResult(getUserStore(trace));

    return await userStore.object(email).get(trace);
  }
);
