import * as config from '../../../config.ts';

export function resolveMailAlias(emailAddress: string): string {
  return config.FORWARDING_ROUTES[emailAddress] ?? emailAddress;
}
