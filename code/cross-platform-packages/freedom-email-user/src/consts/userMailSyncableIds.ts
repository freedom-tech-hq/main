import { mailSyncableIds } from 'freedom-email-sync';
import type { Nested } from 'freedom-nest';
import { nest } from 'freedom-nest';
import type { SyncableId } from 'freedom-sync-types';
import { plainId, prefixedUuidId } from 'freedom-sync-types';
import type { SaltedId } from 'freedom-syncable-store-types';
import { saltedId } from 'freedom-syncable-store-types';

import type { CustomMailCollectionId } from '../types/CustomMailCollectionId.ts';
import type { MailCollectionType } from '../types/MailCollectionType.ts';
import { mailCollectionTypes } from '../types/MailCollectionType.ts';
import { EMAIL_APP_SALT_ID } from './salt-ids.ts';

// The server doesn't need to know about any of the following, so they'll use a different salt

export const collectionIds = {
  year: nest(({ year }: { year: number }): SyncableId => plainId('bundle', `${year}`), {
    month: ({ month }: { month: number }): SyncableId => plainId('bundle', `${month}`)
  })
};
export type CollectionIds = typeof collectionIds;

/** Server gets no access */
const collections = nest(saltedId({ type: 'bundle', defaultSaltId: EMAIL_APP_SALT_ID }, 'collections'), {
  ...mailCollectionTypes.exclude('custom').reduce(
    (out, collectionType) => {
      out[collectionType] = nest(saltedId('bundle', collectionType), collectionIds);
      return out;
    },
    {} as Record<Exclude<MailCollectionType, 'custom'>, Nested<SaltedId, CollectionIds>>
  ),
  custom: nest(saltedId('bundle', 'custom'), {
    collectionId: (collectionId: CustomMailCollectionId): Nested<SyncableId, CollectionIds & { collectionMeta: SaltedId }> =>
      nest(prefixedUuidId('bundle', collectionId), {
        collectionMeta: saltedId('bundle', 'collection-meta'),
        ...collectionIds
      })
  })
});

/** Server gets no access */
const indexes = nest(saltedId({ type: 'bundle', defaultSaltId: EMAIL_APP_SALT_ID }, 'indexes'), {
  emailUuidsByMessageId: nest(saltedId('bundle', 'email-uuids-by-message-id'), {
    year: nest(({ year }: { year: number }): SyncableId => plainId('bundle', `${year}`), {
      month: ({ month }: { month: number }): SyncableId => plainId('bundle', `${month}`)
    })
  })
});

/** Server gets no access */
const threads = nest(saltedId({ type: 'bundle', defaultSaltId: EMAIL_APP_SALT_ID }, 'threads'), {
  year: nest(({ year }: { year: number }): SyncableId => plainId('bundle', `${year}`), {
    month: ({ month }: { month: number }): SyncableId => plainId('bundle', `${month}`)
  })
});

/**
 * Ref: https://docs.google.com/document/d/1jNj7QtxoSJu14NiC8OjBmTd7iMd-5bKYyMKeq7XjbO0/edit?tab=t.0
 *
 * ```plaintext
 * /saltedId(collections) # bundle
 *     /<collection-uuid>
 *         /plainId(<year>)
 *             /plainId(<month>) # Collection Doc CRDT
 *
 * /saltedId(indexes) # bundle
 *     /saltedId(email-uuids-by-message-id)
 *         /plainId(<year>)
 *             /plainId(<month>) # Email UUIDs by Message ID Doc CRDT
 *
 * /saltedId(threads) # bundle
 *     /plainId(<year>)
 *         /plainId(<month>) # Thread Doc CRDT
 * ```
 */
export const userMailSyncableIds = { ...mailSyncableIds, collections, indexes, threads };
