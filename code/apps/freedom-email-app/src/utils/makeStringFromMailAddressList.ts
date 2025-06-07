import type { MailAddress, MailAddressList, MailAddressListItem } from 'freedom-email-api';
import { isMailAddressGroup } from 'freedom-email-api';

export const makeStringFromMailAddressList = (addresses: MailAddressList): string =>
  addresses.map(makeStringFromMailAddressListItem).join(', ');

export const makeStringFromMailAddressListItem = (item: MailAddressListItem): string => {
  if (isMailAddressGroup(item)) {
    return `${encodeDisplayNameRFC2047(item.groupName)}: ${item.addresses.map(makeStringFromMailAddress).join(', ')};`;
  } else {
    return makeStringFromMailAddress(item);
  }
};

export const makeStringFromMailAddress = (item: MailAddress): string => {
  if ((item.name?.length ?? 0) > 0) {
    return `${encodeDisplayNameRFC2047(item.name!)} <${item.address}>`;
  } else {
    return item.address;
  }
};

/**
 * Encodes a display name for an email address according to RFC 2047.
 * Returns the plain name if it's pure ASCII and safe; otherwise applies Q-encoding.
 */
export function encodeDisplayNameRFC2047(name: string): string {
  const isAsciiSafe = /^[\x20-\x7E]+$/.test(name) && !/[=_?]/.test(name);

  if (isAsciiSafe) {
    // Quote if there are spaces or special characters
    if (/[\s"(),.:;<>@[\]]/.test(name)) {
      const escaped = name.replace(/(["\\])/g, '\\$1');
      return `"${escaped}"`;
    } else {
      return name;
    }
  }

  // Perform Q-encoding
  const utf8 = Buffer.from(name, 'utf8');
  let encoded = '';

  for (const byte of utf8) {
    const char = String.fromCharCode(byte);
    if (
      (byte >= 33 && byte <= 60) || // safe printable ASCII (excluding = ?)
      (byte >= 62 && byte <= 126 && byte !== 63 && byte !== 95) // exclude '?' and '_'
    ) {
      encoded += char;
    } else if (byte === 32) {
      encoded += '_'; // space → underscore
    } else {
      encoded += '=' + byte.toString(16).toUpperCase().padStart(2, '0');
    }
  }

  return `=?UTF-8?Q?${encoded}?=`;
}
