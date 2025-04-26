import { makeAsyncResultFunc, type PR, uncheckedResult } from 'freedom-async';

import { getUserStore } from '../internal/utils/getUserStore.ts';
import type { User } from '../types/exports.ts';

export const findUserByEmail = makeAsyncResultFunc(
  [import.meta.filename, 'findUserByEmail'],
  async (trace, email: string): PR<User, 'not-found'> => {
    const userStore = await uncheckedResult(getUserStore(trace));

    return await userStore.object(email).get(trace);
  }
);
