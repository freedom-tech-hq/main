import { findUsers } from '../../storage/utils/findUsers.ts';
import { parseEmail } from '../../formats/utils/parseEmail.ts';
import { encryptEmail } from './encryptEmail.ts';
import { saveToStorageInbox } from '../../storage/utils/saveToStorageInbox.ts';
import { extractEmailAddresses } from './extractEmailAddresses.ts';

export async function processEmail(pipedEmail: string): Promise<void> {
  // Parse the email
  const parsedEmail = await parseEmail(pipedEmail);

  // Extract recipient emails
  const emailAddresses: Set<string> = extractEmailAddresses(parsedEmail);

  // Check if there are any recipients
  if (emailAddresses.size === 0) {
    // TODO: Log?
    return;
  }

  // Find recipient users
  const users = await findUsers(emailAddresses);

  // Get current time as ISO string to seconds
  const receivedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  // Encrypt and save email for each recipient
  await Promise.all(
    users.map(async (user) => {
      // Form encrypted structure
      const encryptedEmail = await encryptEmail({
        user,
        parsedEmail,
        receivedAt
      });

      // Save all parts
      await Promise.all([
        // Save render part
        saveToStorageInbox(user, encryptedEmail.render),
        // Save archive part
        saveToStorageInbox(user, encryptedEmail.archive),
        // Save body part
        saveToStorageInbox(user, encryptedEmail.body),
        // Save all attachments
        ...encryptedEmail.attachments.map(attachment =>
          saveToStorageInbox(user, attachment)
        )
      ]);
    })
  )
}
