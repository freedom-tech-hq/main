import { SmtpPublicError } from '../types/SmtpPublicError.ts';

/**
 * Logic to decide what to expose back to the client and what not to
 * @param error
 */
export function obfuscateError(error: unknown): SmtpPublicError | undefined {
  if (error instanceof SmtpPublicError) {
    return error;
  }

  return undefined;
}
