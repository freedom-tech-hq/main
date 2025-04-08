import type { Uuid } from 'freedom-basic-data';
import { nest } from 'freedom-nest';
import type { SyncableId } from 'freedom-sync-types';
import { plainId, prefixedUuidId, uuidId } from 'freedom-sync-types';
import type { SaltedId } from 'freedom-syncable-store-types';
import { saltedId } from 'freedom-syncable-store-types';

import type { MailId } from '../types/MailId.ts';

// These are share with the server

/** Server gets append-only access */
const storage = nest(saltedId('folder', 'storage'), {
  year: nest(({ year }: { year: number }): SyncableId => plainId('bundle', `${year}`), {
    month: nest(({ month }: { month: number }): SyncableId => plainId('bundle', `${month}`), {
      date: nest(({ date }: { date: number }): SyncableId => plainId('bundle', `${date}`), {
        hour: nest(({ hour }: { hour: number }): SyncableId => plainId('bundle', `${hour}`), {
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

/** Server gets read-write access */
const out = nest(saltedId('folder', 'out'), {
  year: nest(({ year }: { year: number }): SyncableId => plainId('bundle', `${year}`), {
    month: nest(({ month }: { month: number }): SyncableId => plainId('bundle', `${month}`), {
      date: nest(({ date }: { date: number }): SyncableId => plainId('bundle', `${date}`), {
        hour: nest(({ hour }: { hour: number }): SyncableId => plainId('bundle', `${hour}`), {
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

/**
 * Ref: https://docs.google.com/document/d/1jNj7QtxoSJu14NiC8OjBmTd7iMd-5bKYyMKeq7XjbO0/edit?tab=t.0
 *
 * ```plaintext
 * /saltedId(storage) # folder, server only creates/appends
 *     /plainId(<year>) # bundle, utc
 *         /plainId(<month>)
 *             /plainId(<date>)
 *                 /plainId(<hour>)
 *                     /timeId()
 *                         /saltedId(summary.json)
 *                         /saltedId(detailed.json)
 *                         /saltedId(attachments) # only if needed
 *                             /<attachment-uuid>
 *                                 /saltedId(chunk-<chunkNumber>) # binary
 * /saltedId(out) # folder, server gets read/write access
 *     /plainId(<year>) # bundle
 *         /plainId(<month>)
 *             /plainId(<date>)
 *                 /plainId(<hour>)
 *                     /timeId()
 *                         /saltedId(summary.json)
 *                         /saltedId(detailed.json)
 *                         /saltedId(attachments) # only if needed
 *                             /<attachment-uuid>
 *                                 /saltedId(chunk-<chunkNumber>) # binary
 * ```
 */
export const mailSyncableIds = { storage, out };
