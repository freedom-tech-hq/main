import { processEmail } from '../../email-encoder/utils/processEmail.ts';

/**
 * Handler for received emails (no authentication)
 * @param emailData - The email data to process as a string
 */
export async function onReceivedEmail(emailData: string): Promise<void> {
  await processEmail('received', emailData);
}
