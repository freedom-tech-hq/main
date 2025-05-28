import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeApiFetchTask } from 'freedom-fetching';
import type { Paginated } from 'freedom-paginated-data';
import type { types } from 'freedom-store-api-server-api';
import { api } from 'freedom-store-api-server-api';
import { getDefaultApiRoutingContext } from 'yaschema-api';

/**
 * Test task that calls the mail messages API endpoint and logs the results
 * This is a demonstration of directly calling an API endpoint from a task
 */
const getMessages = makeApiFetchTask([import.meta.filename, 'getMessages'], api.mail.messages.GET);

export const testNewApi = makeAsyncResultFunc([import.meta.filename], async (trace): PR<Paginated<types.mail.ListMessage>> => {
  console.log('Starting testNewApi task...');

  const result = await getMessages(trace, {
    query: {
      pageToken: undefined
    },
    context: getDefaultApiRoutingContext()
  });

  if (!result.ok) {
    console.log('Error fetching messages:', result.value);
    return result;
  }

  console.log('Successfully fetched messages:', result.value);

  return makeSuccess(result.value.body);
});
