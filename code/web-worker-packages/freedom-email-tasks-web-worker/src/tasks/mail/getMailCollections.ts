import type { PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { MailCollection, MailCollectionGroup } from 'freedom-email-user';
import { getCollectionIdsFromSaltedCollectionIds, getUserMailPaths, mailCollectionGroupIdInfo } from 'freedom-email-user';
import { getBundleAtPath } from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';
import type { GetMailCollection_GroupsAddedPacket } from '../../types/mail/getMailCollection/GetMailCollection_GroupsAddedPacket.ts';
import type { GetMailCollectionPacket } from '../../types/mail/getMailCollection/GetMailCollectionPacket.ts';

export const getMailCollections = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailCollectionPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailCollection_GroupsAddedPacket> => {
    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'groups-added' as const, groups: [] });
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);
    const collectionIdsFromSaltedCollectionIds = getCollectionIdsFromSaltedCollectionIds(paths);

    const mailCollectionsBundle = await getBundleAtPath(trace, userFs, paths.collections.value);
    if (!mailCollectionsBundle.ok) {
      return generalizeFailureResult(trace, mailCollectionsBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const collectionIds = await mailCollectionsBundle.value.getIds(trace, { type: 'bundle' });
    if (!collectionIds.ok) {
      return collectionIds;
    }

    const collections: MailCollection[] = [];

    for (const collectionId of collectionIds.value) {
      const collectionType = collectionIdsFromSaltedCollectionIds[collectionId];
      if (collectionType === undefined) {
        continue;
      }

      collections.push({
        collectionType,
        title: '',
        unreadCount: 0, // TODO: TEMP,
        customId: undefined // TODO: TEMP
      });
    }

    // TODO: put custom collections into a separate group
    const groups: MailCollectionGroup[] = [];
    groups.push({ id: mailCollectionGroupIdInfo.make(), collections });

    return makeSuccess({ type: 'groups-added' as const, groups });
  }
);
