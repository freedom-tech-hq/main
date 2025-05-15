import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeApiFetchTask } from 'freedom-fetching';
import { api } from 'freedom-store-api-server-api';
import { getDefaultApiRoutingContext } from 'yaschema-api';

const checkNameAvailabilityWithRemote = makeApiFetchTask(
  [import.meta.filename, 'checkNameAvailabilityWithRemote'],
  api.checkNameAvailability.GET
);

export const checkEmailAvailability = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { emailUsername }: { emailUsername: string }): PR<{ available: boolean }> => {
    const result = await checkNameAvailabilityWithRemote(trace, { query: { name: emailUsername }, context: getDefaultApiRoutingContext() });
    if (!result.ok) {
      return result;
    }

    return makeSuccess({ available: result.value.body.available });
  }
);
