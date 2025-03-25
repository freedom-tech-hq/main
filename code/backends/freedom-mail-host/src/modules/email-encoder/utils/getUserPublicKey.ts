import * as openpgp from 'openpgp';

import type { User } from '../../../types/User.ts';
import type { PublicKey } from '../../../types/PublicKey.ts';

export async function getUserPublicKey(user: User): Promise<PublicKey> {
  return openpgp.readKey({ armoredKey: user.publicKey });
}
