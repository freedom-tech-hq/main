import type { DbUser } from 'freedom-db';
import type { MailId } from 'freedom-email-sync';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

export interface OutboundEmailHandlerArgs {
  user: DbUser;
  syncableStore: MutableSyncableStore;
  emailIds: MailId[];
}
