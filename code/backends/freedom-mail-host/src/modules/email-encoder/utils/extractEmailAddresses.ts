import type { ParsedEmail, EmailAddress } from '../../../types/ParsedEmail.ts';

/**
 * Helper function to extract email addresses from all recipient fields
 * @param email The parsed email object
 * @returns Set of unique email addresses
 */
export function extractEmailAddresses(email: ParsedEmail): Set<string> {
  const addresses: Set<string> = new Set();

  // Helper to process array of EmailAddress objects
  const processAddresses = (emailAddresses: EmailAddress[] | undefined) => {
    if (!emailAddresses) return;
    for (const addr of emailAddresses) {
      if (addr.email) {
        addresses.add(addr.email);
      }
    }
  };

  // Process all recipient fields from render metadata
  processAddresses(email.render.to);
  processAddresses(email.render.cc);
  processAddresses(email.render.bcc);

  return addresses;
}
