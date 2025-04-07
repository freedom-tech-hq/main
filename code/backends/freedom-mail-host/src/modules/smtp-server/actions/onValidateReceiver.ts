import * as config from '../../../config.ts';
import { SmtpPublicError } from '../internal/types/SmtpPublicError.ts';

/**
 * Validates an email recipient to determine if it's a valid recipient
 * @param emailAddress - The email address to validate
 * @returns Promise resolving to 'our' (valid local user), 'external' (external domain), or 'wrong-user' (invalid user)
 */
export async function onValidateReceiver(emailAddress: string): Promise<'our' | 'external' | 'wrong-user'> {
  // Get the domain part of the email
  const [localPart, domain] = emailAddress.split('@');

  if (!domain) {
    throw new SmtpPublicError(550, `Malformed email address: '${emailAddress}'`);
  }

  // Not our domain
  if (!config.SMTP_OUR_DOMAINS.includes(domain)) {
    return 'external';
  }

  // Check if the user exists in our system
  // TODO: Replace with actual user validation from database
  // For now, just a simple check for testing purposes
  if (localPart.startsWith('invalid-')) {
    return 'wrong-user';
  }

  return 'our';
}
