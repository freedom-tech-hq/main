import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import type { SigningKeySet, SigningMode } from 'freedom-crypto-data';
import { serialize } from 'freedom-serialization';
import type { JsonValue, Schema } from 'yaschema';
import { schema } from 'yaschema';

import { generateSignatureForString } from './generateSignatureForString.ts';

export const generateSignatureForValue = makeAsyncResultFunc(
  [import.meta.filename],
  async <T, SignatureExtrasT = never>(
    trace: Trace,
    {
      mode,
      value,
      valueSchema,
      signatureExtras,
      signatureExtrasSchema,
      signingKeys,
      includeKeyId
    }: {
      mode?: SigningMode;
      value: T;
      valueSchema: Schema<T>;
      signatureExtras: [SignatureExtrasT] extends [never] ? undefined : NoInfer<SignatureExtrasT>;
      signatureExtrasSchema: [SignatureExtrasT] extends [never] ? undefined : Schema<SignatureExtrasT>;
      signingKeys: SigningKeySet;
      includeKeyId?: boolean;
    }
  ): PR<Base64String> => {
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

      return await generateSignatureForString(trace, { mode, value: jsonString, signingKeys, includeKeyId });
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
