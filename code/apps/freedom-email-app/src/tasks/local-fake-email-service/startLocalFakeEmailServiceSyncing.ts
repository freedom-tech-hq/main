import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { api } from 'freedom-fake-email-service-api';
import { makeApiFetchTask } from 'freedom-fetching';
import type { SyncPuller, SyncPullResponse, SyncPusher } from 'freedom-sync-types';
import type { InferHttpRequestBodyType } from 'yaschema-api';
import { getDefaultApiRoutingContext, setDefaultUrlBase } from 'yaschema-api';

const pullFromRemote = makeApiFetchTask([import.meta.filename], api.pull.POST);
const pushToRemote = makeApiFetchTask([import.meta.filename], api.push.POST);

export interface RemoteConnection {
  readonly puller: SyncPuller;
  readonly pusher: SyncPusher;
  readonly stop: () => void;
}

export const startLocalFakeEmailServiceSyncing = makeAsyncResultFunc([import.meta.filename], async (_trace): PR<RemoteConnection> => {
  // TODO: TEMP
  setDefaultUrlBase('https://mail.local.dev.freedommail.me:8443');

  const puller: SyncPuller = makeAsyncResultFunc(
    [import.meta.filename, 'puller'],
    async (trace, { remoteId, path, hash, sendData = false }): PR<SyncPullResponse, 'not-found'> => {
      const pulled = await pullFromRemote(trace, { body: { remoteId, path, hash, sendData }, context: getDefaultApiRoutingContext() });
      if (!pulled.ok) {
        return pulled;
      }

      return makeSuccess(pulled.value.body);
    }
  );

  const pusher: SyncPusher = makeAsyncResultFunc(
    [import.meta.filename, 'pusher'],
    async (trace, { remoteId, type, path, data, metadata }): PR<undefined> => {
      const body = { remoteId, type, path, data, metadata } as InferHttpRequestBodyType<typeof api.push.POST>;

      const pushed = await pushToRemote(trace, { body, context: getDefaultApiRoutingContext() });
      if (!pushed.ok) {
        return pushed;
      }

      return makeSuccess(undefined);
    }
  );

  const stop = () => {
    // TODO: hook this up to something
  };

  return makeSuccess({ puller, pusher, stop });
});
