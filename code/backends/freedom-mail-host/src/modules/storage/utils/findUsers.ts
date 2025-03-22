import type { User } from '../../../types/User.ts';
import * as config from '../../../config.ts';
import { getBucket } from '../internal/utils/getBucket.ts';

/**
 * Find users by email
 */
export async function findUsers(emailAddresses: Set<string>): Promise<User[]> {
  // Load mocked DB
  const bucket = getBucket();
  const file = bucket.file(config.USERS_FILE);
  const [content] = await file.download();
  const allUsers: { [email: string]: string } = JSON.parse(content.toString());

  // Filter relevant
  const result: User[] = [];
  for (const email in allUsers) {
    if (!emailAddresses.has(email)) {
      continue;
    }

    result.push({
      email,
      publicKey: allUsers[email],
    });
  }

  return result;
}
