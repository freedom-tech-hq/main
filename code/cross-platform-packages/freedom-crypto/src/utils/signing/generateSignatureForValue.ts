import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SigningKeySet, SigningMode } from 'freedom-crypto-data';
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

      return generateSignatureForString(trace, { mode, value: jsonString, signingKeys, includeKeyId });
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
