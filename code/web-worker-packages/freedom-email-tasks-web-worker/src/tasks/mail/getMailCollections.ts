import type { PR, Result, SuccessResult } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { MailCollection, MailCollectionGroup } from 'freedom-email-user';
import { mailCollectionGroupIdInfo } from 'freedom-email-user';
import type { TypeOrPromisedType } from 'yaschema';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import type { GetMailCollection_GroupsAddedPacket } from '../../types/mail/getMailCollection/GetMailCollection_GroupsAddedPacket.ts';
import type { GetMailCollectionPacket } from '../../types/mail/getMailCollection/GetMailCollectionPacket.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export const getMailCollections = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailCollectionPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailCollection_GroupsAddedPacket> => {
    DEV: if (isDemoMode()) {
      return makeDemoModeResult();
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'groups-added' as const, groups: [] });
    }

    // const syncableStore = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    // const paths = await getUserMailPaths(syncableStore);
    // const collectionIdsFromSaltedCollectionIds = getCollectionIdsFromSaltedCollectionIds(paths);

    // const mailCollectionsBundle = await getBundleAtPath(trace, syncableStore, paths.collections.value);
    // if (!mailCollectionsBundle.ok) {
    //   return generalizeFailureResult(trace, mailCollectionsBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    // }

    // const collectionIds = await mailCollectionsBundle.value.getIds(trace, { type: 'bundle' });
    // if (!collectionIds.ok) {
    //   return collectionIds;
    // }

    const collections: MailCollection[] = [
      { collectionType: 'inbox', title: '', unreadCount: 0, customId: undefined },
      { collectionType: 'sent', title: '', unreadCount: 0, customId: undefined },
      { collectionType: 'archive', title: '', unreadCount: 0, customId: undefined },
      { collectionType: 'spam', title: '', unreadCount: 0, customId: undefined },
      { collectionType: 'trash', title: '', unreadCount: 0, customId: undefined }
    ];

    // for (const collectionId of collectionIds.value) {
    //   const collectionType = collectionIdsFromSaltedCollectionIds[collectionId];
    //   if (collectionType === undefined) {
    //     continue;
    //   }

    //   collections.push({
    //     collectionType,
    //     title: '',
    //     unreadCount: 0, // TODO: TEMP,
    //     customId: undefined // TODO: TEMP
    //   });
    // }

    // TODO: put custom collections into a separate group
    const groups: MailCollectionGroup[] = [];
    groups.push({ id: mailCollectionGroupIdInfo.make(), collections });

    return makeSuccess({ type: 'groups-added' as const, groups });
  }
);

// Helpers

let makeDemoModeResult = (): SuccessResult<GetMailCollection_GroupsAddedPacket> => {
  throw new Error();
};

DEV: makeDemoModeResult = () => {
  const collections: MailCollection[] = [
    { collectionType: 'inbox', title: '', unreadCount: Math.floor(Math.random() * 10), customId: undefined },
    { collectionType: 'sent', title: '', unreadCount: Math.floor(Math.random() * 10), customId: undefined },
    { collectionType: 'archive', title: '', unreadCount: Math.floor(Math.random() * 10), customId: undefined },
    { collectionType: 'spam', title: '', unreadCount: Math.floor(Math.random() * 10), customId: undefined },
    { collectionType: 'trash', title: '', unreadCount: Math.floor(Math.random() * 10), customId: undefined }
  ];

  const groups: MailCollectionGroup[] = [];
  groups.push({ id: mailCollectionGroupIdInfo.make(), collections });

  return makeSuccess({ type: 'groups-added', groups });
};
