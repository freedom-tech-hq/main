import type { MailAddress, MailAddressList } from 'freedom-email-sync';
import type { EmailAddress } from 'mailparser';

export function convertMailAddress(list: EmailAddress[]): MailAddressList {
  const result: MailAddressList = [];

  for (const addr of list) {
    if (addr.address !== undefined) {
      result.push({
        name: addr.name,
        address: addr.address
      });
    }

    // address and group are mutually exclusive. Typing of 'mailparser' is imperfect TODO: log contradictions
    if (addr.group !== undefined) {
      const addresses: MailAddress[] = [];

      for (const item of addr.group) {
        if (item.address !== undefined) {
          addresses.push({
            name: item.name,
            address: item.address
          });
        }
        // else should not happen TODO: log
      }

      result.push({
        groupName: addr.name,
        addresses
      });
    }
  }

  return result;
}
