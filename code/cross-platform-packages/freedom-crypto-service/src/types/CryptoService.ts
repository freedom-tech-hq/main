import type { PRFunc } from 'freedom-async';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';

/**
 * Provides all keys of a particular user.
 *
 * TODO: Rename to UserKeys
 * - The purpose is to provide all the user keys, either from memory or from storage
 * - I want these two words:
 *   - User - critical, because it is per user (not for all users, neither per store root)
 *   - Keys - its functional purpose
 * - No 'set', 'combination', 'private' - The purpose is to provide all the user keys in their maximum form, either from
 *   memory or from storage. The format is in the return-value.
 * - 'Service' is confusing, because it is a per user instance, not a typical service. This whole package with
 *   decryptOneEncryptedValue() is a service.
 * - 'Crypto' is the wider area, narrowing to 'keys'.
 *
 * TODO: revise the package name and purpose.
 *   decryptOneEncryptedValue() is looking like a service. And the name is great.
 *   But the whole package looks as a part of a bigger crypto scope, not a package-worth atomic aspect.
 */
export interface CryptoService {
  /**
   * Get the key(set) listed by getPrivateCryptoKeySetIds()
   *
   * TODO: What does it mean to call it without an id?
   * I suspect the semantics is different. Maybe it should be split into two:
   *   - getAllPrivateCryptoKeySets() - for decryption, instead of getPrivateCryptoKeySetIds + getPrivateCryptoKeySet(id)
   *   - get(Current|Default)PrivateCryptoKeySet() - for encryption
   */
  readonly getPrivateCryptoKeySet: PRFunc<PrivateCombinationCryptoKeySet, 'not-found', [id?: CryptoKeySetId]>;

  /**
   * Enumerate all user's key(set)s
   */
  readonly getPrivateCryptoKeySetIds: PRFunc<CryptoKeySetId[]>;
}
