import * as config from '../../../config.ts';

/**
 * Authentication handler for SMTP server
 * @param username - SMTP auth username
 * @param _password - SMTP auth password (unused in current implementation)
 * @returns Authentication result with userId or error
 */
export async function onAuth(username: string, _password: string): Promise<{ userId: string } | { error: string }> {
  // This is a mock implementation - we're only checking the domain, not the password
  // Check if the username ends with one of our domains
  const isFromOurDomain = config.SMTP_OUR_DOMAINS.some((domain) => username.endsWith('@' + domain));

  if (isFromOurDomain) {
    return { userId: username };
  } else {
    return { error: 'Authentication failed: Only users from our domains can authenticate' };
  }
}
