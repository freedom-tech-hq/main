import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ONE_SEC_MSEC, sha256HashInfo } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import type { DeviceNotificationClient, DeviceNotifications } from 'freedom-device-notification-types';
import { api } from 'freedom-fake-email-service-api';
import { makeApiFetchTask } from 'freedom-fetching';
import { NotificationManager } from 'freedom-notification-types';
import {
  type RemoteAccessor,
  type SaltsById,
  type StorageRootId,
  type SyncableItemMetadata,
  SyncablePath,
  type SyncPuller,
  type SyncPullResponse,
  type SyncPusher
} from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import type { InferHttpRequestBodyType } from 'yaschema-api';
import { getDefaultApiRoutingContext, setDefaultUrlBase } from 'yaschema-api';

const registerWithRemote = makeApiFetchTask([import.meta.filename], api.register.POST);
const pullFromRemote = makeApiFetchTask([import.meta.filename], api.pull.POST);
const pushToRemote = makeApiFetchTask([import.meta.filename], api.push.POST);

interface RegisterArgs {
  storageRootId: StorageRootId;
  metadata: Omit<SyncableItemMetadata, 'name'>;
  creatorPublicKeys: CombinationCryptoKeySet;
  saltsById: SaltsById;
}

export interface RemoteConnection {
  readonly register: PRFunc<undefined, 'conflict', [RegisterArgs]>;
  readonly remoteAccessor: RemoteAccessor;
  readonly deviceNotificationClient: DeviceNotificationClient;
  readonly stop: () => void;
}

export const startLocalFakeEmailServiceSyncing = makeAsyncResultFunc([import.meta.filename], async (_trace): PR<RemoteConnection> => {
  // TODO: TEMP
  setDefaultUrlBase('https://mail.local.dev.freedommail.me:8443');

  let storageRootId: StorageRootId | undefined = undefined;
  const register = makeAsyncResultFunc([import.meta.filename, 'register'], async (trace, args: RegisterArgs): PR<undefined, 'conflict'> => {
    storageRootId = args.storageRootId;

    const registered = await disableLam(trace, 'conflict', (trace) =>
      registerWithRemote(trace, { body: args, context: getDefaultApiRoutingContext() })
    );
    if (!registered.ok) {
      if (registered.value.errorCode === 'conflict') {
        // If there's a conflict, the account was probably already registered
        return makeSuccess(undefined);
      }
      return registered;
    }

    return makeSuccess(undefined);
  });

  const puller: SyncPuller = makeAsyncResultFunc(
    [import.meta.filename, 'puller'],
    async (trace, { path, hash, sendData = false }): PR<SyncPullResponse, 'not-found'> => {
      const pulled = await pullFromRemote(trace, { body: { path, hash, sendData }, context: getDefaultApiRoutingContext() });
      if (!pulled.ok) {
        return pulled;
      }

      return makeSuccess(pulled.value.body);
    }
  );

  const pusher: SyncPusher = makeAsyncResultFunc(
    [import.meta.filename, 'pusher'],
    async (trace, { type, path, data, metadata }): PR<undefined> => {
      const body = { type, path, data, metadata } as InferHttpRequestBodyType<typeof api.push.POST>;

      const pushed = await pushToRemote(trace, { body, context: getDefaultApiRoutingContext() });
      if (!pushed.ok) {
        return pushed;
      }

      return makeSuccess(undefined);
    }
  );

  // TODO: hook up a way to listen for changes
  const deviceNotificationClient = new NotificationManager<DeviceNotifications>();
  const triggerFakeContentChange = () => {
    deviceNotificationClient.notify(`contentChange:${new SyncablePath(storageRootId!).toString()}`, {
      hash: sha256HashInfo.make(makeUuid())
    });
  };
  const interval = setInterval(triggerFakeContentChange, 3 * ONE_SEC_MSEC);

  const stop = () => {
    clearInterval(interval);
    // TODO: hook this up to something
  };

  return makeSuccess({ register, remoteAccessor: { puller, pusher }, deviceNotificationClient, stop });
});
