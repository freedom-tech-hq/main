import type { CryptoKeySetId } from '../CryptoKeySetId.ts';
import type { PureEncryptingKeySet } from '../PureEncryptingKeySet.ts';
import type { PureVerifyingKeySet } from '../PureVerifyingKeySet.ts';
import type { EncryptingKeySetMarker } from './EncryptingKeySetMarker.ts';
import type { VerifyingKeySetMarker } from './VerifyingKeySetMarker.ts';

export class CombinationCryptoKeySet implements EncryptingKeySetMarker, VerifyingKeySetMarker {
  public readonly canEncrypt = true;
  public readonly canVerify = true;

  public readonly id: CryptoKeySetId;
  public readonly verifyingKeySet: PureVerifyingKeySet;
  public readonly encryptingKeySet: PureEncryptingKeySet;

  constructor(
    id: CryptoKeySetId,
    { verifyingKeySet, encryptingKeySet }: { verifyingKeySet: PureVerifyingKeySet; encryptingKeySet: PureEncryptingKeySet }
  ) {
    this.id = id;
    this.verifyingKeySet = verifyingKeySet;
    this.encryptingKeySet = encryptingKeySet;
  }

  // Public Methods

  public get forVerifying() {
    return this.verifyingKeySet;
  }

  public get forEncrypting() {
    return this.encryptingKeySet;
  }

  /** Returns a key set without any private information */
  public publicOnly(): CombinationCryptoKeySet {
    return this;
  }
}
