import { symmetricalAlgorithmByEncryptionMode } from '../../../consts/symmetricalAlgorithmByEncryptionMode.ts';
import { AUTO_ROTATE_AES_KEYS_AFTER_N_ENCRYPTS } from '../../../internal/consts/aes.ts';
import { inline } from '../../../internal/utils/inline.ts';
import type { CryptoKeySetId } from '../../CryptoKeySetId.ts';
import { BaseCryptoKeySet } from '../BaseCryptoKeySet.ts';
import type { EncryptingKeySetMarker } from '../EncryptingKeySetMarker.ts';

export class CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm extends BaseCryptoKeySet implements EncryptingKeySetMarker {
  public readonly canEncrypt = true;

  public readonly rsaPublicKey: CryptoKey;

  private aesKeyPromise_: Promise<CryptoKey> | undefined;
  private rawAesKeyPromise_: Promise<Uint8Array> | undefined;
  private ivUseCount_ = 0;

  constructor(id: CryptoKeySetId, { rsaPublicKey }: { rsaPublicKey: CryptoKey }) {
    super(id, 'RSA-OAEP/4096/SHA-256+AES/256/GCM', 'RSA-OAEP/4096/SHA-256+AES/256/GCM');

    this.rsaPublicKey = rsaPublicKey;
  }

  // Public Methods

  public get forEncrypting() {
    return this;
  }

  public async getAesKey(): Promise<CryptoKey> {
    if (this.aesKeyPromise_ === undefined) {
      this.aesKeyPromise_ = inline(async (): Promise<CryptoKey> => {
        const aesKey = await crypto.subtle.generateKey(symmetricalAlgorithmByEncryptionMode['AES/256/GCM'], true, ['encrypt', 'decrypt']);
        /* node:coverage disable */
        if (!(aesKey instanceof CryptoKey)) {
          throw new Error('Expected CryptoKey');
        }
        /* node:coverage enable */

        return aesKey;
      });
    }

    return await this.aesKeyPromise_;
  }

  public async getRawAesKey(): Promise<{ raw: Uint8Array; native: CryptoKey }> {
    const lastAesKeyPromise = this.aesKeyPromise_;
    const aesKey = await this.getAesKey();
    if (this.aesKeyPromise_ !== lastAesKeyPromise) {
      // Trying again because the key was rotated in between
      return await this.getRawAesKey();
    }

    if (this.rawAesKeyPromise_ === undefined) {
      this.rawAesKeyPromise_ = inline(async (): Promise<Uint8Array> => {
        const arrayBuffer = await crypto.subtle.exportKey('raw', aesKey);
        return new Uint8Array(arrayBuffer);
      });
    }

    const lastRawAesKeyPromise = this.rawAesKeyPromise_;
    const rawAesKey = await this.rawAesKeyPromise_;
    if (this.rawAesKeyPromise_ !== lastRawAesKeyPromise) {
      // Trying again because the key was rotated in between
      return await this.getRawAesKey();
    }

    return { raw: rawAesKey, native: aesKey };
  }

  public async getNextIv(): Promise<Uint8Array> {
    this.ivUseCount_ += 1;
    if (this.ivUseCount_ > AUTO_ROTATE_AES_KEYS_AFTER_N_ENCRYPTS) {
      this.ivUseCount_ = 0;
      this.rotateAesKey();
    }
    return crypto.getRandomValues(new Uint8Array(12));
  }

  /** Returns a key set without any private information */
  public publicOnly(): CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm {
    return this;
  }

  public rotateAesKey() {
    this.aesKeyPromise_ = undefined;
    this.rawAesKeyPromise_ = undefined;
  }
}
