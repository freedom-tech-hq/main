import type { ChainableResult, PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, resolveChain } from 'freedom-async';
import { makeIsoDateTime, type Sha256Hash } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import { generateCryptoSignVerifyKeySet, generateSignedValue, isSignedValueValid } from 'freedom-crypto';
import type { PureSigningKeySet, PureVerifyingKeySet, TrustedTimeId } from 'freedom-crypto-data';
import { signedTimeIdSchema, signedTimeIdSignatureExtrasSchema, timeIdInfo, trustedTimeIdInfo } from 'freedom-crypto-data';
import { once } from 'lodash-es';

import type { TrustedTimeSource } from './TrustedTimeSource.ts';

export class InMemoryTrustedTimeSource implements TrustedTimeSource {
  private signingAndVerifyingKeys_: ChainableResult<PureSigningKeySet & PureVerifyingKeySet> | undefined = undefined;

  constructor(signingAndVerifyingKeys?: PureSigningKeySet & PureVerifyingKeySet) {
    this.signingAndVerifyingKeys_ = signingAndVerifyingKeys;
  }

  public readonly generateTrustedTimeId = makeAsyncResultFunc(
    [import.meta.filename, 'generateTrustedTimeId'],
    async (trace, { parentPathHash, contentHash }: { parentPathHash: Sha256Hash; contentHash: Sha256Hash }): PR<TrustedTimeId> => {
      const signingAndVerifyingKeys = await resolveChain(this.getSigningAndVerifyingKeys_(trace));
      if (!signingAndVerifyingKeys.ok) {
        return signingAndVerifyingKeys;
      }

      const signedTimeId = await generateSignedValue(trace, {
        value: timeIdInfo.make(`${makeIsoDateTime()}-${makeUuid()}`),
        valueSchema: timeIdInfo.schema,
        signatureExtras: { parentPathHash, contentHash },
        signatureExtrasSchema: signedTimeIdSignatureExtrasSchema,
        signingKeys: signingAndVerifyingKeys.value
      });
      if (!signedTimeId.ok) {
        return signedTimeId;
      }

      const serialization = await signedTimeIdSchema.serializeAsync(signedTimeId.value, { validation: 'hard' });
      if (serialization.error !== undefined) {
        return makeFailure(new InternalSchemaValidationError(trace, { message: serialization.error }));
      }

      return makeSuccess(trustedTimeIdInfo.make(serialization.serialized as string));
    }
  );

  public readonly isTrustedTimeIdValid = makeAsyncResultFunc(
    [import.meta.filename, 'isTrustedTimeIdValid'],
    async (
      trace,
      trustedTimeId: TrustedTimeId,
      { parentPathHash, contentHash }: { parentPathHash: Sha256Hash; contentHash: Sha256Hash }
    ): PR<boolean> => {
      const signingAndVerifyingKeys = await resolveChain(this.getSigningAndVerifyingKeys_(trace));
      if (!signingAndVerifyingKeys.ok) {
        return signingAndVerifyingKeys;
      }

      const serializedSignedTimeId = trustedTimeIdInfo.removePrefix(trustedTimeId);

      const deserialization = await signedTimeIdSchema.deserializeAsync(serializedSignedTimeId, { validation: 'hard' });
      if (deserialization.error !== undefined) {
        return makeSuccess(false);
      }

      return isSignedValueValid(
        trace,
        deserialization.deserialized,
        { parentPathHash, contentHash },
        { verifyingKeys: signingAndVerifyingKeys.value }
      );
    }
  );

  // Private Methods

  private readonly getSigningAndVerifyingKeys_ = (trace: Trace): ChainableResult<PureSigningKeySet & PureVerifyingKeySet> => {
    if (this.signingAndVerifyingKeys_ !== undefined) {
      return this.signingAndVerifyingKeys_;
    }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise<Result<PureSigningKeySet & PureVerifyingKeySet>>(async (resolve, reject) => {
      try {
        const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
        resolve(signingAndVerifyingKeys);
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(e);
      }
    });
  };
}

export const getDefaultInMemoryTrustedTimeSource = once(() => new InMemoryTrustedTimeSource());
