import { type SaltedId, saltedId, type SyncableSaltedIdSettings } from 'freedom-syncable-store-types';

import { EMAIL_APP_SALT_ID } from '../consts/salt-ids.ts';

export const emailAppSaltedId = (settings: SyncableSaltedIdSettings, plainId: string): SaltedId => {
  if (typeof settings === 'string') {
    return saltedId({ type: settings, defaultSaltId: EMAIL_APP_SALT_ID }, plainId);
  } else {
    return saltedId({ defaultSaltId: EMAIL_APP_SALT_ID, ...settings }, plainId);
  }
};
