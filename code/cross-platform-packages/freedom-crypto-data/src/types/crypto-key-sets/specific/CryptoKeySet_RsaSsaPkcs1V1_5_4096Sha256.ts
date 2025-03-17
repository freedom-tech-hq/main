import type { CryptoKeySetId } from '../../CryptoKeySetId.ts';
import { BaseCryptoKeySet } from '../BaseCryptoKeySet.ts';
import type { VerifyingKeySetMarker } from '../VerifyingKeySetMarker.ts';

export class CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256 extends BaseCryptoKeySet implements VerifyingKeySetMarker {
  public readonly canVerify = true;

  public readonly rsaPublicKey: CryptoKey;

  constructor(id: CryptoKeySetId, { rsaPublicKey }: { rsaPublicKey: CryptoKey }) {
    super(id, 'RSASSA-PKCS1-v1_5/4096/SHA-256', 'RSASSA-PKCS1-v1_5/4096/SHA-256');

    this.rsaPublicKey = rsaPublicKey;
  }

  public get forVerifying() {
    return this;
  }

  /** Returns a key set without any private information */
  public publicOnly(): CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256 {
    return this;
  }
}
