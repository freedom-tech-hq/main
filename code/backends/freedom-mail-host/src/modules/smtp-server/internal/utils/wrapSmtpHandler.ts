import type { PR } from 'freedom-async';

import type { SmtpPublicErrorCodes } from '../types/SmtpPublicErrorCodes.ts';

const errorCodes: Record<SmtpPublicErrorCodes, number> = {
  forbidden: 550,
  'invalid-credentials': 535,
  'malformed-email-address': 550,
  'message-too-long': 522,
  'user-not-found': 550,
  'relay-denied': 550,
  'stream-error': 451,
  'require-tls': 538
};

/**
 * An error class that is matching the contract expected by smtp-server
 * Do not export
 */
class SmtpPublicError extends Error {
  constructor(
    public readonly responseCode: number,
    message: string
  ) {
    super(message);
  }

  static newGeneralError() {
    return new SmtpPublicError(451, 'Internal server error');
  }
}

/**
 * A wrapper to handle errors uniformly
 * @param callback - smtp-server callback
 * @param handler - Our code
 */
export function wrapSmtpHandler<T = void>(
  callback: (error: Error | null | undefined, result?: T) => void,
  handler: () => PR<T, SmtpPublicErrorCodes>
) {
  try {
    handler()
      .then((result) => {
        if (!result.ok) {
          const { errorCode } = result.value;

          // Generic error
          if (!isKnownCode(errorCode)) {
            callback(SmtpPublicError.newGeneralError());
            return;
          }

          // Known error type
          callback(new SmtpPublicError(errorCodes[errorCode], result.value.message));
          return;
        }

        // Success
        callback(undefined, result.value);
      })
      .catch((_error) => {
        // General async error
        callback(SmtpPublicError.newGeneralError());
      });
  } catch (_error) {
    // General sync error
    callback(SmtpPublicError.newGeneralError());
  }
}

function isKnownCode(errorCode: string): errorCode is SmtpPublicErrorCodes {
  return errorCode in errorCodes;
}
