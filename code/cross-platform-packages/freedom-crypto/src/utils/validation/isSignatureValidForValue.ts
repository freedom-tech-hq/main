import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import type { VerifyingKeySet } from 'freedom-crypto-data';
import { serialize } from 'freedom-serialization';
import type { JsonValue, Schema } from 'yaschema';
import { schema } from 'yaschema';

import { isSignatureValidForString } from './isSignatureValidForString.ts';

export const isSignatureValidForValue = makeAsyncResultFunc(
  [import.meta.filename],
  async <T, SignatureExtrasT = never>(
    trace: Trace,
    {
      signature,
      value,
      valueSchema,
      signatureExtras,
      signatureExtrasSchema,
      verifyingKeys
    }: {
      signature: Base64String;
      value: T;
      valueSchema: Schema<T>;
      signatureExtras: [SignatureExtrasT] extends [never] ? undefined : NoInfer<SignatureExtrasT>;
      signatureExtrasSchema: [SignatureExtrasT] extends [never] ? undefined : Schema<SignatureExtrasT>;
      verifyingKeys: VerifyingKeySet;
    }
  ): PR<boolean> => {
    try {
      let serialized: JsonValue;
      if (signatureExtras === undefined || signatureExtrasSchema === undefined) {
        const serialization = await serialize(trace, value, valueSchema);
        if (!serialization.ok) {
          return serialization;
        }

        serialized = serialization.value.serializedValue;
      } else {
        const serialization = await serialize(
          trace,
          { value, extras: signatureExtras },
          schema.object_noAutoOptional<{ value: T; extras: SignatureExtrasT }>({
            value: valueSchema,
            extras: signatureExtrasSchema
          })
        );
        if (!serialization.ok) {
          return serialization;
        }

        serialized = serialization.value.serializedValue;
      }

      const jsonString = JSON.stringify(serialized);

      return await isSignatureValidForString(trace, { signature, value: jsonString, verifyingKeys });
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
