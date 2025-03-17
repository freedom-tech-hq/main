import type { CryptoKeySetId } from '../CryptoKeySetId.ts';
import type { PureDecryptingKeySet } from '../PureDecryptingKeySet.ts';
import type { PureEncryptingKeySet } from '../PureEncryptingKeySet.ts';
import type { PureSigningKeySet } from '../PureSigningKeySet.ts';
import type { PureVerifyingKeySet } from '../PureVerifyingKeySet.ts';
import { CombinationCryptoKeySet } from './CombinationCryptoKeySet.ts';
import type { DecryptingKeySetMarker } from './DecryptingKeySetMarker.ts';
import type { PrivateKeySetMarker } from './PrivateKeySetMarker.ts';
import type { SigningKeySetMarker } from './SigningKeySetMarker.ts';

export class PrivateCombinationCryptoKeySet
  extends CombinationCryptoKeySet
  implements PrivateKeySetMarker, DecryptingKeySetMarker, SigningKeySetMarker
{
  public readonly canDecrypt = true;
  public readonly canSign = true;
  public readonly hasPrivateKeys = true;

  public readonly signVerifyKeySet: PureSigningKeySet & PureVerifyingKeySet;
  public readonly encDecKeySet: PureEncryptingKeySet & PureDecryptingKeySet;

  constructor(
    id: CryptoKeySetId,
    {
      signVerifyKeySet,
      encDecKeySet
    }: {
      signVerifyKeySet: PureSigningKeySet & PureVerifyingKeySet;
      encDecKeySet: PureEncryptingKeySet & PureDecryptingKeySet;
    }
  ) {
    super(id, {
      verifyingKeySet: signVerifyKeySet.publicOnly(),
      encryptingKeySet: encDecKeySet.publicOnly()
    });
    this.signVerifyKeySet = signVerifyKeySet;
    this.encDecKeySet = encDecKeySet;
  }

  // Public Methods

  public get forSigning() {
    return this.signVerifyKeySet;
  }

  public get forDecrypting() {
    return this.encDecKeySet;
  }

  public override publicOnly(): CombinationCryptoKeySet {
    return new CombinationCryptoKeySet(this.id, {
      verifyingKeySet: this.signVerifyKeySet.publicOnly(),
      encryptingKeySet: this.encDecKeySet.publicOnly()
    });
  }
}
