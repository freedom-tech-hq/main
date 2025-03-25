import type { User } from '../../../types/User.ts';
import type { EncryptedPart } from '../../../types/EncryptedEmail.ts';
import { getBucket } from '../internal/utils/getBucket.ts';

/**
 * Save encrypted part to user's vault inbox
 */
export async function saveToStorageInbox(
  user: User,
  part: EncryptedPart<unknown>,
): Promise<void> {
  // This implementation is still a mock for the crypto vault
  const userId = user.email; // Maybe .split('@')[0];
  const gcsFilePath = `${userId}/mail/inbox/${part.filename}`;

  const bucket = getBucket();
  const file = bucket.file(gcsFilePath);
  await file.save(part.payload);
}
