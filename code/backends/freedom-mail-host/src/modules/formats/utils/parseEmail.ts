import { simpleParser } from 'mailparser';
import type { ParsedEmail } from '../../../types/ParsedEmail.ts';

/**
 * Parse an email string into the Email type
 *
 * @param emailData Raw email data as a string
 * @returns Promise resolving to the parsed Email object
 */
export async function parseEmail(emailData: string): Promise<ParsedEmail> {
  // The function itself is a stable contract. The implementation is 3rd party.
  return simpleParser(emailData);
}
