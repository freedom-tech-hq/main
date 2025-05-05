import type { User } from 'freedom-db';
import type { MailId } from 'freedom-email-sync';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

export interface OutboundEmailHandlerArgs {
  user: User;
  syncableStore: MutableSyncableStore;
  emailIds: MailId[];
}
