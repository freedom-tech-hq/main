import { makeUuid } from 'freedom-contexts';
import { emailUserIdInfo } from 'freedom-email-sync';
import type { SaltsById } from 'freedom-sync-types';
import { createStoreTestStack } from 'freedom-syncable-store/tests';

import { EMAIL_APP_SALT_ID } from '../consts/salt-ids.ts';

export async function createEmailStoreTestStack() {
  // TODO: Make realistic and freeze as a fixture
  const userId = emailUserIdInfo.make('the-user[the-signature]');
  const extraSaltsById: SaltsById = { [EMAIL_APP_SALT_ID]: makeUuid() };

  // General-purpose Stack
  const stack = await createStoreTestStack({ extraSaltsById });

  return {
    ...stack,

    // User Credentials
    userId
  };
}
