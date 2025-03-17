import type { CryptoKeySetId } from '../../CryptoKeySetId.ts';
import type { PrivateKeySetMarker } from '../PrivateKeySetMarker.ts';
import type { SigningKeySetMarker } from '../SigningKeySetMarker.ts';
import { CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256 } from './CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256.ts';

export class PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256
  extends CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256
  implements PrivateKeySetMarker, SigningKeySetMarker
{
  public readonly canSign = true;
  public readonly hasPrivateKeys = true;

  public readonly rsaPrivateKey: CryptoKey;

  /** `PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256.makePrivate` should be used in most cases instead of directly calling the constructor */
  constructor(id: CryptoKeySetId, { rsaKeyPair }: { rsaKeyPair: { publicKey: CryptoKey; privateKey: CryptoKey } }) {
    super(id, { rsaPublicKey: rsaKeyPair.publicKey });
    this.kind_ = 'private:RSASSA-PKCS1-v1_5/4096/SHA-256';

    this.rsaPrivateKey = rsaKeyPair.privateKey;
  }

  public get forSigning() {
    return this;
  }

  public override publicOnly(): CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256 {
    return new CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256(this.id, { rsaPublicKey: this.rsaPublicKey });
  }
}
