import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import { encryptedEmailCredentialSchema } from 'freedom-email-api';
import type { LocallyStoredCredentialId, Tasks } from 'freedom-email-tasks-web-worker';
import { stringify } from 'freedom-serialization';

import { makeBrowserDownloadData } from './makeBrowserDownloadData.ts';

export const makeBrowserDownloadLocallyStoredEncryptedEmailCredential = makeAsyncResultFunc(
  [import.meta.filename, 'onExportCredentialClick'],
  async (
    trace,
    { tasks, locallyStoredCredentialId }: { tasks: Tasks; locallyStoredCredentialId: LocallyStoredCredentialId }
  ): PR<undefined> => {
    if (tasks === undefined) {
      return makeSuccess(undefined); // Not ready
    }

    const encryptedCredential = await tasks.getLocallyStoredEncryptedEmailCredential(locallyStoredCredentialId);
    if (!encryptedCredential.ok) {
      if (encryptedCredential.value.errorCode === 'not-found') {
        return makeFailure(
          new InternalStateError(trace, { cause: new GeneralError(trace, undefined, encryptedCredential.value.errorCode) })
        );
      } else {
        return makeFailure(new GeneralError(trace, undefined, encryptedCredential.value.errorCode));
      }
    }

    const jsonString = await stringify(trace, encryptedCredential.value, encryptedEmailCredentialSchema);
    if (!jsonString.ok) {
      return jsonString;
    }

    return await makeBrowserDownloadData(trace, {
      data: jsonString.value,
      mimeType: 'application/json',
      filename: 'freedom-mail.credential'
    });
  }
);
