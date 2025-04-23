import { SmtpPublicError } from '../types/SmtpPublicError.ts';
import { obfuscateError } from './obfuscateError.ts';

/**
 * A wrapper to handle errors uniformly
 * @param callback
 * @param handler
 */
export function catchSmtpError(callback: (error?: Error) => void, handler: () => Promise<void>) {
  try {
    handler().catch((error) => catchError(error, callback));
  } catch (error) {
    catchError(error, callback);
  }
}

function catchError(error: unknown, callback: (error?: Error) => void) {
  let obfuscated: Error | undefined;
  try {
    obfuscated = obfuscateError(error);
  } catch (error) {}
  callback(obfuscated ?? new SmtpPublicError(451, 'Internal server error'));
}
