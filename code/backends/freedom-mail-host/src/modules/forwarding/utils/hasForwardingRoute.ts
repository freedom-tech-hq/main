import * as config from '../../../config.ts';

export function hasForwardingRoute(emailAddress: string): boolean {
  return config.FORWARDING_ROUTES[emailAddress] !== undefined;
}
