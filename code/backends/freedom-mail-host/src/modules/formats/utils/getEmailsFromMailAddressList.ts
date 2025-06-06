import type { MailAddressList } from 'freedom-email-api';

/**
 * Extracts email addresses from a MailAddressList.
 * The function handles both individual MailAddress objects and MailAddressGroup objects.
 *
 * @param mailAddressList - The list of mail addresses to extract emails from
 * @returns An array of email address strings
 */
export function getEmailsFromMailAddressList(mailAddressList: MailAddressList | undefined): string[] {
  if (mailAddressList === undefined) {
    return [];
  }

  const result: string[] = [];

  for (const item of mailAddressList) {
    if ('address' in item) {
      result.push(item.address);
    } else if ('groupName' in item && 'addresses' in item) {
      for (const address of item.addresses) {
        result.push(address.address);
      }
    }
  }

  return result;
}
