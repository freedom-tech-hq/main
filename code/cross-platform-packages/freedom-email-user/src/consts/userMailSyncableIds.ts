import type { Uuid } from 'freedom-basic-data';
import type { MailId } from 'freedom-email-sync';
import { mailSyncableIds } from 'freedom-email-sync';
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

export const collectionIds = {
  year: nest(({ year }: { year: number }): SyncableId => plainId('bundle', `${year}`), {
    month: ({ month }: { month: number }): SyncableId => plainId('bundle', `${month}`)
  })
};
export type CollectionIds = typeof collectionIds;

/** Server gets no access */
const collections = nest(emailAppSaltedId('bundle', 'collections'), {
  ...mailCollectionTypes.exclude('custom').reduce(
    (out, collectionType) => {
      out[collectionType] = nest(emailAppSaltedId('bundle', collectionType), collectionIds);
      return out;
    },
    {} as Record<Exclude<MailCollectionType, 'custom'>, Nested<SaltedId, CollectionIds>>
  ),
  custom: nest(emailAppSaltedId('bundle', 'custom'), {
    collectionId: (collectionId: CustomMailCollectionId): Nested<SyncableId, CollectionIds & { collectionMeta: SaltedId }> =>
      nest(prefixedUuidId('bundle', collectionId), {
        collectionMeta: emailAppSaltedId('bundle', 'collection-meta'),
        ...collectionIds
      })
  })
});

const routeProcessing = nest(emailAppSaltedId('bundle', 'routeProcessing'), {
  year: nest(({ year }: { year: number }): SyncableId => plainId('bundle', `${year}`), {
    processedHashesTrackingDoc: emailAppSaltedId('bundle', 'processed-hashes-tracking-doc'),
    month: nest(({ month }: { month: number }): SyncableId => plainId('bundle', `${month}`), {
      processedHashesTrackingDoc: emailAppSaltedId('bundle', 'processed-hashes-tracking-doc'),
      day: nest(({ day }: { day: number }): SyncableId => plainId('bundle', `${day}`), {
        processedHashesTrackingDoc: emailAppSaltedId('bundle', 'processed-hashes-tracking-doc'),
        hour: nest(({ hour }: { hour: number }): SyncableId => plainId('bundle', `${hour}`), {
          processedMailIdsTrackingDoc: emailAppSaltedId('bundle', 'processed-mail-ids-tracking-doc'),
          emailId: nest((mailId: MailId): SyncableId => prefixedUuidId('bundle', mailId), {
            summary: saltedId('file', 'summary.json'),
            detailed: saltedId('file', 'detailed.json'),
            attachments: nest(saltedId('bundle', 'attachments'), {
              attachmentId: nest((uuid?: Uuid): SyncableId => uuidId('bundle', uuid), {
                chunkId: (chunkNumber: number): SaltedId => saltedId('file', `chunk-${chunkNumber}`)
              })
            })
          })
        })
      })
    })
  })
});

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
