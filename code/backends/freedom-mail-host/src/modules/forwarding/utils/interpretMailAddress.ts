import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';

import type * as realConfig from '../../../config.ts';

export type InterpretMailAddressResult = {
  type:
    | 'our' // denoted = target, our, normalized
    | 'external' // denoted = target, external, preserved
    | 'forwarding-our' // denoted != target, both our, normalized
    | 'forwarding-external'; // denoted is our, normalized. target is external, preserved

  // our are always normalized, external are always preserved
  denoted: string;
  target: string;
};

/**
 * This function normalizes our email addresses and resolves aliases
 */
export const interpretMailAddress = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    emailAddress: string,
    // Allow override the config in tests TODO: re-engineer config itself, make it mockable
    config: Pick<typeof realConfig, 'FORWARDING_ROUTES' | 'SMTP_OUR_DOMAINS'>
  ): PR<InterpretMailAddressResult, 'malformed-email-address'> => {
    // Get the domain part of the email
    const [rawName, rawDomain] = emailAddress.split('@');
    if (rawDomain === undefined || rawDomain === '') {
      return makeFailure(
        new NotFoundError(trace, {
          errorCode: 'malformed-email-address',
          message: `Malformed email address: '${emailAddress}'`
        })
      );
    }
    const domain = rawDomain.toLowerCase();

    // Not our domain case
    if (!config.SMTP_OUR_DOMAINS.includes(domain)) {
      return makeSuccess<InterpretMailAddressResult>({
        type: 'external',
        denoted: emailAddress,
        target: emailAddress
      });
    }

    // Our domain case
    // Normalize, strip aliases and make lowercase
    const name = rawName.replace(/\+.*/, '').toLowerCase();
    const normalizedEmail = `${name}@${domain}`;

    // Resolve alias. Results are already normalized
    const target = config.FORWARDING_ROUTES[normalizedEmail] ?? normalizedEmail;

    // No forwarding
    if (target === normalizedEmail) {
      return makeSuccess<InterpretMailAddressResult>({
        type: 'our',
        denoted: normalizedEmail,
        target: normalizedEmail
      });
    }

    // Forwarding
    const [, targetDomain] = target.split('@');
    const isTargetExternal = !config.SMTP_OUR_DOMAINS.includes(targetDomain);

    return makeSuccess<InterpretMailAddressResult>({
      type: isTargetExternal ? 'forwarding-external' : 'forwarding-our',
      denoted: normalizedEmail,
      target
    });
  }
);
