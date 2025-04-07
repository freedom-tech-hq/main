import { findUsers } from '../../storage/utils/findUsers.ts';
import { parseEmail } from '../../formats/utils/parseEmail.ts';
import { encryptEmail } from './encryptEmail.ts';
import { saveToStorageFolder } from '../../storage/utils/saveToStorageFolder.ts';
import { extractEmailAddresses } from './extractEmailAddresses.ts';

export async function processEmail(mode: 'sent' | 'received', pipedEmail: string): Promise<void> {
  // Parse the email
  const parsedEmail = await parseEmail(pipedEmail);

  // Extract recipient emails
  const emailAddresses: Set<string> = extractEmailAddresses(parsedEmail);

  // Check if there are any recipients
  if (emailAddresses.size === 0) {
    console.warn('Email received with no valid recipients');
    return;
  }

  // Find recipient users
  const users = await findUsers(emailAddresses);

  if (users.length === 0) {
    console.warn(`No registered users found for recipients: ${[...emailAddresses].join(', ')}`);
    return;
  }

  console.log(`Processing email for ${users.length} recipient(s)`);

  // Encrypt email
  await Promise.all(
    users.map(async (user) => {
      // Form encrypted structure
      const encryptedEmail = await encryptEmail(user, parsedEmail);

      // Save to appropriate folder based on mode
      const folder = mode === 'sent' ? 'sent' : 'inbox';
      await saveToStorageFolder(user, folder, encryptedEmail);
    })
  )
}
