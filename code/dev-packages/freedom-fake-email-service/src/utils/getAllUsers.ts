import { makeAsyncResultFunc, makeSuccess, type PR, uncheckedResult } from 'freedom-async';
import { objectValues } from 'freedom-cast';

import { getAllUserEmailAddresses } from './getAllUserEmailAddresses.ts';
import type { User } from './getUserStore.ts';
import { getUserStore } from './getUserStore.ts';

export const getAllUsers = makeAsyncResultFunc([import.meta.filename, 'getAllUsers'], async (trace): PR<User[]> => {
  const userStore = await uncheckedResult(getUserStore(trace));

  const allEmailAddresses = await getAllUserEmailAddresses(trace);
  if (!allEmailAddresses.ok) {
    return allEmailAddresses;
  }

  const got = await userStore.getMultiple(trace, allEmailAddresses.value);
  if (!got.ok) {
    return got;
  }

  return makeSuccess(objectValues(got.value.found).filter((v) => v !== undefined));
});
