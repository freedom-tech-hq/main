import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ONE_SEC_MSEC, sha256HashInfo } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { makeApiFetchTask } from 'freedom-fetching';
import { NotificationManager } from 'freedom-notification-types';
import { api } from 'freedom-store-api-server-api';
import type {
  ControllableRemoteConnection,
  PullItem,
  RemoteAccessor,
  RemoteChangeNotificationClient,
  RemoteChangeNotifications,
  StorageRootId,
  SyncPuller,
  SyncPusher
} from 'freedom-sync-types';
import { remoteIdInfo, SyncablePath } from 'freedom-sync-types';
import { getDefaultApiRoutingContext } from 'yaschema-api';

const pullFromRemote = makeApiFetchTask([import.meta.filename, 'pullFromRemote'], api.pull.POST);
const pushToRemote = makeApiFetchTask([import.meta.filename, 'pushToRemote'], api.push.POST);

export type EmailServiceRemoteConnection = ControllableRemoteConnection;

export const makeEmailServiceRemoteConnection = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, { storageRootId }: { storageRootId: StorageRootId }): PR<EmailServiceRemoteConnection> => {
    const remoteId = remoteIdInfo.make(makeUuid());

    const puller: SyncPuller = makeAsyncResultFunc(
      [import.meta.filename, 'puller'],
      async (trace, body): PR<PullItem, 'not-found'> => {
        const pulled = await pullFromRemote(trace, {
          body: { ...body, sendData: body.sendData ?? false },
          context: getDefaultApiRoutingContext()
        });
        if (!pulled.ok) {
          return pulled;
        }

        return makeSuccess(pulled.value.body);
      },
      { deepDisableLam: 'not-found' }
    );

    const pusher: SyncPusher = makeAsyncResultFunc(
      [import.meta.filename, 'pusher'],
      async (trace, body): PR<PullItem, 'not-found'> => {
        // not-found happens during push fairly commonly when doing an initial sync to a server and simultaneously updating the client,
        // because the client will try to push newer content before the base folders have been initially pushed -- but this will
        // automatically get resolved as the initial sync continues
        const pushed = await pushToRemote(trace, { body, context: getDefaultApiRoutingContext() });
        if (!pushed.ok) {
          return pushed;
        }

        return makeSuccess(pushed.value.body);
      },
      { deepDisableLam: 'not-found' }
    );

    // TODO: hook up a way to listen for changes
    const remoteChangeNotificationClient = new NotificationManager<RemoteChangeNotifications>() satisfies RemoteChangeNotificationClient;
    const triggerFakeContentChange = () => {
      remoteChangeNotificationClient.notify(`contentChange:${new SyncablePath(storageRootId!).toString()}`, {
        remoteId,
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

    const remoteAccessor: RemoteAccessor = { remoteId, puller, pusher };

    return makeSuccess({
      accessor: remoteAccessor,
      changeNotificationClient: remoteChangeNotificationClient,
      start
    });
  }
);
