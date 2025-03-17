import type { CryptoKeySetId } from '../../CryptoKeySetId.ts';
import type { DecryptingKeySetMarker } from '../DecryptingKeySetMarker.ts';
import type { PrivateKeySetMarker } from '../PrivateKeySetMarker.ts';
import { CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm } from './CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm.ts';

export class PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm
  extends CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm
  implements PrivateKeySetMarker, DecryptingKeySetMarker
{
  public readonly canDecrypt = true;
  public readonly hasPrivateKeys = true;

  public readonly rsaPrivateKey: CryptoKey;

  constructor(id: CryptoKeySetId, { rsaKeyPair }: { rsaKeyPair: { publicKey: CryptoKey; privateKey: CryptoKey } }) {
    super(id, { rsaPublicKey: rsaKeyPair.publicKey });
    this.kind_ = 'private:RSA-OAEP/4096/SHA-256+AES/256/GCM';

    this.rsaPrivateKey = rsaKeyPair.privateKey;
  }

  public get forDecrypting() {
    return this;
  }

  public override publicOnly(): CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm {
    return new CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm(this.id, { rsaPublicKey: this.rsaPublicKey });
  }
}
