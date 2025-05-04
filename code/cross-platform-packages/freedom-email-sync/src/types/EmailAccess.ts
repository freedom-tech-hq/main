import type { UserKeys } from 'freedom-crypto-service';
import type { SaltsById } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { EmailUserId } from './EmailUserId.ts';

export interface EmailAccess {
  userId: EmailUserId;
  userKeys: UserKeys;
  saltsById: SaltsById;
  userFs: MutableSyncableStore;
}
