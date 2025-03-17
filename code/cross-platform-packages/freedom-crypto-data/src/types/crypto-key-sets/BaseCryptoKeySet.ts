import type { CryptoKeySetId } from '../CryptoKeySetId.ts';
import type { EncryptionMode } from '../EncryptionMode.ts';
import type { SigningMode } from '../SigningMode.ts';
import type { CryptoKeySetKind } from './CryptoKeySetKind.ts';

/** The base crypto key set type */
export abstract class BaseCryptoKeySet {
  public readonly isCryptoKeySet = true;

  public readonly id: CryptoKeySetId;
  public readonly mode: EncryptionMode | SigningMode;

  protected kind_: CryptoKeySetKind;

  constructor(id: CryptoKeySetId, kind: CryptoKeySetKind, mode: EncryptionMode | SigningMode) {
    this.id = id;
    this.kind_ = kind;
    this.mode = mode;
  }

  public get kind(): CryptoKeySetKind {
    return this.kind_;
  }
}
