import * as openpgp from 'openpgp';

/**
 * Decrypts PGP encrypted content using the provided private key
 *
 * @param encryptedContent The encrypted PGP message
 * @param privateKey The PGP private key to decrypt with
 * @returns Promise resolving to decrypted content
 */
export async function decryptFile(encryptedContent: string, privateKey: openpgp.PrivateKey): Promise<string> {
  // Read the encrypted message
  const message = await openpgp.readMessage({
    armoredMessage: encryptedContent
  });

  // Decrypt the message
  const { data: decrypted } = await openpgp.decrypt({
    message,
    decryptionKeys: privateKey
  });

  return decrypted.toString();
}
