import { sharedPublicKeysSchema } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { encryptBuffer, generateSignedBuffer } from 'freedom-crypto';
import type { CryptoService } from 'freedom-crypto-service';
import { deserialize } from 'freedom-serialization';
import type { ISyncableStoreAccessControlDocument } from 'freedom-syncable-store-types';

export const encryptAndSignBinary = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    value: Uint8Array,
    { accessControlDoc, cryptoService }: { accessControlDoc: ISyncableStoreAccessControlDocument; cryptoService: CryptoService }
  ): PR<Uint8Array> => {
    const privateKeys = await cryptoService.getPrivateCryptoKeySet(trace);
    if (!privateKeys.ok) {
      return generalizeFailureResult(trace, privateKeys, 'not-found');
    }

    const sharedKeys = await accessControlDoc.getSharedKeys(trace);
    /* node:coverage disable */
    if (!sharedKeys.ok) {
      return sharedKeys;
    }
    /* node:coverage enable */

    const selectedSharedKeysId = sharedKeys.value[sharedKeys.value.length - 1]?.id;
    /* node:coverage disable */
    if (selectedSharedKeysId === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'Failed to determine shared key set ID' }));
    }
    /* node:coverage enable */

    const selectedSharedKeys = sharedKeys.value.find((sharedKeys) => sharedKeys.id === selectedSharedKeysId)!;

    const publicKeysDeserialization = await deserialize(trace, {
      serializedValue: selectedSharedKeys.publicKeys.serializedValue,
      valueSchema: sharedPublicKeysSchema
    });
    if (!publicKeysDeserialization.ok) {
      return publicKeysDeserialization;
    }

    const encryptedValue = await encryptBuffer(trace, { value, encryptingKeys: publicKeysDeserialization.value });
    /* node:coverage disable */
    if (!encryptedValue.ok) {
      return encryptedValue;
    }
    /* node:coverage enable */

    const signedEncryptedValue = await generateSignedBuffer(trace, { value: encryptedValue.value, signingKeys: privateKeys.value });
    /* node:coverage disable */
    if (!signedEncryptedValue.ok) {
      return signedEncryptedValue;
    }
    /* node:coverage enable */

    return makeSuccess(signedEncryptedValue.value);
  }
);
