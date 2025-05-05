import { excludeFailureResult, type PR, type PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ONE_SEC_MSEC, sha256HashInfo } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import type { DeviceNotificationClient, DeviceNotifications } from 'freedom-device-notification-types';
import { makeApiFetchTask } from 'freedom-fetching';
import { NotificationManager } from 'freedom-notification-types';
import { api } from 'freedom-store-api-server-api';
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
import { getDefaultApiRoutingContext } from 'yaschema-api';

const registerWithRemote = makeApiFetchTask([import.meta.filename, 'registerWithRemote'], api.register.POST);
const pullFromRemote = makeApiFetchTask([import.meta.filename, 'pullFromRemote'], api.pull.POST);
const pushToRemote = makeApiFetchTask([import.meta.filename, 'pushToRemote'], api.push.POST);

interface RegisterArgs {
  name: string;
  storageRootId: StorageRootId;
  metadata: Omit<SyncableItemMetadata, 'name'>;
  creatorPublicKeys: CombinationCryptoKeySet;
  saltsById: SaltsById;
}

export interface RemoteConnection {
  readonly register: PRFunc<undefined, 'email-is-unavailable', [RegisterArgs]>;
  readonly remoteAccessor: RemoteAccessor;
  readonly deviceNotificationClient: DeviceNotificationClient;
  readonly start: PRFunc<{ stop: PRFunc<undefined> }>;
}

export const makeEmailServiceRemoteConnection = makeAsyncResultFunc([import.meta.filename], async (_trace): PR<RemoteConnection> => {
  let storageRootId: StorageRootId | undefined = undefined;
  const register = makeAsyncResultFunc(
    [import.meta.filename, 'register'],
    async (trace, args: RegisterArgs): PR<undefined, 'email-is-unavailable'> => {
      storageRootId = args.storageRootId;

      const registered = await disableLam(trace, ['already-created', 'conflict', 'email-is-unavailable'], (trace) =>
        registerWithRemote(trace, { body: args, context: getDefaultApiRoutingContext() })
      );
      if (!registered.ok) {
        // TODO: TEMP treating conflict as success until updated service is deployed
        if (registered.value.errorCode === 'conflict' || registered.value.errorCode === 'already-created') {
          // If there's a conflict, the account was probably already registered
          return makeSuccess(undefined);
        }
        // Pass through validation and not-found errors
        return generalizeFailureResult(trace, excludeFailureResult(registered, 'already-created'), 'conflict');
      }

      return makeSuccess(undefined);
    }
  );

  const puller: SyncPuller = makeAsyncResultFunc(
    [import.meta.filename, 'puller'],
    async (trace, body): PR<SyncPullResponse, 'not-found'> => {
      const pulled = await disableLam(trace, 'not-found', (trace) =>
        pullFromRemote(trace, { body: { ...body, sendData: body.sendData ?? false }, context: getDefaultApiRoutingContext() })
      );
      if (!pulled.ok) {
        return pulled;
      }

      return makeSuccess(pulled.value.body);
    },
    { disableLam: 'not-found' }
  );

  const pusher: SyncPusher = makeAsyncResultFunc(
    [import.meta.filename, 'pusher'],
    async (trace, body): PR<undefined, 'not-found'> => {
      // not-found happens during push fairly commonly when doing an initial sync to a server and simultaneously updating the client,
      // because the client will try to push newer content before the base folders have been initially pushed -- but this will
      // automatically get resolved as the initial sync continues
      const pushed = await disableLam(trace, 'not-found', (trace) => pushToRemote(trace, { body, context: getDefaultApiRoutingContext() }));
      if (!pushed.ok) {
        return pushed;
      }

      return makeSuccess(undefined);
    },
    { disableLam: 'not-found' }
  );

  // TODO: hook up a way to listen for changes
  const deviceNotificationClient = new NotificationManager<DeviceNotifications>();
  const triggerFakeContentChange = () => {
    deviceNotificationClient.notify(`contentChange:${new SyncablePath(storageRootId!).toString()}`, {
      hash: sha256HashInfo.make(makeUuid())
    });
  };

  let triggerFakeContentChangeInterval: ReturnType<typeof setInterval> | undefined;

  const stop = makeAsyncResultFunc([import.meta.filename, 'stop'], async (_trace): PR<undefined> => {
    clearInterval(triggerFakeContentChangeInterval);
    triggerFakeContentChangeInterval = undefined;

    return makeSuccess(undefined);
  });

  const start = makeAsyncResultFunc([import.meta.filename, 'start'], async (trace): PR<{ stop: PRFunc<undefined> }> => {
    await stop(trace);

    triggerFakeContentChangeInterval = setInterval(triggerFakeContentChange, 3 * ONE_SEC_MSEC);

    return makeSuccess({ stop });
  });

  return makeSuccess({ register, remoteAccessor: { puller, pusher }, deviceNotificationClient, start });
});
