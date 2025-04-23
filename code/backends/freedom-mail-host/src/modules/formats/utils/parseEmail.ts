import { type ParsedMail, simpleParser } from 'mailparser';

/**
 * Parse an email string into the Email type
 *
 * @param emailData Raw email data as a string
 * @returns Promise resolving to the parsed Email object TODO: Use StoredMail from freedom-email-sync
 */
export async function parseEmail(emailData: string): Promise<ParsedMail> {
  // The function itself is a stable contract. The implementation is 3rd party.
  return simpleParser(emailData);
}
