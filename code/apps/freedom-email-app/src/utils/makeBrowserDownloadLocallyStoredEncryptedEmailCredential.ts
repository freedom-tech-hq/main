import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Tasks } from 'freedom-email-tasks-web-worker';

import { makeBrowserDownloadData } from './makeBrowserDownloadData.ts';

export const makeBrowserDownloadLocallyStoredEncryptedEmailCredential = makeAsyncResultFunc(
  [import.meta.filename, 'onExportCredentialClick'],
  async (trace, { tasks, credentialUuid }: { tasks: Tasks; credentialUuid: Uuid }): PR<undefined> => {
    if (tasks === undefined) {
      return makeSuccess(undefined); // Not ready
    }

    const encryptedEmailCredential = await tasks.getLocallyStoredEncryptedEmailCredential(credentialUuid);
    if (!encryptedEmailCredential.ok) {
      return generalizeFailureResult(trace, encryptedEmailCredential, 'not-found');
    }

    return await makeBrowserDownloadData(trace, {
      data: encryptedEmailCredential.value,
      mimeType: 'text/plain',
      filename: 'freedom-mail.credential'
    });
  }
);
