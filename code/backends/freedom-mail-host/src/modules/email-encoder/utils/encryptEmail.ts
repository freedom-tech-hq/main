import * as openpgp from 'openpgp';

import type { EmailMetadata, EncryptedEmail } from '../../../types/EncryptedEmail.ts';
import type { ParsedEmail } from '../../../types/ParsedEmail.ts';
import type { User } from '../../../types/User.ts';

// TODO: Replace with a real implementation when the EncryptedEmail format will be frozen

/**
 * Encrypt an email for a specific user using their public key
 *
 * @param user User with email and public key
 * @param parsedEmail Parsed email data
 * @returns Promise resolving to encrypted email data
 */
export async function encryptEmail(user: User, parsedEmail: ParsedEmail): Promise<EncryptedEmail> {
  // Extract email data
  let toAddress = '';
  let fromAddress = '';

  // Extract 'to' address from parsed email
  if (parsedEmail.to) {
    // Handle different formats that mailparser might return
    const toText = typeof parsedEmail.to === 'string' ? parsedEmail.to : (parsedEmail.to as any).text || '';
    toAddress = extractEmailAddress(toText);
  }

  // Extract 'from' address from parsed email
  if (parsedEmail.from) {
    // Handle different formats that mailparser might return
    const fromText = typeof parsedEmail.from === 'string' ? parsedEmail.from : (parsedEmail.from as any).text || '';
    fromAddress = extractEmailAddress(fromText);
  }
  const subject = parsedEmail.subject || '(No Subject)';
  const messageId = parsedEmail.messageId ? parsedEmail.messageId.replace(/[<>]/g, '') : 'unknown';

  // Import recipient's public key
  const publicKey = await openpgp.readKey({ armoredKey: user.publicKey });

  // Encrypt the email
  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: parsedEmail.text ?? '' }),
    encryptionKeys: publicKey
  });

  // Create metadata
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const metadata: EmailMetadata = {
    messageId,
    from: fromAddress,
    to: toAddress,
    subject,
    date: parsedEmail.date?.toISOString() || new Date().toISOString(),
    contentType: 'application/pgp-encrypted',
    timestamp,
    headers: JSON.stringify(parsedEmail.headers)
  };

  // Return encrypted email with metadata
  return {
    metadata,
    body: String(encrypted)
  };
}

function extractEmailAddress(addressString: string | undefined): string {
  if (!addressString) {
    return '';
  }

  // Check if the address is in the format "Name <email@example.com>"
  const match = addressString.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }

  // Otherwise, return the original string
  return addressString.toLowerCase();
}
