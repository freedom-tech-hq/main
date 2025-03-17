import type { PR, PRFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type {
  CryptoKeySetId,
  EncryptedValue,
  EncryptingKeySet,
  EncryptionMode,
  SignedValue,
  SigningMode,
  VerifyingKeySet
} from 'freedom-crypto-data';
import type { Schema } from 'yaschema';

export interface CryptoService {
  readonly getCryptoKeySetIds: PRFunc<CryptoKeySetId[]>;

  readonly decryptEncryptedValue: <T>(trace: Trace, encryptedValue: EncryptedValue<T>) => PR<T>;

  readonly generateEncryptedValue: <T>(
    trace: Trace,
    args: { cryptoKeySetId?: CryptoKeySetId; value: T; valueSchema: Schema<T>; mode?: EncryptionMode; includeKeyId?: boolean }
  ) => PR<EncryptedValue<T>>;

  readonly generateSignedBuffer: PRFunc<
    Uint8Array,
    never,
    [args: { cryptoKeySetId?: CryptoKeySetId; value: Uint8Array; mode?: SigningMode }]
  >;

  readonly generateSignedValue: <T, SignatureExtrasT = never>(
    trace: Trace,
    args: {
      cryptoKeySetId?: CryptoKeySetId;
      value: T;
      valueSchema: Schema<T>;
      signatureExtras: [SignatureExtrasT] extends [never] ? undefined : NoInfer<SignatureExtrasT>;
      signatureExtrasSchema: [SignatureExtrasT] extends [never] ? undefined : Schema<SignatureExtrasT>;
      mode?: SigningMode;
    }
  ) => PR<SignedValue<T, SignatureExtrasT>>;

  readonly getEncryptingKeySetForId: PRFunc<EncryptingKeySet, 'not-found', [id: CryptoKeySetId]>;
  readonly getVerifyingKeySetForId: PRFunc<VerifyingKeySet, 'not-found', [id: CryptoKeySetId]>;

  readonly isSignatureValidForSignedBuffer: PRFunc<boolean, never, [args: { signedBuffer: Uint8Array }]>;

  readonly isSignedValueValid: <T, SignatureExtrasT>(
    trace: Trace,
    signedValue: SignedValue<T, SignatureExtrasT>,
    signatureExtras: [SignatureExtrasT] extends [never] ? undefined : NoInfer<SignatureExtrasT>
  ) => PR<boolean>;
}
