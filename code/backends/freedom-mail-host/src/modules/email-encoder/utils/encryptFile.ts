import * as openpgp from 'openpgp';
import type { PublicKey } from '../../../types/PublicKey.ts';

/**
 * Encrypts content (string, Buffer, or object) using the provided public key
 *
 * @param content Content to encrypt
 * @param publicKey The PGP public key to encrypt with
 * @returns Promise resolving to encrypted PGP message
 */
export async function encryptFile(
  content: string | Buffer,
  publicKey: PublicKey,
): Promise<string> {
  // Convert content to appropriate format
  let messageContent: string;

  if (content instanceof Buffer) {
    messageContent = content.toString('utf-8');
  } else if (typeof content === 'object') {
    messageContent = JSON.stringify(content);
  } else {
    messageContent = content;
  }

  // Create OpenPGP message
  const message = await openpgp.createMessage({ text: messageContent });

  // Encrypt the message
  const encrypted = await openpgp.encrypt({
    message,
    encryptionKeys: publicKey
  });

  return encrypted;
}
