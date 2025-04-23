import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type ParsedMail, simpleParser } from 'mailparser';

/**
 * Parse an email string into the Email type
 *
 * @param _trace - Trace for async operations
 * @param emailData - Raw email data as a string
 * @returns PR resolving to the parsed Email object TODO: Use StoredMail from freedom-email-sync
 */
export const parseEmail = makeAsyncResultFunc([import.meta.filename], async (_trace, emailData: string): PR<ParsedMail> => {
  const parsed = await simpleParser(emailData);

  // Convert to StoredMail here

  return makeSuccess(parsed);
});
