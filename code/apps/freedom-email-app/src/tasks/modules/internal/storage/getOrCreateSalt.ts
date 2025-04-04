import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { MutableObjectStore } from 'freedom-object-store-types';
import type { SaltId } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

export const getOrCreateSalt = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, saltStore: MutableObjectStore<SaltId, string>, saltId: SaltId): PR<string> => {
    let salt = await disableLam(trace, 'not-found', (trace) => saltStore.object(saltId).get(trace));
    if (!salt.ok) {
      // If the salt isn't found, try to create it
      if (salt.value.errorCode === 'not-found') {
        const newSaltValue = makeUuid();
        const created = await disableLam(trace, 'conflict', (trace) => saltStore.mutableObject(saltId).create(trace, newSaltValue));
        if (!created.ok) {
          // If creation fails with a conflict, it means the salt was created by another process, try to get it again
          if (created.value.errorCode === 'conflict') {
            salt = await saltStore.object(saltId).get(trace);
            if (!salt.ok) {
              // If getting still fails, just return an error
              return generalizeFailureResult(trace, salt, 'not-found');
            }
          }
          return excludeFailureResult(created, 'conflict');
        }

        return makeSuccess(newSaltValue);
      }
      return excludeFailureResult(salt, 'not-found');
    }

    return makeSuccess(salt.value);
  }
);
