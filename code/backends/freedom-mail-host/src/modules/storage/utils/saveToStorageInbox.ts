import type { EncryptedEmail } from '../../../types/EncryptedEmail.ts';
import type { User } from '../../../types/User.ts';
import { getBucket } from '../internal/utils/getBucket.ts';

/**
 * Save encrypted email to user's vault inbox
 */
export async function saveToStorageInbox(user: User, encryptedEmail: EncryptedEmail): Promise<void> {
  // This implementation is still a mock for the crypto vault
  const userId = user.email; // Maybe .split('@')[0];
  const { timestamp, messageId } = encryptedEmail.metadata;
  const filename = `${timestamp}_${messageId}.gpg`;
  const gcsFilePath = `${userId}/mail/inbox/${filename}`;

  const bucket = getBucket();
  const file = bucket.file(gcsFilePath);
  await file.save(encryptedEmail.body, { metadata: encryptedEmail.metadata });
}
