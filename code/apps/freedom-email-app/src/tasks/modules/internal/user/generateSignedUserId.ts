import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import { generateSignatureForString } from 'freedom-crypto';
import type { SigningKeySet } from 'freedom-crypto-data';
import type { EmailUserId } from 'freedom-email-sync';
import { emailUserIdInfo } from 'freedom-email-sync';

export const generateSignedUserId = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { signingKeys }: { signingKeys: SigningKeySet }): PR<EmailUserId> => {
    const baseUserId = makeUuid();
    const signature = await generateSignatureForString(trace, { value: baseUserId, signingKeys });
    if (!signature.ok) {
      return signature;
    }

    return makeSuccess(emailUserIdInfo.make(`${baseUserId}[${signature.value}]`));
  }
);
