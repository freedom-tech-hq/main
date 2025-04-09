import { processEmail2 } from '../../email-encoder/utils/processEmail2.ts';

/**
 * Handler for received emails (no authentication)
 * @param emailData - The email data to process as a string
 */
export async function onReceivedEmail(emailData: string): Promise<void> {
  await processEmail2(emailData);
}
