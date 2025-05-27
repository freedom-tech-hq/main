import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { getSerializedFixture } from 'freedom-testing-tools';

export async function getPrivateKeysFixture() {
  return await getSerializedFixture(import.meta.dirname, 'fixtures/keys.json', privateCombinationCryptoKeySetSchema);
}
