import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { VerifyingKeySet } from 'freedom-crypto-data';
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
        const serialization = await valueSchema.serializeAsync(value);
        if (serialization.error !== undefined) {
          return makeFailure(new InternalSchemaValidationError(trace, { message: serialization.error }));
        }

        serialized = serialization.serialized;
      } else {
        const serialization = await schema
          .object<{ value: T; extras: SignatureExtrasT }, 'no-infer'>({
            value: valueSchema,
            extras: signatureExtrasSchema
          })
          .serializeAsync({ value, extras: signatureExtras });
        if (serialization.error !== undefined) {
          return makeFailure(new InternalSchemaValidationError(trace, { message: serialization.error }));
        }

        serialized = serialization.serialized;
      }

      const jsonString = JSON.stringify(serialized);

      return isSignatureValidForString(trace, { signature, value: jsonString, verifyingKeys });
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
