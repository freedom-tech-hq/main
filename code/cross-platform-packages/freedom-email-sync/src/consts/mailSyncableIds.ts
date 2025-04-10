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
      day: nest(({ day }: { day: number }): SyncableId => plainId('bundle', `${day}`), {
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
      day: nest(({ day }: { day: number }): SyncableId => plainId('bundle', `${day}`), {
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

/** See SYNCABLE_MAIL_STORAGE.md */
export const mailSyncableIds = { storage, out };
