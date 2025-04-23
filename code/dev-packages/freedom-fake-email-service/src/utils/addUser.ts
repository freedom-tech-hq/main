import { allResults, makeAsyncResultFunc, makeSuccess, type PR, uncheckedResult } from 'freedom-async';
import { forceSetObjectValue } from 'freedom-object-store-types';

import { getEmailByUserIdStore } from './getEmailByUserIdStore.ts';
import type { User } from './getUserStore.ts';
import { getUserStore } from './getUserStore.ts';

export const addUser = makeAsyncResultFunc([import.meta.filename, 'addUser'], async (trace, user: User): PR<User> => {
  const userStore = await uncheckedResult(getUserStore(trace));
  const emailByUserIdStore = await uncheckedResult(getEmailByUserIdStore(trace));

  const userAccessor = userStore.mutableObject(user.email);
  const emailByUserIdAccessor = emailByUserIdStore.mutableObject(user.userId);

  const set = await allResults(trace, [
    forceSetObjectValue(trace, userAccessor, user),
    forceSetObjectValue(trace, emailByUserIdAccessor, user.email)
  ]);
  if (!set.ok) {
    return set;
  }

  return makeSuccess(user);
});
