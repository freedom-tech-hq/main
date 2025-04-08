import type { PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getCollectionIdsFromSaltedCollectionIds, getUserMailPaths } from 'freedom-email-user';
import { getBundleAtPath } from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

import type { MailCollection } from '../../../modules/mail-types/MailCollection.ts';
import type { MailCollectionGroup } from '../../../modules/mail-types/MailCollectionGroup.ts';
import type { MailCollectionGroupId } from '../../../modules/mail-types/MailCollectionGroupId.ts';
import { mailCollectionGroupIdInfo } from '../../../modules/mail-types/MailCollectionGroupId.ts';
import type { SelectableMailCollectionId } from '../../../modules/mail-types/SelectableMailCollectionId.ts';
import { useActiveUserId } from '../../contexts/active-user-id.ts';
import { getOrCreateEmailAccessForUser } from '../internal/user/getOrCreateEmailAccessForUser.ts';

export interface GetMailCollection_GroupsAddedPacket {
  readonly type: 'groups-added';
  readonly groups: MailCollectionGroup[];
}

export interface GetMailCollection_GroupsRemovedPacket {
  readonly type: 'groups-removed';
  readonly ids: MailCollectionGroupId[];
}

export interface GetMailCollection_CollectionsAddedPacket {
  readonly type: 'collections-added';
  readonly byGroupId: Record<MailCollectionGroupId, MailCollection[]>;
}

export interface GetMailCollection_CollectionsRemovedPacket {
  readonly type: 'collections-removed';
  readonly idsByGroupId: Record<MailCollectionGroupId, SelectableMailCollectionId[]>;
}

export type GetMailCollectionPacket =
  | GetMailCollection_GroupsAddedPacket
  | GetMailCollection_GroupsRemovedPacket
  | GetMailCollection_CollectionsAddedPacket
  | GetMailCollection_CollectionsRemovedPacket;

export const getMailCollections = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailCollectionPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailCollection_GroupsAddedPacket> => {
    const activeUserId = useActiveUserId(trace);

    if (activeUserId.userId === undefined) {
      return makeSuccess({ type: 'groups-added' as const, groups: [] });
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, { userId: activeUserId.userId }));

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
