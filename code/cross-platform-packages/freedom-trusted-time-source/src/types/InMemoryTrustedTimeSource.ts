import type { ChainableResult, PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, resolveChain } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import { generateCryptoSignVerifyKeySet, generateSignatureForValue, isSignatureValidForValue } from 'freedom-crypto';
import type { PureSigningKeySet, PureVerifyingKeySet } from 'freedom-crypto-data';
import { once } from 'lodash-es';

import { type TrustedTimeSignatureParams, trustedTimeSignatureParamsSchema } from './TrustedTimeSignatureParams.ts';
import type { TrustedTimeSource } from './TrustedTimeSource.ts';

export class InMemoryTrustedTimeSource implements TrustedTimeSource {
  private signingAndVerifyingKeys_: ChainableResult<PureSigningKeySet & PureVerifyingKeySet> | undefined = undefined;

  constructor(signingAndVerifyingKeys?: PureSigningKeySet & PureVerifyingKeySet) {
    this.signingAndVerifyingKeys_ = signingAndVerifyingKeys;
  }

  public readonly generateTrustedTimeSignature = makeAsyncResultFunc(
    [import.meta.filename, 'generateTrustedTimeSignature'],
    async (trace, params: TrustedTimeSignatureParams): PR<Base64String> => {
      const signingAndVerifyingKeys = await resolveChain(this.getSigningAndVerifyingKeys_(trace));
      if (!signingAndVerifyingKeys.ok) {
        return signingAndVerifyingKeys;
      }

      return await generateSignatureForValue(trace, {
        value: params,
        valueSchema: trustedTimeSignatureParamsSchema,
        signatureExtras: undefined,
        signatureExtrasSchema: undefined,
        signingKeys: signingAndVerifyingKeys.value
      });
    }
  );

  public readonly isTrustedTimeSignatureValid = makeAsyncResultFunc(
    [import.meta.filename, 'isTrustedTimeSignatureValid'],
    async (trace, trustedTimeSignature: Base64String, params: TrustedTimeSignatureParams): PR<boolean> => {
      const signingAndVerifyingKeys = await resolveChain(this.getSigningAndVerifyingKeys_(trace));
      if (!signingAndVerifyingKeys.ok) {
        return signingAndVerifyingKeys;
      }

      return await isSignatureValidForValue(trace, {
        signature: trustedTimeSignature,
        value: params,
        valueSchema: trustedTimeSignatureParamsSchema,
        signatureExtras: undefined,
        signatureExtrasSchema: undefined,
        verifyingKeys: signingAndVerifyingKeys.value
      });
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
