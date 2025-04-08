import { makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { emailUserIdInfo } from 'freedom-email-sync';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { storageRootIdInfo } from 'freedom-sync-types';
import { pullPath } from 'freedom-syncable-store-types';

import { getOrCreateEmailAccessForUser } from '../utils/getOrCreateEmailAccessForUser.ts';

export default makeHttpApiHandler([import.meta.filename], { api: api.pull.POST }, async (trace, { input: { body: args } }) => {
  const userId = emailUserIdInfo.checked(storageRootIdInfo.removePrefix(args.path.storageRootId));
  if (userId === undefined) {
    return makeFailure(new InputSchemaValidationError(trace, { message: 'Expected a valid EmailUserId' }));
  }

  const access = await getOrCreateEmailAccessForUser(trace, { userId });
  if (!access.ok) {
    return access;
  }

  const userFs = access.value.userFs;

  const pulled = await pullPath(trace, userFs, args);
  if (!pulled.ok) {
    return pulled;
  }

  return makeSuccess({ body: pulled.value });
});
