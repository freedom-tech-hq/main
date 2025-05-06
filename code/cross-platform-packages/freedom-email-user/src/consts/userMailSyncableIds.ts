import type { Uuid } from 'freedom-basic-data';
import type { MailId } from 'freedom-email-sync';
import { mailSyncableIds, makeTimeOrganizedIds } from 'freedom-email-sync';
import type { Nested } from 'freedom-nest';
import { nest } from 'freedom-nest';
import type { SyncableId } from 'freedom-sync-types';
import { plainId, prefixedTimeId, prefixedUuidId, uuidId } from 'freedom-sync-types';
import type { SaltedId } from 'freedom-syncable-store-types';
import { saltedId } from 'freedom-syncable-store-types';

import type { CustomMailCollectionId } from '../types/CustomMailCollectionId.ts';
import type { MailCollectionType } from '../types/MailCollectionType.ts';
import { mailCollectionTypes } from '../types/MailCollectionType.ts';
import type { MailDraftId } from '../types/MailDraftId.ts';
import { emailAppSaltedId } from '../utils/emailAppSaltedId.ts';

// The server doesn't need to know about any of the following, so they'll use a different salt

const markerFileIds = {
  mailId: (mailId: MailId): SyncableId => prefixedUuidId({ type: 'file', encrypted: false }, mailId)
};
export type MarkerFileIds = typeof markerFileIds;

export const timeOrganizedMarkerIds = makeTimeOrganizedIds({
  yearContent: {},
  monthContent: {},
  dayContent: {},
  hourContent: markerFileIds
});
export type TimeOrganizedMarkerIds = typeof timeOrganizedMarkerIds;

/** Server gets no access */
const collections = nest(emailAppSaltedId('bundle', 'collections'), {
  ...mailCollectionTypes.exclude('custom').reduce(
    (collections, collectionType) => {
      collections[collectionType] = nest(emailAppSaltedId('bundle', collectionType), timeOrganizedMarkerIds);
      return collections;
    },
    {} as Record<Exclude<MailCollectionType, 'custom'>, Nested<SaltedId, TimeOrganizedMarkerIds>>
  ),
  custom: nest(emailAppSaltedId('bundle', 'custom'), {
    collectionId: (collectionId: CustomMailCollectionId): Nested<SyncableId, TimeOrganizedMarkerIds & { collectionMeta: SaltedId }> =>
      nest(prefixedUuidId('bundle', collectionId), {
        collectionMeta: emailAppSaltedId('bundle', 'collection-meta'),
        ...timeOrganizedMarkerIds
      })
  })
});

const routeProcessing = nest(emailAppSaltedId('bundle', 'routeProcessing'), timeOrganizedMarkerIds);

/** Server gets no access */
const drafts = nest(emailAppSaltedId('bundle', 'drafts'), {
  draftId: (draftId: MailDraftId) =>
    nest(prefixedTimeId('bundle', draftId), {
      draft: emailAppSaltedId('bundle', 'draft'),
      attachments: nest(saltedId('bundle', 'attachments'), {
        attachmentId: nest((uuid?: Uuid): SyncableId => uuidId('bundle', uuid), {
          chunkId: (chunkNumber: number): SaltedId => emailAppSaltedId('file', `chunk-${chunkNumber}`)
        })
      })
    })
});

/** Server gets no access */
const indexes = nest(emailAppSaltedId('bundle', 'indexes'), {
  mailIdsByMessageId: nest(emailAppSaltedId('bundle', 'mail-ids-by-message-id'), {
    year: nest(({ year }: { year: number }): SyncableId => plainId('bundle', `${year}`), {
      month: ({ month }: { month: number }): SyncableId => plainId('bundle', `${month}`)
    })
  })
});

/** Server gets no access */
const threads = nest(emailAppSaltedId('bundle', 'threads'), {
  year: nest(({ year }: { year: number }): SyncableId => plainId('bundle', `${year}`), {
    month: ({ month }: { month: number }): SyncableId => plainId('bundle', `${month}`)
  })
});

/** See SYNCABLE_MAIL_STORAGE.md */

export const userMailSyncableIds = { ...mailSyncableIds, collections, routeProcessing, drafts, indexes, threads };
